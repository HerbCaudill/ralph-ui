import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { TaskList, type TaskGroup } from "./TaskList"
import type { TaskCardTask } from "./TaskCard"

const STORAGE_KEY = "ralph-ui-task-list-collapsed-state"

// =============================================================================
// Test Fixtures
// =============================================================================

const sampleTasks: TaskCardTask[] = [
  { id: "task-1", title: "Open task 1", status: "open", priority: 2 },
  { id: "task-2", title: "Open task 2", status: "open", priority: 1 },
  { id: "task-3", title: "In progress task", status: "in_progress", priority: 2 },
  { id: "task-4", title: "Blocked task", status: "blocked", priority: 0 },
  { id: "task-5", title: "Deferred task", status: "deferred", priority: 3 },
  { id: "task-6", title: "Closed task", status: "closed", priority: 2 },
]

// =============================================================================
// Tests
// =============================================================================

describe("TaskList", () => {
  describe("rendering", () => {
    it("renders task list container", () => {
      render(<TaskList tasks={sampleTasks} />)
      expect(screen.getByRole("list", { name: "Task list" })).toBeInTheDocument()
    })

    it("renders all group headers", () => {
      render(<TaskList tasks={sampleTasks} />)
      expect(screen.getByLabelText(/Ready section/)).toBeInTheDocument()
      expect(screen.getByLabelText(/In Progress section/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Blocked section/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Other section/)).toBeInTheDocument()
    })

    it("displays correct task counts in headers", () => {
      render(<TaskList tasks={sampleTasks} />)
      expect(screen.getByLabelText("Ready section, 2 tasks")).toBeInTheDocument()
      expect(screen.getByLabelText("In Progress section, 1 task")).toBeInTheDocument()
      expect(screen.getByLabelText("Blocked section, 1 task")).toBeInTheDocument()
      expect(screen.getByLabelText("Other section, 2 tasks")).toBeInTheDocument()
    })

    it("renders tasks within groups", () => {
      // Override defaults to expand all groups for this test
      render(
        <TaskList
          tasks={sampleTasks}
          defaultCollapsed={{ ready: false, in_progress: false, blocked: false, other: false }}
        />,
      )
      expect(screen.getByText("Open task 1")).toBeInTheDocument()
      expect(screen.getByText("Open task 2")).toBeInTheDocument()
      expect(screen.getByText("In progress task")).toBeInTheDocument()
      expect(screen.getByText("Blocked task")).toBeInTheDocument()
    })

    it("applies custom className", () => {
      render(<TaskList tasks={sampleTasks} className="custom-class" />)
      expect(screen.getByRole("list")).toHaveClass("custom-class")
    })
  })

  describe("empty state", () => {
    it("shows no tasks message when empty", () => {
      render(<TaskList tasks={[]} />)
      expect(screen.getByRole("status", { name: "No tasks" })).toBeInTheDocument()
      expect(screen.getByText("No tasks")).toBeInTheDocument()
    })

    it("hides empty groups by default", () => {
      const tasksOnlyOpen: TaskCardTask[] = [{ id: "task-1", title: "Open task", status: "open" }]
      render(<TaskList tasks={tasksOnlyOpen} />)

      expect(screen.getByLabelText(/Ready section/)).toBeInTheDocument()
      expect(screen.queryByLabelText(/In Progress section/)).not.toBeInTheDocument()
      expect(screen.queryByLabelText(/Blocked section/)).not.toBeInTheDocument()
    })

    it("shows empty groups when showEmptyGroups is true", () => {
      const tasksOnlyOpen: TaskCardTask[] = [{ id: "task-1", title: "Open task", status: "open" }]
      render(<TaskList tasks={tasksOnlyOpen} showEmptyGroups />)

      expect(screen.getByLabelText(/Ready section/)).toBeInTheDocument()
      expect(screen.getByLabelText(/In Progress section/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Blocked section/)).toBeInTheDocument()
    })

    it("shows empty message within empty groups", () => {
      const tasksOnlyOpen: TaskCardTask[] = [{ id: "task-1", title: "Open task", status: "open" }]
      render(<TaskList tasks={tasksOnlyOpen} showEmptyGroups />)

      // In Progress group should show "No tasks in this group"
      expect(screen.getAllByText("No tasks in this group").length).toBeGreaterThan(0)
    })
  })

  describe("grouping", () => {
    it("groups open tasks under Ready", () => {
      const tasks: TaskCardTask[] = [
        { id: "task-1", title: "Open task", status: "open" },
        { id: "task-2", title: "Another open", status: "open" },
      ]
      render(<TaskList tasks={tasks} />)

      const readyHeader = screen.getByLabelText("Ready section, 2 tasks")
      expect(readyHeader).toBeInTheDocument()
    })

    it("groups in_progress tasks under In Progress", () => {
      const tasks: TaskCardTask[] = [
        { id: "task-1", title: "Working on it", status: "in_progress" },
      ]
      render(<TaskList tasks={tasks} />)

      const header = screen.getByLabelText("In Progress section, 1 task")
      expect(header).toBeInTheDocument()
    })

    it("groups blocked tasks under Blocked", () => {
      const tasks: TaskCardTask[] = [{ id: "task-1", title: "Stuck task", status: "blocked" }]
      render(<TaskList tasks={tasks} />)

      const header = screen.getByLabelText("Blocked section, 1 task")
      expect(header).toBeInTheDocument()
    })

    it("groups deferred and closed tasks under Other", () => {
      const tasks: TaskCardTask[] = [
        { id: "task-1", title: "Deferred task", status: "deferred" },
        { id: "task-2", title: "Closed task", status: "closed" },
      ]
      render(<TaskList tasks={tasks} />)

      const header = screen.getByLabelText("Other section, 2 tasks")
      expect(header).toBeInTheDocument()
    })
  })

  describe("sorting", () => {
    it("sorts tasks within groups by priority (ascending)", () => {
      const tasks: TaskCardTask[] = [
        { id: "task-low", title: "Low priority", status: "open", priority: 4 },
        { id: "task-high", title: "High priority", status: "open", priority: 0 },
        { id: "task-med", title: "Medium priority", status: "open", priority: 2 },
      ]
      render(<TaskList tasks={tasks} />)

      const taskIds = screen.getAllByText(/task-/).map(el => el.textContent)
      expect(taskIds).toEqual(["task-high", "task-med", "task-low"])
    })

    it("treats undefined priority as lowest", () => {
      const tasks: TaskCardTask[] = [
        { id: "task-none", title: "No priority", status: "open" },
        { id: "task-high", title: "High priority", status: "open", priority: 0 },
      ]
      render(<TaskList tasks={tasks} />)

      const taskIds = screen.getAllByText(/task-/).map(el => el.textContent)
      expect(taskIds).toEqual(["task-high", "task-none"])
    })
  })

  describe("collapse/expand", () => {
    it("expands Ready group by default", () => {
      render(<TaskList tasks={sampleTasks} persistCollapsedState={false} />)
      // Tasks should be visible
      expect(screen.getByText("Open task 1")).toBeInTheDocument()
    })

    it("expands In Progress group by default", () => {
      render(<TaskList tasks={sampleTasks} persistCollapsedState={false} />)
      expect(screen.getByText("In progress task")).toBeInTheDocument()
    })

    it("collapses Blocked group by default", () => {
      render(<TaskList tasks={sampleTasks} persistCollapsedState={false} />)
      // Blocked tasks should not be visible when collapsed
      expect(screen.queryByText("Blocked task")).not.toBeInTheDocument()
    })

    it("collapses Other group by default", () => {
      render(<TaskList tasks={sampleTasks} persistCollapsedState={false} />)
      // Other group (deferred/closed) tasks should not be visible
      expect(screen.queryByText("Deferred task")).not.toBeInTheDocument()
      expect(screen.queryByText("Closed task")).not.toBeInTheDocument()
    })

    it("toggles group on header click", () => {
      render(<TaskList tasks={sampleTasks} persistCollapsedState={false} />)

      const readyHeader = screen.getByLabelText(/Ready section/)

      // Initially expanded, tasks visible
      expect(screen.getByText("Open task 1")).toBeInTheDocument()

      // Click to collapse
      fireEvent.click(readyHeader)
      expect(screen.queryByText("Open task 1")).not.toBeInTheDocument()

      // Click to expand again
      fireEvent.click(readyHeader)
      expect(screen.getByText("Open task 1")).toBeInTheDocument()
    })

    it("toggles group on Enter key", () => {
      render(<TaskList tasks={sampleTasks} persistCollapsedState={false} />)

      const readyHeader = screen.getByLabelText(/Ready section/)
      expect(screen.getByText("Open task 1")).toBeInTheDocument()

      fireEvent.keyDown(readyHeader, { key: "Enter" })
      expect(screen.queryByText("Open task 1")).not.toBeInTheDocument()
    })

    it("toggles group on Space key", () => {
      render(<TaskList tasks={sampleTasks} persistCollapsedState={false} />)

      const readyHeader = screen.getByLabelText(/Ready section/)
      expect(screen.getByText("Open task 1")).toBeInTheDocument()

      fireEvent.keyDown(readyHeader, { key: " " })
      expect(screen.queryByText("Open task 1")).not.toBeInTheDocument()
    })

    it("respects defaultCollapsed prop", () => {
      const defaultCollapsed: Partial<Record<TaskGroup, boolean>> = {
        ready: true,
        in_progress: false,
        other: false,
      }
      render(<TaskList tasks={sampleTasks} defaultCollapsed={defaultCollapsed} />)

      // Ready should be collapsed
      expect(screen.queryByText("Open task 1")).not.toBeInTheDocument()

      // In Progress should be expanded
      expect(screen.getByText("In progress task")).toBeInTheDocument()

      // Other should be expanded (overriding default behavior)
      expect(screen.getByText("Deferred task")).toBeInTheDocument()
    })

    it("updates aria-expanded on toggle", () => {
      render(<TaskList tasks={sampleTasks} persistCollapsedState={false} />)

      const readyHeader = screen.getByLabelText(/Ready section/)
      expect(readyHeader).toHaveAttribute("aria-expanded", "true")

      fireEvent.click(readyHeader)
      expect(readyHeader).toHaveAttribute("aria-expanded", "false")
    })
  })

  describe("localStorage persistence", () => {
    beforeEach(() => {
      localStorage.clear()
    })

    afterEach(() => {
      localStorage.clear()
    })

    it("persists collapsed state to localStorage", () => {
      render(<TaskList tasks={sampleTasks} />)

      // Click to collapse Ready group
      const readyHeader = screen.getByLabelText(/Ready section/)
      fireEvent.click(readyHeader)

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}")
      expect(stored.ready).toBe(true)
    })

    it("restores collapsed state from localStorage", () => {
      // Pre-set localStorage with Ready collapsed
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          ready: true,
          in_progress: false,
          blocked: false, // Override default
          other: false,
        }),
      )

      render(<TaskList tasks={sampleTasks} />)

      // Ready should be collapsed (from localStorage)
      expect(screen.queryByText("Open task 1")).not.toBeInTheDocument()

      // Blocked should be expanded (overriding default from localStorage)
      expect(screen.getByText("Blocked task")).toBeInTheDocument()
    })

    it("does not persist when persistCollapsedState is false", () => {
      render(<TaskList tasks={sampleTasks} persistCollapsedState={false} />)

      const readyHeader = screen.getByLabelText(/Ready section/)
      fireEvent.click(readyHeader)

      expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    })

    it("does not read from localStorage when persistCollapsedState is false", () => {
      // Pre-set localStorage with Ready collapsed
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          ready: true,
          in_progress: false,
          blocked: false,
          other: false,
        }),
      )

      render(<TaskList tasks={sampleTasks} persistCollapsedState={false} />)

      // Ready should be expanded (ignoring localStorage, using defaults)
      expect(screen.getByText("Open task 1")).toBeInTheDocument()
    })

    it("defaultCollapsed prop overrides localStorage", () => {
      // Pre-set localStorage with Ready expanded
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          ready: false,
          in_progress: false,
          blocked: false,
          other: false,
        }),
      )

      // But defaultCollapsed says Ready should be collapsed
      render(<TaskList tasks={sampleTasks} defaultCollapsed={{ ready: true }} />)

      // defaultCollapsed should win
      expect(screen.queryByText("Open task 1")).not.toBeInTheDocument()
    })
  })

  describe("callbacks", () => {
    it("calls onStatusChange when task status is changed", () => {
      const onStatusChange = vi.fn()
      render(<TaskList tasks={sampleTasks} onStatusChange={onStatusChange} />)

      // Click status icon on first open task (task-2 is first due to priority sorting)
      const statusButtons = screen.getAllByLabelText("Status: Open. Click to change.")
      fireEvent.click(statusButtons[0])

      // Select a new status
      fireEvent.click(screen.getByRole("option", { name: "In Progress" }))

      expect(onStatusChange).toHaveBeenCalledWith("task-2", "in_progress") // task-2 is first due to priority sorting
    })

    it("calls onTaskClick when task is clicked", () => {
      const onTaskClick = vi.fn()
      render(<TaskList tasks={sampleTasks} onTaskClick={onTaskClick} />)

      // Click on task content
      const taskButton = screen.getByRole("button", { name: /task-2/i })
      fireEvent.click(taskButton)

      expect(onTaskClick).toHaveBeenCalledWith("task-2")
    })
  })

  describe("accessibility", () => {
    it("has list role on container", () => {
      render(<TaskList tasks={sampleTasks} />)
      expect(screen.getByRole("list", { name: "Task list" })).toBeInTheDocument()
    })

    it("has listitem role on each group", () => {
      render(<TaskList tasks={sampleTasks} />)
      const items = screen.getAllByRole("listitem")
      expect(items.length).toBeGreaterThan(0)
    })

    it("group headers have button role", () => {
      render(<TaskList tasks={sampleTasks} />)
      const readyHeader = screen.getByLabelText(/Ready section/)
      expect(readyHeader).toHaveAttribute("role", "button")
    })

    it("group headers are keyboard accessible", () => {
      render(<TaskList tasks={sampleTasks} />)
      const readyHeader = screen.getByLabelText(/Ready section/)
      expect(readyHeader).toHaveAttribute("tabIndex", "0")
    })

    it("task groups have group role", () => {
      render(<TaskList tasks={sampleTasks} />)
      expect(screen.getByRole("group", { name: "Ready tasks" })).toBeInTheDocument()
    })
  })
})
