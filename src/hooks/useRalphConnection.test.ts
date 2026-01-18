import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useRalphConnection } from "./useRalphConnection"
import { useAppStore } from "../store"

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3

  readyState = MockWebSocket.CONNECTING
  url: string

  onopen: ((event: Event) => void) | null = null
  onclose: ((event: CloseEvent) => void) | null = null
  onmessage: ((event: MessageEvent) => void) | null = null
  onerror: ((event: Event) => void) | null = null

  // Track calls for testing
  static instances: MockWebSocket[] = []
  sentMessages: string[] = []

  constructor(url: string) {
    this.url = url
    MockWebSocket.instances.push(this)
  }

  send(data: string): void {
    this.sentMessages.push(data)
  }

  close(): void {
    this.readyState = MockWebSocket.CLOSED
    if (this.onclose) {
      this.onclose(new CloseEvent("close"))
    }
  }

  ping(): void {
    // No-op for mock
  }

  // Test helpers
  simulateOpen(): void {
    this.readyState = MockWebSocket.OPEN
    if (this.onopen) {
      this.onopen(new Event("open"))
    }
  }

  simulateMessage(data: unknown): void {
    if (this.onmessage) {
      this.onmessage(new MessageEvent("message", { data: JSON.stringify(data) }))
    }
  }

  simulateClose(code = 1000, reason = ""): void {
    this.readyState = MockWebSocket.CLOSED
    if (this.onclose) {
      this.onclose(new CloseEvent("close", { code, reason }))
    }
  }
}

// Install mock using window (DOM environment)
const originalWebSocket = window.WebSocket

beforeEach(() => {
  MockWebSocket.instances = []
  window.WebSocket = MockWebSocket as unknown as typeof WebSocket
  vi.useFakeTimers()
  // Reset store
  useAppStore.getState().reset()
})

afterEach(() => {
  window.WebSocket = originalWebSocket
  vi.useRealTimers()
})

describe("useRalphConnection", () => {
  describe("connection", () => {
    it("connects automatically by default", () => {
      renderHook(() => useRalphConnection({ url: "ws://localhost:3000/ws" }))

      expect(MockWebSocket.instances).toHaveLength(1)
      expect(MockWebSocket.instances[0].url).toBe("ws://localhost:3000/ws")
    })

    it("does not connect automatically when autoConnect is false", () => {
      renderHook(() => useRalphConnection({ url: "ws://localhost:3000/ws", autoConnect: false }))

      expect(MockWebSocket.instances).toHaveLength(0)
    })

    it("updates connection status in store when connected", () => {
      renderHook(() => useRalphConnection({ url: "ws://localhost:3000/ws" }))

      // Initially connecting
      expect(useAppStore.getState().connectionStatus).toBe("connecting")

      // Simulate connection open
      act(() => {
        MockWebSocket.instances[0].simulateOpen()
      })

      expect(useAppStore.getState().connectionStatus).toBe("connected")
    })

    it("updates connection status in store when disconnected", () => {
      renderHook(() => useRalphConnection({ url: "ws://localhost:3000/ws" }))

      act(() => {
        MockWebSocket.instances[0].simulateOpen()
      })

      act(() => {
        MockWebSocket.instances[0].simulateClose()
      })

      expect(useAppStore.getState().connectionStatus).toBe("disconnected")
    })
  })

  describe("sendMessage", () => {
    it("sends chat_message via WebSocket", () => {
      const { result } = renderHook(() => useRalphConnection({ url: "ws://localhost:3000/ws" }))

      act(() => {
        MockWebSocket.instances[0].simulateOpen()
      })

      act(() => {
        result.current.sendMessage("Hello, ralph!")
      })

      expect(MockWebSocket.instances[0].sentMessages).toEqual([
        JSON.stringify({ type: "chat_message", message: "Hello, ralph!" }),
      ])
    })

    it("does not send when not connected", () => {
      const { result } = renderHook(() => useRalphConnection({ url: "ws://localhost:3000/ws" }))

      // Still in connecting state
      act(() => {
        result.current.sendMessage("Hello!")
      })

      expect(MockWebSocket.instances[0].sentMessages).toEqual([])
    })
  })

  describe("message handling", () => {
    it("handles ralph:event messages", () => {
      renderHook(() => useRalphConnection({ url: "ws://localhost:3000/ws" }))

      act(() => {
        MockWebSocket.instances[0].simulateOpen()
      })

      const event = { type: "tool_use", timestamp: 1234, tool: "read" }

      act(() => {
        MockWebSocket.instances[0].simulateMessage({ type: "ralph:event", event })
      })

      expect(useAppStore.getState().events).toContainEqual(event)
    })

    it("handles ralph:status messages", () => {
      renderHook(() => useRalphConnection({ url: "ws://localhost:3000/ws" }))

      act(() => {
        MockWebSocket.instances[0].simulateOpen()
      })

      act(() => {
        MockWebSocket.instances[0].simulateMessage({ type: "ralph:status", status: "running" })
      })

      expect(useAppStore.getState().ralphStatus).toBe("running")
    })

    it("handles ralph:output messages", () => {
      renderHook(() => useRalphConnection({ url: "ws://localhost:3000/ws" }))

      act(() => {
        MockWebSocket.instances[0].simulateOpen()
      })

      act(() => {
        MockWebSocket.instances[0].simulateMessage({
          type: "ralph:output",
          line: "Some output",
          timestamp: 1234,
        })
      })

      expect(useAppStore.getState().events).toContainEqual(
        expect.objectContaining({ type: "output", line: "Some output" }),
      )
    })

    it("handles ralph:error messages", () => {
      renderHook(() => useRalphConnection({ url: "ws://localhost:3000/ws" }))

      act(() => {
        MockWebSocket.instances[0].simulateOpen()
      })

      act(() => {
        MockWebSocket.instances[0].simulateMessage({
          type: "ralph:error",
          error: "Something went wrong",
          timestamp: 1234,
        })
      })

      expect(useAppStore.getState().events).toContainEqual(
        expect.objectContaining({ type: "error", error: "Something went wrong" }),
      )
    })

    it("handles ralph:exit messages", () => {
      renderHook(() => useRalphConnection({ url: "ws://localhost:3000/ws" }))

      act(() => {
        MockWebSocket.instances[0].simulateOpen()
      })

      act(() => {
        MockWebSocket.instances[0].simulateMessage({
          type: "ralph:exit",
          code: 0,
          signal: null,
          timestamp: 1234,
        })
      })

      expect(useAppStore.getState().events).toContainEqual(
        expect.objectContaining({ type: "exit", code: 0, signal: null }),
      )
    })

    it("handles user_message messages", () => {
      renderHook(() => useRalphConnection({ url: "ws://localhost:3000/ws" }))

      act(() => {
        MockWebSocket.instances[0].simulateOpen()
      })

      act(() => {
        MockWebSocket.instances[0].simulateMessage({
          type: "user_message",
          message: "Hello!",
          timestamp: 1234,
        })
      })

      expect(useAppStore.getState().events).toContainEqual(
        expect.objectContaining({ type: "user_message", message: "Hello!" }),
      )
    })

    it("handles server error messages", () => {
      renderHook(() => useRalphConnection({ url: "ws://localhost:3000/ws" }))

      act(() => {
        MockWebSocket.instances[0].simulateOpen()
      })

      act(() => {
        MockWebSocket.instances[0].simulateMessage({
          type: "error",
          error: "Ralph is not running",
          timestamp: 1234,
        })
      })

      expect(useAppStore.getState().events).toContainEqual(
        expect.objectContaining({ type: "server_error", error: "Ralph is not running" }),
      )
    })
  })

  describe("connect and disconnect", () => {
    it("provides connect function", () => {
      const { result } = renderHook(() =>
        useRalphConnection({ url: "ws://localhost:3000/ws", autoConnect: false }),
      )

      expect(result.current.isConnected).toBe(false)
      expect(MockWebSocket.instances).toHaveLength(0)

      act(() => {
        result.current.connect()
      })

      expect(MockWebSocket.instances).toHaveLength(1)
      expect(result.current.status).toBe("connecting")

      act(() => {
        MockWebSocket.instances[0].simulateOpen()
      })

      expect(result.current.isConnected).toBe(true)
    })

    it("provides disconnect function", () => {
      const { result } = renderHook(() => useRalphConnection({ url: "ws://localhost:3000/ws" }))

      act(() => {
        MockWebSocket.instances[0].simulateOpen()
      })

      expect(result.current.isConnected).toBe(true)

      act(() => {
        result.current.disconnect()
      })

      expect(result.current.isConnected).toBe(false)
      expect(result.current.status).toBe("disconnected")
    })
  })

  describe("status property", () => {
    it("returns current connection status", () => {
      const { result } = renderHook(() => useRalphConnection({ url: "ws://localhost:3000/ws" }))

      expect(result.current.status).toBe("connecting")

      act(() => {
        MockWebSocket.instances[0].simulateOpen()
      })

      expect(result.current.status).toBe("connected")
    })
  })
})
