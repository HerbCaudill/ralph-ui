import { render, screen } from "@testing-library/react"
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest"
import { App } from "./App"

// Mock fetch for WorkspacePicker
const mockFetch = vi.fn()
;(globalThis as { fetch: typeof fetch }).fetch = mockFetch

// Mock matchMedia for theme detection
const mockMatchMedia = vi.fn().mockImplementation((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}))

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
    // Mock matchMedia for theme detection
    window.matchMedia = mockMatchMedia
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
