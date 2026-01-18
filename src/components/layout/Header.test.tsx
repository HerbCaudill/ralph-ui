import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest"
import { Header } from "./Header"
import { useAppStore } from "@/store"

// Mock fetch
const mockFetch = vi.fn()
;(globalThis as { fetch: typeof fetch }).fetch = mockFetch

describe("Header", () => {
  const mockWorkspaceResponse = {
    ok: true,
    workspace: {
      path: "/path/to/my-project",
      name: "my-project",
      issueCount: 42,
      daemonConnected: true,
      daemonStatus: "healthy",
    },
  }

  beforeEach(() => {
    // Reset store state before each test
    useAppStore.getState().reset()
    vi.clearAllMocks()
    // Default mock for fetch
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockWorkspaceResponse),
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("renders the logo", async () => {
    render(<Header />)
    expect(screen.getByText("Ralph")).toBeInTheDocument()
  })

  it("shows 'No workspace' when workspace is null and fetch fails", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ ok: true, workspace: null }),
    })
    render(<Header />)
    // Initially shows "No workspace" before fetch completes
    expect(screen.getByText("No workspace")).toBeInTheDocument()
  })

  it("shows workspace name when workspace is fetched", async () => {
    render(<Header />)

    await waitFor(() => {
      expect(screen.getByText("my-project")).toBeInTheDocument()
    })
  })

  it("shows 'Disconnected' status when disconnected", async () => {
    render(<Header />)
    expect(screen.getByText("Disconnected")).toBeInTheDocument()
  })

  it("shows 'Connected' status when connected", async () => {
    useAppStore.getState().setConnectionStatus("connected")
    render(<Header />)
    expect(screen.getByText("Connected")).toBeInTheDocument()
  })

  it("shows 'Connecting...' status when connecting", async () => {
    useAppStore.getState().setConnectionStatus("connecting")
    render(<Header />)
    expect(screen.getByText("Connecting...")).toBeInTheDocument()
  })

  it("toggles workspace dropdown when clicked", async () => {
    render(<Header />)

    await waitFor(() => {
      expect(screen.getByText("my-project")).toBeInTheDocument()
    })

    // Dropdown should be closed initially
    expect(screen.queryByText("Current Workspace")).not.toBeInTheDocument()

    // Click the workspace picker button
    const workspaceButton = screen.getByRole("button", { expanded: false })
    fireEvent.click(workspaceButton)

    // Dropdown should be open
    expect(screen.getByText("Current Workspace")).toBeInTheDocument()
    expect(screen.getByText("Open workspace...")).toBeInTheDocument()
  })

  it("closes dropdown when clicking outside", async () => {
    render(<Header />)

    await waitFor(() => {
      expect(screen.getByText("my-project")).toBeInTheDocument()
    })

    // Open the dropdown
    const workspaceButton = screen.getByRole("button", { expanded: false })
    fireEvent.click(workspaceButton)

    // Dropdown should be open
    expect(screen.getByText("Current Workspace")).toBeInTheDocument()

    // Click outside (on the document)
    fireEvent.mouseDown(document.body)

    // Dropdown should be closed
    expect(screen.queryByText("Current Workspace")).not.toBeInTheDocument()
  })

  it("applies custom className", async () => {
    const { container } = render(<Header className="custom-class" />)
    expect(container.firstChild).toHaveClass("custom-class")
  })
})
