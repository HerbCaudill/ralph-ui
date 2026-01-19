import { render, screen, fireEvent, waitFor, act } from "@/test-utils"
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest"
import { MainLayout } from "./MainLayout"
import { useAppStore } from "@/store"

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

describe("MainLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset the store before each test
    useAppStore.getState().reset()
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

  it("renders sidebar content", async () => {
    render(<MainLayout sidebar={<div>Sidebar Content</div>} />)
    expect(screen.getByText("Sidebar Content")).toBeInTheDocument()

    // Wait for workspace fetch to complete to avoid act() warning
    await waitFor(() => {
      expect(screen.getByText("workspace")).toBeInTheDocument()
    })
  })

  it("renders main content", async () => {
    render(<MainLayout main={<div>Main Content</div>} />)
    expect(screen.getByText("Main Content")).toBeInTheDocument()

    // Wait for workspace fetch to complete to avoid act() warning
    await waitFor(() => {
      expect(screen.getByText("workspace")).toBeInTheDocument()
    })
  })

  it("renders status bar when provided", async () => {
    render(<MainLayout statusBar={<div>Status Bar Content</div>} />)
    expect(screen.getByText("Status Bar Content")).toBeInTheDocument()

    // Wait for workspace fetch to complete to avoid act() warning
    await waitFor(() => {
      expect(screen.getByText("workspace")).toBeInTheDocument()
    })
  })

  it("does not render status bar when not provided", async () => {
    const { container } = render(<MainLayout />)
    expect(container.querySelector("footer")).not.toBeInTheDocument()

    // Wait for workspace fetch to complete to avoid act() warning
    await waitFor(() => {
      expect(screen.getByText("workspace")).toBeInTheDocument()
    })
  })

  it("toggles sidebar visibility via store", async () => {
    render(<MainLayout sidebar={<div>Sidebar Content</div>} />)

    // Wait for workspace fetch to complete to avoid act() warning
    await waitFor(() => {
      expect(screen.getByText("workspace")).toBeInTheDocument()
    })

    // Sidebar should be visible initially
    expect(screen.getByText("Sidebar Content")).toBeInTheDocument()

    // Toggle sidebar via store (as would happen with Cmd+B hotkey)
    act(() => {
      useAppStore.getState().toggleSidebar()
    })

    // Sidebar content should be hidden
    expect(screen.queryByText("Sidebar Content")).not.toBeInTheDocument()

    // Toggle again to expand
    act(() => {
      useAppStore.getState().toggleSidebar()
    })

    // Sidebar should be visible again
    expect(screen.getByText("Sidebar Content")).toBeInTheDocument()
  })

  it("applies custom className", async () => {
    const { container } = render(<MainLayout className="custom-class" />)
    expect(container.firstChild).toHaveClass("custom-class")

    // Wait for workspace fetch to complete to avoid act() warning
    await waitFor(() => {
      expect(screen.getByText("workspace")).toBeInTheDocument()
    })
  })

  describe("accent color border", () => {
    it("renders with default accent color border when no accent color is set", async () => {
      const { container } = render(<MainLayout />)
      const layoutDiv = container.firstChild as HTMLElement
      // Check border style is applied (jsdom converts hex to rgb)
      expect(layoutDiv.style.border).toBe("2px solid rgb(55, 65, 81)")

      // Wait for workspace fetch to complete to avoid act() warning
      await waitFor(() => {
        expect(screen.getByText("workspace")).toBeInTheDocument()
      })
    })

    it("renders with accent color border from store", async () => {
      // Set accent color in store
      act(() => {
        useAppStore.getState().setAccentColor("#ff5500")
      })

      const { container } = render(<MainLayout />)
      const layoutDiv = container.firstChild as HTMLElement
      // Check border style is applied (jsdom converts hex to rgb)
      expect(layoutDiv.style.border).toBe("2px solid rgb(255, 85, 0)")

      // Wait for workspace fetch to complete to avoid act() warning
      await waitFor(() => {
        expect(screen.getByText("workspace")).toBeInTheDocument()
      })
    })
  })

  describe("resizable sidebar", () => {
    it("renders resize handle when sidebar is open", async () => {
      render(<MainLayout sidebar={<div>Sidebar Content</div>} />)
      expect(screen.getByRole("separator", { name: /resize sidebar/i })).toBeInTheDocument()

      // Wait for workspace fetch to complete to avoid act() warning
      await waitFor(() => {
        expect(screen.getByText("workspace")).toBeInTheDocument()
      })
    })

    it("does not render resize handle when sidebar is closed", async () => {
      render(<MainLayout sidebar={<div>Sidebar Content</div>} />)

      // Wait for workspace fetch to complete to avoid act() warning
      await waitFor(() => {
        expect(screen.getByText("workspace")).toBeInTheDocument()
      })

      // Close the sidebar via store (as would happen with Cmd+B hotkey)
      act(() => {
        useAppStore.getState().toggleSidebar()
      })

      expect(screen.queryByRole("separator", { name: /resize sidebar/i })).not.toBeInTheDocument()
    })

    it("updates sidebar width on drag", async () => {
      render(<MainLayout sidebar={<div>Sidebar Content</div>} />)

      // Wait for workspace fetch to complete to avoid act() warning
      await waitFor(() => {
        expect(screen.getByText("workspace")).toBeInTheDocument()
      })

      const resizeHandle = screen.getByRole("separator", { name: /resize sidebar/i })

      // Start resize
      fireEvent.mouseDown(resizeHandle)

      // Move mouse to simulate resize
      fireEvent.mouseMove(document, { clientX: 400 })

      // Stop resize
      fireEvent.mouseUp(document)

      // Check that the store was updated
      expect(useAppStore.getState().sidebarWidth).toBe(400)
    })

    it("respects minimum sidebar width", async () => {
      render(<MainLayout sidebar={<div>Sidebar Content</div>} />)

      // Wait for workspace fetch to complete to avoid act() warning
      await waitFor(() => {
        expect(screen.getByText("workspace")).toBeInTheDocument()
      })

      const resizeHandle = screen.getByRole("separator", { name: /resize sidebar/i })

      // Start resize
      fireEvent.mouseDown(resizeHandle)

      // Move mouse below minimum
      fireEvent.mouseMove(document, { clientX: 100 })

      // Stop resize
      fireEvent.mouseUp(document)

      // Should be clamped to minimum (200)
      expect(useAppStore.getState().sidebarWidth).toBe(200)
    })

    it("respects maximum sidebar width", async () => {
      render(<MainLayout sidebar={<div>Sidebar Content</div>} />)

      // Wait for workspace fetch to complete to avoid act() warning
      await waitFor(() => {
        expect(screen.getByText("workspace")).toBeInTheDocument()
      })

      const resizeHandle = screen.getByRole("separator", { name: /resize sidebar/i })

      // Start resize
      fireEvent.mouseDown(resizeHandle)

      // Move mouse above maximum
      fireEvent.mouseMove(document, { clientX: 800 })

      // Stop resize
      fireEvent.mouseUp(document)

      // Should be clamped to maximum (600)
      expect(useAppStore.getState().sidebarWidth).toBe(600)
    })

    it("applies width from store to sidebar", async () => {
      // Set a custom width
      useAppStore.getState().setSidebarWidth(350)

      render(<MainLayout sidebar={<div>Sidebar Content</div>} />)

      const sidebar = screen.getByText("Sidebar Content").closest("aside")
      expect(sidebar).toHaveStyle({ width: "350px" })

      // Wait for workspace fetch to complete to avoid act() warning
      await waitFor(() => {
        expect(screen.getByText("workspace")).toBeInTheDocument()
      })
    })
  })
})
