import { render, screen } from "@testing-library/react"
import { describe, it, expect, beforeEach } from "vitest"
import { StatusBar } from "./StatusBar"
import { useAppStore } from "@/store"

describe("StatusBar", () => {
  beforeEach(() => {
    // Reset store state before each test
    useAppStore.getState().reset()
  })

  describe("StatusIndicator", () => {
    it("shows 'Stopped' when ralph is stopped", () => {
      render(<StatusBar />)
      expect(screen.getByText("Stopped")).toBeInTheDocument()
    })

    it("shows 'Starting' when ralph is starting", () => {
      useAppStore.getState().setRalphStatus("starting")
      render(<StatusBar />)
      expect(screen.getByText("Starting")).toBeInTheDocument()
    })

    it("shows 'Running' when ralph is running", () => {
      useAppStore.getState().setRalphStatus("running")
      render(<StatusBar />)
      expect(screen.getByText("Running")).toBeInTheDocument()
    })

    it("shows 'Stopping' when ralph is stopping", () => {
      useAppStore.getState().setRalphStatus("stopping")
      render(<StatusBar />)
      expect(screen.getByText("Stopping")).toBeInTheDocument()
    })
  })

  describe("RepoBranch", () => {
    it("shows repo name when workspace is set", () => {
      useAppStore.getState().setWorkspace("/path/to/my-repo")
      render(<StatusBar />)
      expect(screen.getByText("my-repo")).toBeInTheDocument()
    })

    it("shows branch when branch is set", () => {
      useAppStore.getState().setWorkspace("/path/to/repo")
      useAppStore.getState().setBranch("feature/test")
      render(<StatusBar />)
      expect(screen.getByText(/feature\/test/)).toBeInTheDocument()
    })

    it("does not show repo/branch section when neither is set", () => {
      render(<StatusBar />)
      // Should not find any git branch icon when no workspace/branch
      expect(screen.queryByText(/\//)).not.toBeInTheDocument()
    })
  })

  describe("TokenUsage", () => {
    it("shows zero tokens initially", () => {
      render(<StatusBar />)
      const zeros = screen.getAllByText("0")
      expect(zeros).toHaveLength(2) // one for input, one for output
    })

    it("shows token counts", () => {
      useAppStore.getState().setTokenUsage({ input: 500, output: 250 })
      render(<StatusBar />)
      expect(screen.getByText("500")).toBeInTheDocument()
      expect(screen.getByText("250")).toBeInTheDocument()
    })

    it("formats large token counts with k suffix", () => {
      useAppStore.getState().setTokenUsage({ input: 1500, output: 2500 })
      render(<StatusBar />)
      expect(screen.getByText("1.5k")).toBeInTheDocument()
      expect(screen.getByText("2.5k")).toBeInTheDocument()
    })

    it("formats very large token counts with M suffix", () => {
      useAppStore.getState().setTokenUsage({ input: 1500000, output: 2500000 })
      render(<StatusBar />)
      expect(screen.getByText("1.5M")).toBeInTheDocument()
      expect(screen.getByText("2.5M")).toBeInTheDocument()
    })
  })

  describe("IterationProgress", () => {
    it("does not show progress when total is 0", () => {
      render(<StatusBar />)
      expect(screen.queryByText(/\d+\/\d+/)).not.toBeInTheDocument()
    })

    it("shows iteration count when total is set", () => {
      useAppStore.getState().setIteration({ current: 3, total: 10 })
      render(<StatusBar />)
      expect(screen.getByText("3/10")).toBeInTheDocument()
    })

    it("shows progress bar at correct percentage", () => {
      useAppStore.getState().setIteration({ current: 5, total: 10 })
      render(<StatusBar />)
      // Progress bar should be at 50%
      const progressBar = document.querySelector('[style*="width: 50%"]')
      expect(progressBar).toBeInTheDocument()
    })
  })

  describe("styling", () => {
    it("applies custom className", () => {
      const { container } = render(<StatusBar className="custom-class" />)
      expect(container.firstChild).toHaveClass("custom-class")
    })
  })
})
