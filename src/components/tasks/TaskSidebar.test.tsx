import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { TaskSidebar } from "./TaskSidebar"

describe("TaskSidebar", () => {
  describe("rendering", () => {
    it("renders with complementary role", () => {
      render(<TaskSidebar />)
      expect(screen.getByRole("complementary", { name: "Task sidebar" })).toBeInTheDocument()
    })

    it("renders empty state when no taskList provided", () => {
      render(<TaskSidebar />)
      expect(screen.getByText("No tasks yet")).toBeInTheDocument()
    })

    it("applies custom className", () => {
      render(<TaskSidebar className="custom-class" />)
      expect(screen.getByRole("complementary")).toHaveClass("custom-class")
    })
  })

  describe("slots", () => {
    it("renders quickInput when provided", () => {
      render(<TaskSidebar quickInput={<div data-testid="quick-input">Quick input</div>} />)
      expect(screen.getByTestId("quick-input")).toBeInTheDocument()
      expect(screen.getByText("Quick input")).toBeInTheDocument()
    })

    it("does not render quickInput area when not provided", () => {
      const { container } = render(<TaskSidebar />)
      // No border-b elements when quickInput not provided (component has no header)
      const borderBElements = container.querySelectorAll(".border-b")
      expect(borderBElements).toHaveLength(0)
    })

    it("renders taskList when provided", () => {
      render(<TaskSidebar taskList={<div data-testid="task-list">Task list</div>} />)
      expect(screen.getByTestId("task-list")).toBeInTheDocument()
      expect(screen.getByText("Task list")).toBeInTheDocument()
    })

    it("hides empty state when taskList is provided", () => {
      render(<TaskSidebar taskList={<div>Task list</div>} />)
      expect(screen.queryByText("No tasks yet")).not.toBeInTheDocument()
    })

    it("renders both quickInput and taskList together", () => {
      render(
        <TaskSidebar
          quickInput={<div data-testid="quick-input">Quick input</div>}
          taskList={<div data-testid="task-list">Task list</div>}
        />,
      )
      expect(screen.getByTestId("quick-input")).toBeInTheDocument()
      expect(screen.getByTestId("task-list")).toBeInTheDocument()
    })
  })

  describe("layout", () => {
    it("has flexbox column layout", () => {
      render(<TaskSidebar />)
      const sidebar = screen.getByRole("complementary")
      expect(sidebar).toHaveClass("flex", "flex-col")
    })

    it("has full height", () => {
      render(<TaskSidebar />)
      const sidebar = screen.getByRole("complementary")
      expect(sidebar).toHaveClass("h-full")
    })

    it("task list area has overflow scroll", () => {
      render(<TaskSidebar taskList={<div data-testid="task-list-content">My tasks</div>} />)
      // The task list container should have overflow-y-auto
      const taskListContainer = screen.getByTestId("task-list-content").parentElement
      expect(taskListContainer).toHaveClass("overflow-y-auto")
    })
  })

  describe("styling", () => {
    it("quick input area has correct border styling", () => {
      render(<TaskSidebar quickInput={<div>Input</div>} />)
      const inputContainer = screen.getByText("Input").parentElement
      expect(inputContainer).toHaveClass("border-b", "border-border")
    })
  })
})
