import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, beforeEach } from "vitest"
import { EventStream } from "./EventStream"
import { useAppStore } from "@/store"

describe("EventStream", () => {
  beforeEach(() => {
    // Reset store state before each test
    useAppStore.getState().reset()
  })

  describe("empty state", () => {
    it("shows empty message when no events", () => {
      render(<EventStream />)
      expect(screen.getByText("No events yet")).toBeInTheDocument()
    })

    it("has correct ARIA attributes", () => {
      render(<EventStream />)
      const container = screen.getByRole("log")
      expect(container).toHaveAttribute("aria-label", "Event stream")
      expect(container).toHaveAttribute("aria-live", "polite")
    })
  })

  describe("displaying events", () => {
    it("renders events from the store", () => {
      useAppStore.getState().addEvent({
        type: "test_event",
        timestamp: 1705600000000,
      })
      render(<EventStream />)
      expect(screen.getByText("Test Event")).toBeInTheDocument()
    })

    it("renders multiple events", () => {
      useAppStore.getState().addEvent({
        type: "first_event",
        timestamp: 1705600000000,
      })
      useAppStore.getState().addEvent({
        type: "second_event",
        timestamp: 1705600001000,
      })
      render(<EventStream />)
      expect(screen.getByText("First Event")).toBeInTheDocument()
      expect(screen.getByText("Second Event")).toBeInTheDocument()
    })

    it("formats timestamps correctly", () => {
      // Create a date at a known time
      const date = new Date(2024, 0, 18, 14, 30, 45, 123)
      useAppStore.getState().addEvent({
        type: "test",
        timestamp: date.getTime(),
      })
      render(<EventStream />)
      expect(screen.getByText("14:30:45.123")).toBeInTheDocument()
    })

    it("shows event details when present", () => {
      useAppStore.getState().addEvent({
        type: "test",
        timestamp: 1705600000000,
        message: "hello",
      })
      render(<EventStream />)
      expect(screen.getByText(/hello/)).toBeInTheDocument()
    })

    it("limits displayed events to maxEvents", () => {
      // Add 5 events
      for (let i = 0; i < 5; i++) {
        useAppStore.getState().addEvent({
          type: `event_${i}`,
          timestamp: 1705600000000 + i * 1000,
        })
      }
      render(<EventStream maxEvents={3} />)
      // Should only show the last 3 events
      expect(screen.queryByText("Event 0")).not.toBeInTheDocument()
      expect(screen.queryByText("Event 1")).not.toBeInTheDocument()
      expect(screen.getByText("Event 2")).toBeInTheDocument()
      expect(screen.getByText("Event 3")).toBeInTheDocument()
      expect(screen.getByText("Event 4")).toBeInTheDocument()
    })
  })

  describe("event type styling", () => {
    it("applies error styling to error events", () => {
      useAppStore.getState().addEvent({
        type: "error_occurred",
        timestamp: 1705600000000,
      })
      render(<EventStream />)
      const badge = screen.getByText("Error Occurred")
      expect(badge).toHaveClass("text-red-500")
    })

    it("applies warning styling to warning events", () => {
      useAppStore.getState().addEvent({
        type: "warning_message",
        timestamp: 1705600000000,
      })
      render(<EventStream />)
      const badge = screen.getByText("Warning Message")
      expect(badge).toHaveClass("text-yellow-500")
    })

    it("applies success styling to success events", () => {
      useAppStore.getState().addEvent({
        type: "success_complete",
        timestamp: 1705600000000,
      })
      render(<EventStream />)
      const badge = screen.getByText("Success Complete")
      expect(badge).toHaveClass("text-green-500")
    })

    it("applies tool styling to tool events", () => {
      useAppStore.getState().addEvent({
        type: "tool_use",
        timestamp: 1705600000000,
      })
      render(<EventStream />)
      const badge = screen.getByText("Tool Use")
      expect(badge).toHaveClass("text-blue-500")
    })
  })

  describe("auto-scroll behavior", () => {
    it("shows auto-scroll indicator when enabled and events exist", () => {
      useAppStore.getState().addEvent({
        type: "test",
        timestamp: 1705600000000,
      })
      render(<EventStream />)
      expect(screen.getByText("Auto-scroll")).toBeInTheDocument()
    })

    it("does not show auto-scroll indicator when no events", () => {
      render(<EventStream />)
      expect(screen.queryByText("Auto-scroll")).not.toBeInTheDocument()
    })
  })

  describe("scroll to bottom button", () => {
    it("does not show scroll to bottom button initially", () => {
      useAppStore.getState().addEvent({
        type: "test",
        timestamp: 1705600000000,
      })
      render(<EventStream />)
      expect(screen.queryByLabelText("Scroll to latest events")).not.toBeInTheDocument()
    })

    it("shows scroll to bottom button when scrolled up", () => {
      // Add many events to make scrolling possible
      for (let i = 0; i < 100; i++) {
        useAppStore.getState().addEvent({
          type: `event_${i}`,
          timestamp: 1705600000000 + i * 1000,
        })
      }
      render(<EventStream />)

      // Get the scroll container
      const container = screen.getByRole("log")

      // Mock scroll position to simulate being scrolled up
      Object.defineProperty(container, "scrollHeight", { value: 2000 })
      Object.defineProperty(container, "scrollTop", { value: 0 })
      Object.defineProperty(container, "clientHeight", { value: 500 })

      // Trigger wheel event (user scrolling)
      fireEvent.wheel(container)
      // Trigger scroll event
      fireEvent.scroll(container)

      // Now the button should appear
      expect(screen.getByLabelText("Scroll to latest events")).toBeInTheDocument()
    })
  })

  describe("styling", () => {
    it("applies custom className", () => {
      const { container } = render(<EventStream className="custom-class" />)
      expect(container.firstChild).toHaveClass("custom-class")
    })
  })
})
