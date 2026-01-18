import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest"
import { Header } from "./Header"
import { useAppStore } from "@/store"

// Mock fetch
const mockFetch = vi.fn()
;(globalThis as { fetch: typeof fetch }).fetch = mockFetch

// Mock matchMedia
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

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
    key: vi.fn((i: number) => Object.keys(store)[i] ?? null),
    get length() {
      return Object.keys(store).length
    },
    _setStore: (newStore: Record<string, string>) => {
      store = newStore
    },
  }
})()

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
    // Mock matchMedia for theme detection
    window.matchMedia = mockMatchMedia
    // Mock localStorage for theme persistence
    mockLocalStorage.clear()
    Object.defineProperty(window, "localStorage", {
      value: mockLocalStorage,
      writable: true,
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
    expect(screen.queryByText("Workspaces")).not.toBeInTheDocument()

    // Click the workspace picker button
    const workspaceButton = screen.getByRole("button", { expanded: false })
    fireEvent.click(workspaceButton)

    // Dropdown should be open
    await waitFor(() => {
      expect(screen.getByText("Workspaces")).toBeInTheDocument()
    })
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
    await waitFor(() => {
      expect(screen.getByText("Workspaces")).toBeInTheDocument()
    })

    // Click outside (on the document)
    fireEvent.mouseDown(document.body)

    // Dropdown should be closed
    expect(screen.queryByText("Workspaces")).not.toBeInTheDocument()
  })

  it("applies custom className", async () => {
    const { container } = render(<Header className="custom-class" />)
    expect(container.firstChild).toHaveClass("custom-class")
  })

  describe("theme toggle", () => {
    it("renders theme toggle button", async () => {
      render(<Header />)
      expect(screen.getByTestId("theme-toggle")).toBeInTheDocument()
    })

    it("shows monitor icon for system theme", async () => {
      useAppStore.getState().setTheme("system")
      render(<Header />)

      const button = screen.getByTestId("theme-toggle")
      expect(button).toHaveAttribute("aria-label", "System theme")
    })

    it("shows sun icon for light theme", async () => {
      // Set localStorage so useTheme initializes with light
      mockLocalStorage._setStore({ "ralph-ui-theme": "light" })
      render(<Header />)

      const button = screen.getByTestId("theme-toggle")
      expect(button).toHaveAttribute("aria-label", "Light theme")
    })

    it("shows moon icon for dark theme", async () => {
      // Set localStorage so useTheme initializes with dark
      mockLocalStorage._setStore({ "ralph-ui-theme": "dark" })
      render(<Header />)

      const button = screen.getByTestId("theme-toggle")
      expect(button).toHaveAttribute("aria-label", "Dark theme")
    })

    it("cycles theme when clicked: system -> light -> dark -> system", async () => {
      useAppStore.getState().setTheme("system")
      render(<Header />)

      const button = screen.getByTestId("theme-toggle")

      // system -> light
      fireEvent.click(button)
      expect(useAppStore.getState().theme).toBe("light")

      // light -> dark
      fireEvent.click(button)
      expect(useAppStore.getState().theme).toBe("dark")

      // dark -> system
      fireEvent.click(button)
      expect(useAppStore.getState().theme).toBe("system")
    })
  })

  describe("accent color bar", () => {
    it("renders accent bar with default black color when no accent color set", async () => {
      render(<Header />)

      const accentBar = screen.getByTestId("accent-bar")
      expect(accentBar).toBeInTheDocument()
      expect(accentBar).toHaveStyle({ backgroundColor: "#000000" })
    })

    it("renders accent bar with peacock color from store", async () => {
      useAppStore.getState().setAccentColor("#4d9697")
      render(<Header />)

      const accentBar = screen.getByTestId("accent-bar")
      expect(accentBar).toBeInTheDocument()
      expect(accentBar).toHaveStyle({ backgroundColor: "#4d9697" })
    })

    it("updates accent bar color when accent color changes in store", async () => {
      useAppStore.getState().setAccentColor("#4d9697")
      const { rerender } = render(<Header />)

      // Verify initial color
      let accentBar = screen.getByTestId("accent-bar")
      expect(accentBar).toHaveStyle({ backgroundColor: "#4d9697" })

      // Change the accent color
      useAppStore.getState().setAccentColor("#ff5733")
      rerender(<Header />)

      // Verify updated color
      accentBar = screen.getByTestId("accent-bar")
      expect(accentBar).toHaveStyle({ backgroundColor: "#ff5733" })
    })

    it("falls back to black when accent color is cleared", async () => {
      useAppStore.getState().setAccentColor("#4d9697")
      const { rerender } = render(<Header />)

      // Verify initial color
      let accentBar = screen.getByTestId("accent-bar")
      expect(accentBar).toHaveStyle({ backgroundColor: "#4d9697" })

      // Clear the accent color
      useAppStore.getState().setAccentColor(null)
      rerender(<Header />)

      // Verify fallback to black
      accentBar = screen.getByTestId("accent-bar")
      expect(accentBar).toHaveStyle({ backgroundColor: "#000000" })
    })
  })
})
