import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest"
import { WorkspacePicker } from "./WorkspacePicker"
import { useAppStore } from "@/store"

// Mock fetch
const mockFetch = vi.fn()
;(globalThis as { fetch: typeof fetch }).fetch = mockFetch

describe("WorkspacePicker", () => {
  beforeEach(() => {
    // Reset store state before each test
    useAppStore.getState().reset()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const mockWorkspaceResponse = {
    ok: true,
    workspace: {
      path: "/Users/test/my-project",
      name: "my-project",
      issueCount: 42,
      daemonConnected: true,
      daemonStatus: "healthy",
    },
  }

  it("renders with loading state initially", async () => {
    // Mock fetch that never resolves during initial render
    mockFetch.mockImplementation(() => new Promise(() => {}))

    render(<WorkspacePicker />)

    // Should show "No workspace" initially before fetch completes
    expect(screen.getByRole("button")).toBeInTheDocument()
  })

  it("fetches workspace info on mount", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockWorkspaceResponse),
    })

    render(<WorkspacePicker />)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/api/workspace")
    })
  })

  it("displays workspace name after fetch", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockWorkspaceResponse),
    })

    render(<WorkspacePicker />)

    await waitFor(() => {
      expect(screen.getByText("my-project")).toBeInTheDocument()
    })
  })

  it("displays issue count badge after fetch", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockWorkspaceResponse),
    })

    render(<WorkspacePicker />)

    await waitFor(() => {
      expect(screen.getByText("42")).toBeInTheDocument()
    })
  })

  it("updates store with workspace path", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockWorkspaceResponse),
    })

    render(<WorkspacePicker />)

    await waitFor(() => {
      expect(useAppStore.getState().workspace).toBe("/Users/test/my-project")
    })
  })

  it("toggles dropdown when clicked", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockWorkspaceResponse),
    })

    render(<WorkspacePicker />)

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

  it("shows workspace details in dropdown", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockWorkspaceResponse),
    })

    render(<WorkspacePicker />)

    await waitFor(() => {
      expect(screen.getByText("my-project")).toBeInTheDocument()
    })

    // Open dropdown
    const workspaceButton = screen.getByRole("button", { expanded: false })
    fireEvent.click(workspaceButton)

    // Should show workspace details
    expect(screen.getByText("/Users/test/my-project")).toBeInTheDocument()
    expect(screen.getByText("42 issues")).toBeInTheDocument()
    expect(screen.getByText("Daemon connected")).toBeInTheDocument()
  })

  it("closes dropdown when clicking outside", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockWorkspaceResponse),
    })

    render(<WorkspacePicker />)

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

  it("shows error state when fetch fails", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ ok: false, error: "Connection failed" }),
    })

    render(<WorkspacePicker />)

    await waitFor(() => {
      // Should still show the button
      expect(screen.getByRole("button")).toBeInTheDocument()
    })

    // Open dropdown to see error
    const workspaceButton = screen.getByRole("button")
    fireEvent.click(workspaceButton)

    await waitFor(() => {
      // Fetch failures are treated as server not running (shows in button and dropdown)
      expect(screen.getAllByText("Server not running")).toHaveLength(2)
    })
  })

  it("shows server not running message with help text when server is down", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Failed to fetch"))

    render(<WorkspacePicker />)

    await waitFor(() => {
      // Button should show server not running
      expect(screen.getByText("Server not running")).toBeInTheDocument()
    })

    // Open dropdown
    const workspaceButton = screen.getByRole("button")
    fireEvent.click(workspaceButton)

    // Should show help text
    await waitFor(() => {
      expect(screen.getByText(/pnpm dev/)).toBeInTheDocument()
    })
  })

  it("has refresh button in dropdown", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockWorkspaceResponse),
    })

    render(<WorkspacePicker />)

    await waitFor(() => {
      expect(screen.getByText("my-project")).toBeInTheDocument()
    })

    // Open dropdown
    const workspaceButton = screen.getByRole("button", { expanded: false })
    fireEvent.click(workspaceButton)

    // Refresh button should be visible
    expect(screen.getByText("Refresh")).toBeInTheDocument()
  })

  it("applies custom className", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockWorkspaceResponse),
    })

    const { container } = render(<WorkspacePicker className="custom-class" />)
    expect(container.firstChild).toHaveClass("custom-class")
  })

  it("shows 'No workspace' when workspace path is not set", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ ok: true, workspace: null }),
    })

    render(<WorkspacePicker />)

    // Initially should show "No workspace"
    expect(screen.getByText("No workspace")).toBeInTheDocument()
  })
})
