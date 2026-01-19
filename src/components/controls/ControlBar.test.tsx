import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { describe, it, expect, beforeEach, vi } from "vitest"
import { ControlBar } from "./ControlBar"
import { useAppStore } from "@/store"

// Mock fetch
const mockFetch = vi.fn()
vi.stubGlobal("fetch", mockFetch)

describe("ControlBar", () => {
  beforeEach(() => {
    // Reset store state before each test
    useAppStore.getState().reset()
    // Reset fetch mock
    mockFetch.mockReset()
  })

  describe("button rendering", () => {
    it("renders all control buttons", () => {
      useAppStore.getState().setConnectionStatus("connected")
      render(<ControlBar />)

      expect(screen.getByRole("button", { name: "Start" })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: "Pause" })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: "Stop" })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: "Stop after current" })).toBeInTheDocument()
    })

    it("applies custom className", () => {
      const { container } = render(<ControlBar className="custom-class" />)
      expect(container.firstChild).toHaveClass("custom-class")
    })
  })

  describe("button states when disconnected", () => {
    it("disables all buttons when not connected", () => {
      useAppStore.getState().setConnectionStatus("disconnected")
      render(<ControlBar />)

      expect(screen.getByRole("button", { name: "Start" })).toBeDisabled()
      expect(screen.getByRole("button", { name: "Pause" })).toBeDisabled()
      expect(screen.getByRole("button", { name: "Stop" })).toBeDisabled()
      expect(screen.getByRole("button", { name: "Stop after current" })).toBeDisabled()
    })
  })

  describe("button states when stopped", () => {
    beforeEach(() => {
      useAppStore.getState().setConnectionStatus("connected")
      useAppStore.getState().setRalphStatus("stopped")
    })

    it("enables Start button when stopped", () => {
      render(<ControlBar />)
      expect(screen.getByRole("button", { name: "Start" })).not.toBeDisabled()
    })

    it("disables Pause button when stopped", () => {
      render(<ControlBar />)
      expect(screen.getByRole("button", { name: "Pause" })).toBeDisabled()
    })

    it("disables Stop button when stopped", () => {
      render(<ControlBar />)
      expect(screen.getByRole("button", { name: "Stop" })).toBeDisabled()
    })

    it("disables Stop after current button when stopped", () => {
      render(<ControlBar />)
      expect(screen.getByRole("button", { name: "Stop after current" })).toBeDisabled()
    })
  })

  describe("button states when starting", () => {
    beforeEach(() => {
      useAppStore.getState().setConnectionStatus("connected")
      useAppStore.getState().setRalphStatus("starting")
    })

    it("disables all buttons when starting", () => {
      render(<ControlBar />)

      expect(screen.getByRole("button", { name: "Start" })).toBeDisabled()
      expect(screen.getByRole("button", { name: "Pause" })).toBeDisabled()
      expect(screen.getByRole("button", { name: "Stop" })).toBeDisabled()
      expect(screen.getByRole("button", { name: "Stop after current" })).toBeDisabled()
    })
  })

  describe("button states when running", () => {
    beforeEach(() => {
      useAppStore.getState().setConnectionStatus("connected")
      useAppStore.getState().setRalphStatus("running")
    })

    it("disables Start button when running", () => {
      render(<ControlBar />)
      expect(screen.getByRole("button", { name: "Start" })).toBeDisabled()
    })

    it("enables Pause button when running", () => {
      render(<ControlBar />)
      expect(screen.getByRole("button", { name: "Pause" })).not.toBeDisabled()
    })

    it("enables Stop button when running", () => {
      render(<ControlBar />)
      expect(screen.getByRole("button", { name: "Stop" })).not.toBeDisabled()
    })

    it("disables Stop after current button when running (not yet implemented)", () => {
      // Stop-after-current is not yet implemented in ralph
      render(<ControlBar />)
      expect(screen.getByRole("button", { name: "Stop after current" })).toBeDisabled()
    })
  })

  describe("button states when paused", () => {
    beforeEach(() => {
      useAppStore.getState().setConnectionStatus("connected")
      useAppStore.getState().setRalphStatus("paused")
    })

    it("disables Start button when paused", () => {
      render(<ControlBar />)
      expect(screen.getByRole("button", { name: "Start" })).toBeDisabled()
    })

    it("enables Resume button when paused (shows as Resume instead of Pause)", () => {
      render(<ControlBar />)
      expect(screen.getByRole("button", { name: "Resume" })).not.toBeDisabled()
    })

    it("enables Stop button when paused", () => {
      render(<ControlBar />)
      expect(screen.getByRole("button", { name: "Stop" })).not.toBeDisabled()
    })

    it("disables Stop after current button when paused", () => {
      render(<ControlBar />)
      expect(screen.getByRole("button", { name: "Stop after current" })).toBeDisabled()
    })
  })

  describe("button states when stopping", () => {
    beforeEach(() => {
      useAppStore.getState().setConnectionStatus("connected")
      useAppStore.getState().setRalphStatus("stopping")
    })

    it("disables all buttons when stopping", () => {
      render(<ControlBar />)

      expect(screen.getByRole("button", { name: "Start" })).toBeDisabled()
      expect(screen.getByRole("button", { name: "Pause" })).toBeDisabled()
      expect(screen.getByRole("button", { name: "Stop" })).toBeDisabled()
      expect(screen.getByRole("button", { name: "Stop after current" })).toBeDisabled()
    })
  })

  describe("Start button action", () => {
    beforeEach(() => {
      useAppStore.getState().setConnectionStatus("connected")
      useAppStore.getState().setRalphStatus("stopped")
    })

    it("calls /api/start when Start is clicked", async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ ok: true, status: "starting" }),
      })

      render(<ControlBar />)
      fireEvent.click(screen.getByRole("button", { name: "Start" }))

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        })
      })
    })

    it("shows error when Start fails", async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ ok: false, error: "Failed to start ralph" }),
      })

      render(<ControlBar />)
      fireEvent.click(screen.getByRole("button", { name: "Start" }))

      await waitFor(() => {
        expect(screen.getByText("Failed to start ralph")).toBeInTheDocument()
      })
    })

    it("shows error when network fails", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"))

      render(<ControlBar />)
      fireEvent.click(screen.getByRole("button", { name: "Start" }))

      await waitFor(() => {
        expect(screen.getByText("Network error")).toBeInTheDocument()
      })
    })
  })

  describe("Stop button action", () => {
    beforeEach(() => {
      useAppStore.getState().setConnectionStatus("connected")
      useAppStore.getState().setRalphStatus("running")
    })

    it("calls /api/stop when Stop is clicked", async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ ok: true, status: "stopping" }),
      })

      render(<ControlBar />)
      fireEvent.click(screen.getByRole("button", { name: "Stop" }))

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/stop", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        })
      })
    })

    it("shows error when Stop fails", async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ ok: false, error: "Failed to stop ralph" }),
      })

      render(<ControlBar />)
      fireEvent.click(screen.getByRole("button", { name: "Stop" }))

      await waitFor(() => {
        expect(screen.getByText("Failed to stop ralph")).toBeInTheDocument()
      })
    })
  })

  describe("Pause button action", () => {
    beforeEach(() => {
      useAppStore.getState().setConnectionStatus("connected")
      useAppStore.getState().setRalphStatus("running")
    })

    it("calls /api/pause when Pause is clicked", async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ ok: true, status: "paused" }),
      })

      render(<ControlBar />)
      fireEvent.click(screen.getByRole("button", { name: "Pause" }))

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/pause", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        })
      })
    })

    it("shows error when Pause fails", async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ ok: false, error: "Failed to pause ralph" }),
      })

      render(<ControlBar />)
      fireEvent.click(screen.getByRole("button", { name: "Pause" }))

      await waitFor(() => {
        expect(screen.getByText("Failed to pause ralph")).toBeInTheDocument()
      })
    })
  })

  describe("Resume button action", () => {
    beforeEach(() => {
      useAppStore.getState().setConnectionStatus("connected")
      useAppStore.getState().setRalphStatus("paused")
    })

    it("calls /api/resume when Resume is clicked", async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ ok: true, status: "running" }),
      })

      render(<ControlBar />)
      fireEvent.click(screen.getByRole("button", { name: "Resume" }))

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/resume", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        })
      })
    })

    it("shows error when Resume fails", async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ ok: false, error: "Failed to resume ralph" }),
      })

      render(<ControlBar />)
      fireEvent.click(screen.getByRole("button", { name: "Resume" }))

      await waitFor(() => {
        expect(screen.getByText("Failed to resume ralph")).toBeInTheDocument()
      })
    })
  })
})
