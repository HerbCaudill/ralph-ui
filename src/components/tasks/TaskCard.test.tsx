import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { TaskCard, type TaskCardTask, type TaskStatus } from "./TaskCard"

// Test Fixtures

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

// Tests

describe("TaskCard", () => {
  describe("rendering", () => {
    it("renders task title", () => {
      render(<TaskCard task={baseTask} />)
      expect(screen.getByText("Create TaskCard component")).toBeInTheDocument()
    })

    it("does not render task ID in main view", () => {
      render(<TaskCard task={baseTask} />)
      // Task ID should not be visible in the main view
      expect(screen.queryByText("rui-4rt.5")).not.toBeInTheDocument()
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

    it("does not render priority badge (priority not shown in sidebar)", () => {
      render(<TaskCard task={{ ...baseTask, priority: 2 }} />)
      // Priority badge should not be visible in the sidebar
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

  describe("click behavior", () => {
    it("supports keyboard navigation with Enter", () => {
      const onClick = vi.fn()
      render(<TaskCard task={fullTask} onClick={onClick} />)

      const contentButton = screen.getByRole("button", { name: fullTask.title })
      fireEvent.keyDown(contentButton, { key: "Enter" })

      expect(onClick).toHaveBeenCalledWith(fullTask.id)
    })

    it("supports keyboard navigation with Space", () => {
      const onClick = vi.fn()
      render(<TaskCard task={fullTask} onClick={onClick} />)

      const contentButton = screen.getByRole("button", { name: fullTask.title })
      fireEvent.keyDown(contentButton, { key: " " })

      expect(onClick).toHaveBeenCalledWith(fullTask.id)
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

    it("status button click does not trigger onClick", () => {
      const onStatusChange = vi.fn()
      const onClick = vi.fn()
      render(<TaskCard task={fullTask} onStatusChange={onStatusChange} onClick={onClick} />)

      fireEvent.click(screen.getByLabelText(/Status: In Progress/))

      // onClick should not have been called
      expect(onClick).not.toHaveBeenCalled()
      // Status menu should be open
      expect(screen.getByRole("listbox")).toBeInTheDocument()
    })
  })

  describe("onClick callback", () => {
    it("calls onClick when card content is clicked", () => {
      const onClick = vi.fn()
      render(<TaskCard task={baseTask} onClick={onClick} />)

      fireEvent.click(screen.getByRole("button", { name: baseTask.title }))

      expect(onClick).toHaveBeenCalledWith("rui-4rt.5")
    })

    it("calls onClick without showing expanded details", () => {
      const onClick = vi.fn()
      render(<TaskCard task={fullTask} onClick={onClick} />)

      fireEvent.click(screen.getByRole("button", { name: fullTask.title }))

      expect(onClick).toHaveBeenCalledWith("rui-4rt.5")
      // Description should NOT be visible (clicking opens dialog instead of expanding inline)
      expect(screen.queryByText(fullTask.description!)).not.toBeInTheDocument()
    })
  })

  describe("priority", () => {
    it("does not display priority badges in the sidebar", () => {
      // Priority badges are not shown in the simplified sidebar view
      const priorities = [0, 1, 2, 3, 4]
      priorities.forEach(priority => {
        const { unmount } = render(<TaskCard task={{ ...baseTask, priority }} />)
        expect(screen.queryByText(`P${priority}`)).not.toBeInTheDocument()
        unmount()
      })
    })
  })

  describe("accessibility", () => {
    it("content area has button role", () => {
      render(<TaskCard task={baseTask} />)
      expect(screen.getByRole("button", { name: baseTask.title })).toBeInTheDocument()
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
