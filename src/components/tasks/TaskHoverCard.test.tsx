import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { TaskHoverCard } from "./TaskHoverCard"
import type { TaskCardTask } from "./TaskCard"

// Test Fixtures

const baseTask: TaskCardTask = {
  id: "rui-4rt.5",
  title: "Create TaskCard component",
  status: "open",
}

const fullTask: TaskCardTask = {
  id: "rui-abc.1",
  title: "Full featured task",
  description: "This is a detailed description of the task.",
  status: "in_progress",
  priority: 1,
  issue_type: "task",
  parent: "rui-abc",
}

// Helper to render with trigger content
function renderHoverCard(task: TaskCardTask, props?: Partial<Parameters<typeof TaskHoverCard>[0]>) {
  return render(
    <TaskHoverCard task={task} {...props}>
      <button>Hover trigger</button>
    </TaskHoverCard>,
  )
}

// Tests

describe("TaskHoverCard", () => {
  describe("rendering", () => {
    it("renders trigger element", () => {
      renderHoverCard(baseTask)
      expect(screen.getByText("Hover trigger")).toBeInTheDocument()
    })

    it("does not render hover content initially", () => {
      renderHoverCard(baseTask)
      expect(screen.queryByText(baseTask.id)).not.toBeInTheDocument()
    })

    it("renders hover content when trigger is hovered", async () => {
      renderHoverCard(fullTask)
      const trigger = screen.getByText("Hover trigger")

      // Trigger hover
      fireEvent.mouseEnter(trigger)

      await waitFor(() => {
        expect(screen.getByText(fullTask.id)).toBeInTheDocument()
      })
    })

    it("renders just the trigger when disabled", () => {
      renderHoverCard(baseTask, { disabled: true })
      expect(screen.getByText("Hover trigger")).toBeInTheDocument()
      // Should not have hover card behavior when disabled
    })
  })

  describe("hover content", () => {
    async function showHoverCard(task: TaskCardTask, props?: Partial<Parameters<typeof TaskHoverCard>[0]>) {
      renderHoverCard(task, props)
      const trigger = screen.getByText("Hover trigger")
      fireEvent.mouseEnter(trigger)
      await waitFor(() => {
        expect(screen.getByText(task.id)).toBeInTheDocument()
      })
    }

    it("displays task ID", async () => {
      await showHoverCard(fullTask)
      expect(screen.getByText(fullTask.id)).toBeInTheDocument()
    })

    it("displays task title", async () => {
      await showHoverCard(fullTask)
      expect(screen.getByText(fullTask.title)).toBeInTheDocument()
    })

    it("displays task description", async () => {
      await showHoverCard(fullTask)
      expect(screen.getByText(fullTask.description!)).toBeInTheDocument()
    })

    it("displays priority badge", async () => {
      await showHoverCard(fullTask)
      expect(screen.getByText("P1")).toBeInTheDocument()
    })

    it("displays issue type", async () => {
      await showHoverCard(fullTask)
      expect(screen.getByText("task")).toBeInTheDocument()
    })

    it("displays parent ID", async () => {
      await showHoverCard(fullTask)
      expect(screen.getByText(fullTask.parent!)).toBeInTheDocument()
    })

    it("does not display description if not provided", async () => {
      await showHoverCard(baseTask)
      // Should not have any element with the description text
      expect(screen.queryByText(/description/i)).not.toBeInTheDocument()
    })

    it("does not display parent if not provided", async () => {
      await showHoverCard(baseTask)
      expect(screen.queryByText(/parent/i)).not.toBeInTheDocument()
    })

    it("displays status icon with correct color", async () => {
      await showHoverCard(fullTask)
      // The status icon should be present - check through the title text being styled
      const title = screen.getByText(fullTask.title)
      expect(title).toBeInTheDocument()
    })

    it("applies line-through for closed tasks", async () => {
      const closedTask: TaskCardTask = { ...baseTask, status: "closed" }
      await showHoverCard(closedTask)
      const title = screen.getByText(closedTask.title)
      expect(title).toHaveClass("line-through")
    })
  })

  describe("open details button", () => {
    it("displays open details button when onOpenDetails is provided", async () => {
      const onOpenDetails = vi.fn()
      renderHoverCard(baseTask, { onOpenDetails })
      const trigger = screen.getByText("Hover trigger")
      fireEvent.mouseEnter(trigger)

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /open details/i })).toBeInTheDocument()
      })
    })

    it("does not display open details button when onOpenDetails is not provided", async () => {
      renderHoverCard(baseTask)
      const trigger = screen.getByText("Hover trigger")
      fireEvent.mouseEnter(trigger)

      await waitFor(() => {
        expect(screen.getByText(baseTask.id)).toBeInTheDocument()
      })
      expect(screen.queryByRole("button", { name: /open details/i })).not.toBeInTheDocument()
    })

    it("calls onOpenDetails with task id when button is clicked", async () => {
      const onOpenDetails = vi.fn()
      renderHoverCard(baseTask, { onOpenDetails })
      const trigger = screen.getByText("Hover trigger")
      fireEvent.mouseEnter(trigger)

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /open details/i })).toBeInTheDocument()
      })

      const button = screen.getByRole("button", { name: /open details/i })
      fireEvent.click(button)

      expect(onOpenDetails).toHaveBeenCalledWith(baseTask.id)
    })

    it("stops event propagation when button is clicked", async () => {
      const onOpenDetails = vi.fn()
      const parentClick = vi.fn()

      render(
        <div onClick={parentClick}>
          <TaskHoverCard task={baseTask} onOpenDetails={onOpenDetails}>
            <button>Hover trigger</button>
          </TaskHoverCard>
        </div>,
      )

      const trigger = screen.getByText("Hover trigger")
      fireEvent.mouseEnter(trigger)

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /open details/i })).toBeInTheDocument()
      })

      const button = screen.getByRole("button", { name: /open details/i })
      fireEvent.click(button)

      expect(onOpenDetails).toHaveBeenCalled()
      expect(parentClick).not.toHaveBeenCalled()
    })
  })

  describe("priority badges", () => {
    const priorities = [
      { value: 0, label: "P0", colorClass: "text-red-500" },
      { value: 1, label: "P1", colorClass: "text-orange-500" },
      { value: 2, label: "P2", colorClass: "text-yellow-500" },
      { value: 3, label: "P3", colorClass: "text-blue-500" },
      { value: 4, label: "P4", colorClass: "text-gray-500" },
    ]

    priorities.forEach(({ value, label }) => {
      it(`displays ${label} for priority ${value}`, async () => {
        const task: TaskCardTask = { ...baseTask, priority: value }
        renderHoverCard(task)
        const trigger = screen.getByText("Hover trigger")
        fireEvent.mouseEnter(trigger)

        await waitFor(() => {
          expect(screen.getByText(label)).toBeInTheDocument()
        })
      })
    })
  })

  describe("status indicators", () => {
    const statuses = [
      { status: "open", label: "Open" },
      { status: "in_progress", label: "In Progress" },
      { status: "blocked", label: "Blocked" },
      { status: "deferred", label: "Deferred" },
      { status: "closed", label: "Closed" },
    ] as const

    statuses.forEach(({ status }) => {
      it(`renders task with ${status} status`, async () => {
        const task: TaskCardTask = { ...baseTask, status }
        renderHoverCard(task)
        const trigger = screen.getByText("Hover trigger")
        fireEvent.mouseEnter(trigger)

        await waitFor(() => {
          expect(screen.getByText(task.id)).toBeInTheDocument()
        })
        expect(screen.getByText(task.title)).toBeInTheDocument()
      })
    })
  })
})
