import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { TaskCard, type TaskCardTask, type TaskStatus } from "./TaskCard"

// =============================================================================
// Test Fixtures
// =============================================================================

const baseTask: TaskCardTask = {
  id: "rui-4rt.5",
  title: "Create TaskCard component",
  status: "open",
}

const fullTask: TaskCardTask = {
  id: "rui-4rt.5",
  title: "Create TaskCard component",
  description: "Display individual task with ID, title. Click to expand/edit.",
  status: "in_progress",
  priority: 2,
  issue_type: "task",
  parent: "rui-4rt",
}

// =============================================================================
// Tests
// =============================================================================

describe("TaskCard", () => {
  describe("rendering", () => {
    it("renders task ID", () => {
      render(<TaskCard task={baseTask} />)
      expect(screen.getByText("rui-4rt.5")).toBeInTheDocument()
    })

    it("renders task title", () => {
      render(<TaskCard task={baseTask} />)
      expect(screen.getByText("Create TaskCard component")).toBeInTheDocument()
    })

    it("renders status icon", () => {
      render(<TaskCard task={baseTask} />)
      expect(screen.getByLabelText("Status: Open")).toBeInTheDocument()
    })

    it("renders different status icons", () => {
      const statuses: TaskStatus[] = ["open", "in_progress", "blocked", "deferred", "closed"]
      const labels = ["Open", "In Progress", "Blocked", "Deferred", "Closed"]

      statuses.forEach((status, i) => {
        const { unmount } = render(<TaskCard task={{ ...baseTask, status }} />)
        expect(screen.getByLabelText(`Status: ${labels[i]}`)).toBeInTheDocument()
        unmount()
      })
    })

    it("renders priority badge when provided", () => {
      render(<TaskCard task={{ ...baseTask, priority: 2 }} />)
      expect(screen.getByText("P2")).toBeInTheDocument()
    })

    it("does not render priority badge when not provided", () => {
      render(<TaskCard task={baseTask} />)
      expect(screen.queryByText(/^P\d$/)).not.toBeInTheDocument()
    })

    it("applies reduced opacity for closed tasks", () => {
      const { container } = render(<TaskCard task={{ ...baseTask, status: "closed" }} />)
      expect(container.firstChild).toHaveClass("opacity-60")
    })

    it("applies strikethrough for closed task titles", () => {
      render(<TaskCard task={{ ...baseTask, status: "closed" }} />)
      const title = screen.getByText("Create TaskCard component")
      expect(title).toHaveClass("line-through")
    })

    it("applies custom className", () => {
      const { container } = render(<TaskCard task={baseTask} className="custom-class" />)
      expect(container.firstChild).toHaveClass("custom-class")
    })
  })

  describe("expand/collapse", () => {
    it("does not show expand indicator when no details", () => {
      const { container } = render(<TaskCard task={baseTask} />)
      // ChevronDown icon should not be present
      const chevrons = container.querySelectorAll('svg[class*="transition-transform"]')
      expect(chevrons).toHaveLength(0)
    })

    it("shows expand indicator when task has description", () => {
      const { container } = render(
        <TaskCard task={{ ...baseTask, description: "Some description" }} />,
      )
      const chevron = container.querySelector('svg[class*="transition-transform"]')
      expect(chevron).toBeInTheDocument()
    })

    it("shows expand indicator when task has parent", () => {
      const { container } = render(<TaskCard task={{ ...baseTask, parent: "rui-4rt" }} />)
      const chevron = container.querySelector('svg[class*="transition-transform"]')
      expect(chevron).toBeInTheDocument()
    })

    it("shows expand indicator when task has issue_type", () => {
      const { container } = render(<TaskCard task={{ ...baseTask, issue_type: "bug" }} />)
      const chevron = container.querySelector('svg[class*="transition-transform"]')
      expect(chevron).toBeInTheDocument()
    })

    it("expands details on click", () => {
      render(<TaskCard task={fullTask} />)

      // Details should not be visible initially
      expect(screen.queryByText(fullTask.description!)).not.toBeInTheDocument()

      // Click the content area to expand
      const contentButton = screen.getByRole("button", { name: /rui-4rt.5/i })
      fireEvent.click(contentButton)

      // Details should now be visible
      expect(screen.getByText(fullTask.description!)).toBeInTheDocument()
    })

    it("collapses details on second click", () => {
      render(<TaskCard task={fullTask} />)

      const contentButton = screen.getByRole("button", { name: /rui-4rt.5/i })

      // Expand
      fireEvent.click(contentButton)
      expect(screen.getByText(fullTask.description!)).toBeInTheDocument()

      // Collapse
      fireEvent.click(contentButton)
      expect(screen.queryByText(fullTask.description!)).not.toBeInTheDocument()
    })

    it("respects defaultExpanded prop", () => {
      render(<TaskCard task={fullTask} defaultExpanded />)
      expect(screen.getByText(fullTask.description!)).toBeInTheDocument()
    })

    it("shows expanded details content", () => {
      render(<TaskCard task={fullTask} defaultExpanded />)

      expect(screen.getByText(fullTask.description!)).toBeInTheDocument()
      expect(screen.getByText(fullTask.issue_type!)).toBeInTheDocument()
      expect(screen.getByText(`Parent: ${fullTask.parent}`)).toBeInTheDocument()
    })

    it("supports keyboard navigation", () => {
      render(<TaskCard task={fullTask} />)

      const contentButton = screen.getByRole("button", { name: /rui-4rt.5/i })

      // Press Enter to expand
      fireEvent.keyDown(contentButton, { key: "Enter" })
      expect(screen.getByText(fullTask.description!)).toBeInTheDocument()

      // Press Space to collapse
      fireEvent.keyDown(contentButton, { key: " " })
      expect(screen.queryByText(fullTask.description!)).not.toBeInTheDocument()
    })
  })

  describe("status change", () => {
    it("does not show status menu without onStatusChange handler", () => {
      render(<TaskCard task={baseTask} />)

      const statusButton = screen.getByLabelText("Status: Open")
      fireEvent.click(statusButton)

      // Menu should not appear
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument()
    })

    it("shows status menu when onStatusChange is provided and clicked", () => {
      const onStatusChange = vi.fn()
      render(<TaskCard task={baseTask} onStatusChange={onStatusChange} />)

      const statusButton = screen.getByLabelText(/Status: Open/)
      fireEvent.click(statusButton)

      // Menu should appear
      expect(screen.getByRole("listbox")).toBeInTheDocument()
    })

    it("displays all status options in menu", () => {
      const onStatusChange = vi.fn()
      render(<TaskCard task={baseTask} onStatusChange={onStatusChange} />)

      fireEvent.click(screen.getByLabelText(/Status: Open/))

      expect(screen.getByRole("option", { name: "Open" })).toBeInTheDocument()
      expect(screen.getByRole("option", { name: "In Progress" })).toBeInTheDocument()
      expect(screen.getByRole("option", { name: "Blocked" })).toBeInTheDocument()
      expect(screen.getByRole("option", { name: "Deferred" })).toBeInTheDocument()
      expect(screen.getByRole("option", { name: "Closed" })).toBeInTheDocument()
    })

    it("calls onStatusChange when option selected", () => {
      const onStatusChange = vi.fn()
      render(<TaskCard task={baseTask} onStatusChange={onStatusChange} />)

      fireEvent.click(screen.getByLabelText(/Status: Open/))
      fireEvent.click(screen.getByRole("option", { name: "In Progress" }))

      expect(onStatusChange).toHaveBeenCalledWith("rui-4rt.5", "in_progress")
    })

    it("closes menu after selection", () => {
      const onStatusChange = vi.fn()
      render(<TaskCard task={baseTask} onStatusChange={onStatusChange} />)

      fireEvent.click(screen.getByLabelText(/Status: Open/))
      fireEvent.click(screen.getByRole("option", { name: "In Progress" }))

      expect(screen.queryByRole("listbox")).not.toBeInTheDocument()
    })

    it("marks current status as selected", () => {
      const onStatusChange = vi.fn()
      render(
        <TaskCard task={{ ...baseTask, status: "in_progress" }} onStatusChange={onStatusChange} />,
      )

      fireEvent.click(screen.getByLabelText(/Status: In Progress/))

      expect(screen.getByRole("option", { name: "In Progress" })).toHaveAttribute(
        "aria-selected",
        "true",
      )
    })

    it("status button click does not trigger card expand", () => {
      const onStatusChange = vi.fn()
      render(<TaskCard task={fullTask} onStatusChange={onStatusChange} />)

      fireEvent.click(screen.getByLabelText(/Status: In Progress/))

      // Card should not expand
      expect(screen.queryByText(fullTask.description!)).not.toBeInTheDocument()
      // Status menu should be open
      expect(screen.getByRole("listbox")).toBeInTheDocument()
    })
  })

  describe("onClick callback", () => {
    it("calls onClick when card content is clicked", () => {
      const onClick = vi.fn()
      render(<TaskCard task={baseTask} onClick={onClick} />)

      fireEvent.click(screen.getByRole("button", { name: /rui-4rt.5/i }))

      expect(onClick).toHaveBeenCalledWith("rui-4rt.5")
    })

    it("calls onClick and expands together", () => {
      const onClick = vi.fn()
      render(<TaskCard task={fullTask} onClick={onClick} />)

      fireEvent.click(screen.getByRole("button", { name: /rui-4rt.5/i }))

      expect(onClick).toHaveBeenCalledWith("rui-4rt.5")
      expect(screen.getByText(fullTask.description!)).toBeInTheDocument()
    })
  })

  describe("priority badges", () => {
    it("renders P0 with correct styling", () => {
      render(<TaskCard task={{ ...baseTask, priority: 0 }} />)
      const badge = screen.getByText("P0")
      expect(badge).toHaveClass("text-red-600")
    })

    it("renders P1 with correct styling", () => {
      render(<TaskCard task={{ ...baseTask, priority: 1 }} />)
      const badge = screen.getByText("P1")
      expect(badge).toHaveClass("text-orange-600")
    })

    it("renders P2 with correct styling", () => {
      render(<TaskCard task={{ ...baseTask, priority: 2 }} />)
      const badge = screen.getByText("P2")
      expect(badge).toHaveClass("text-yellow-600")
    })

    it("renders P3 with correct styling", () => {
      render(<TaskCard task={{ ...baseTask, priority: 3 }} />)
      const badge = screen.getByText("P3")
      expect(badge).toHaveClass("text-blue-600")
    })

    it("renders P4 with correct styling", () => {
      render(<TaskCard task={{ ...baseTask, priority: 4 }} />)
      const badge = screen.getByText("P4")
      expect(badge).toHaveClass("text-gray-600")
    })
  })

  describe("accessibility", () => {
    it("content area has button role", () => {
      render(<TaskCard task={baseTask} />)
      expect(screen.getByRole("button", { name: /rui-4rt.5/i })).toBeInTheDocument()
    })

    it("content area has aria-expanded attribute", () => {
      render(<TaskCard task={fullTask} />)
      const contentButton = screen.getByRole("button", { name: /rui-4rt.5/i })
      expect(contentButton).toHaveAttribute("aria-expanded", "false")

      fireEvent.click(contentButton)
      expect(contentButton).toHaveAttribute("aria-expanded", "true")
    })

    it("status button has aria-haspopup when interactive", () => {
      const onStatusChange = vi.fn()
      render(<TaskCard task={baseTask} onStatusChange={onStatusChange} />)

      const statusButton = screen.getByLabelText(/Status: Open/)
      expect(statusButton).toHaveAttribute("aria-haspopup", "listbox")
    })

    it("status menu has correct ARIA attributes", () => {
      const onStatusChange = vi.fn()
      render(<TaskCard task={baseTask} onStatusChange={onStatusChange} />)

      fireEvent.click(screen.getByLabelText(/Status: Open/))

      const listbox = screen.getByRole("listbox")
      expect(listbox).toHaveAttribute("aria-label", "Select status")
    })
  })
})
