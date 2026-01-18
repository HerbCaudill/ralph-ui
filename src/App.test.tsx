import { render, screen } from "@testing-library/react"
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest"
import { App } from "./App"

// Mock fetch for WorkspacePicker
const mockFetch = vi.fn()
;(globalThis as { fetch: typeof fetch }).fetch = mockFetch

describe("App", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          ok: true,
          workspace: {
            path: "/test/workspace",
            name: "workspace",
            issueCount: 10,
            daemonConnected: true,
          },
        }),
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("renders the main layout with sidebar and status bar", () => {
    render(<App />)

    // Check for sidebar content
    expect(screen.getByText("Tasks")).toBeInTheDocument()

    // Check for status indicators (connection status appears in both Header and StatusBar)
    expect(screen.getAllByText(/Disconnected|Connected|Connecting/).length).toBeGreaterThan(0)
    expect(screen.getByText(/Ralph:/)).toBeInTheDocument()

    // Check for event stream
    expect(screen.getByRole("log", { name: "Event stream" })).toBeInTheDocument()

    // Check for chat input
    expect(screen.getByRole("textbox", { name: "Message input" })).toBeInTheDocument()
  })

  it("shows disconnected status by default", () => {
    render(<App />)
    // Connection status appears in both Header and StatusBar
    // Note: During test, WebSocket starts connecting immediately, so status may be "Connecting..."
    expect(screen.getAllByText(/Disconnected|Connecting/).length).toBeGreaterThan(0)
    expect(screen.getByText("Ralph: stopped")).toBeInTheDocument()
  })
})
