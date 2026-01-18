import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { ToolUseCard, type ToolUseEvent, type ToolName } from "./ToolUseCard"

// Helper to create a basic tool use event
function createToolEvent(tool: ToolName, overrides?: Partial<ToolUseEvent>): ToolUseEvent {
  return {
    type: "tool_use",
    timestamp: 1705600000000,
    tool,
    ...overrides,
  }
}

describe("ToolUseCard", () => {
  describe("rendering", () => {
    it("renders tool name", () => {
      render(<ToolUseCard event={createToolEvent("Read")} />)
      expect(screen.getByText("Read")).toBeInTheDocument()
    })

    it("renders file path summary for Read tool", () => {
      render(
        <ToolUseCard
          event={createToolEvent("Read", {
            input: { file_path: "/path/to/file.ts" },
          })}
        />,
      )
      expect(screen.getByText("/path/to/file.ts")).toBeInTheDocument()
    })

    it("renders command summary for Bash tool", () => {
      render(
        <ToolUseCard
          event={createToolEvent("Bash", {
            input: { command: "npm install" },
          })}
        />,
      )
      expect(screen.getByText("npm install")).toBeInTheDocument()
    })

    it("renders pattern summary for Grep tool", () => {
      render(
        <ToolUseCard
          event={createToolEvent("Grep", {
            input: { pattern: "TODO:" },
          })}
        />,
      )
      expect(screen.getByText("TODO:")).toBeInTheDocument()
    })

    it("renders pattern summary for Glob tool", () => {
      render(
        <ToolUseCard
          event={createToolEvent("Glob", {
            input: { pattern: "**/*.tsx" },
          })}
        />,
      )
      expect(screen.getByText("**/*.tsx")).toBeInTheDocument()
    })

    it("renders query summary for WebSearch tool", () => {
      render(
        <ToolUseCard
          event={createToolEvent("WebSearch", {
            input: { query: "react hooks" },
          })}
        />,
      )
      expect(screen.getByText("react hooks")).toBeInTheDocument()
    })

    it("renders URL summary for WebFetch tool", () => {
      render(
        <ToolUseCard
          event={createToolEvent("WebFetch", {
            input: { url: "https://example.com" },
          })}
        />,
      )
      expect(screen.getByText("https://example.com")).toBeInTheDocument()
    })

    it("renders description summary for Task tool", () => {
      render(
        <ToolUseCard
          event={createToolEvent("Task", {
            input: { description: "Run tests" },
          })}
        />,
      )
      expect(screen.getByText("Run tests")).toBeInTheDocument()
    })
  })

  describe("TodoWrite tool", () => {
    it("renders Update Todos label", () => {
      render(
        <ToolUseCard
          event={createToolEvent("TodoWrite", {
            input: {
              todos: [
                { content: "Task 1", status: "completed" },
                { content: "Task 2", status: "pending" },
              ],
            },
          })}
        />,
      )
      expect(screen.getByText("Update Todos")).toBeInTheDocument()
    })

    it("renders todo items", () => {
      render(
        <ToolUseCard
          event={createToolEvent("TodoWrite", {
            input: {
              todos: [
                { content: "Task 1", status: "completed" },
                { content: "Task 2", status: "pending" },
              ],
            },
          })}
        />,
      )
      expect(screen.getByText("Task 1")).toBeInTheDocument()
      expect(screen.getByText("Task 2")).toBeInTheDocument()
    })

    it("shows checkmark for completed todos", () => {
      render(
        <ToolUseCard
          event={createToolEvent("TodoWrite", {
            input: {
              todos: [{ content: "Task 1", status: "completed" }],
            },
          })}
        />,
      )
      expect(screen.getByText("✓")).toBeInTheDocument()
    })
  })

  describe("status indicator", () => {
    it("shows amber indicator for pending status", () => {
      render(<ToolUseCard event={createToolEvent("Read", { status: "pending" })} />)
      expect(screen.getByLabelText("pending")).toHaveClass("bg-amber-500")
    })

    it("shows blue indicator for running status", () => {
      render(<ToolUseCard event={createToolEvent("Read", { status: "running" })} />)
      const indicator = screen.getByLabelText("running")
      expect(indicator).toHaveClass("bg-blue-500")
    })

    it("shows green indicator for success status", () => {
      render(<ToolUseCard event={createToolEvent("Read", { status: "success" })} />)
      expect(screen.getByLabelText("success")).toHaveClass("bg-green-500")
    })

    it("shows red indicator for error status", () => {
      render(<ToolUseCard event={createToolEvent("Read", { status: "error" })} />)
      expect(screen.getByLabelText("error")).toHaveClass("bg-red-500")
    })
  })

  describe("expand/collapse behavior for Bash tool", () => {
    it("shows expand button when output is present", () => {
      const { container } = render(
        <ToolUseCard
          event={createToolEvent("Bash", {
            input: { command: "echo test" },
            output: "test output",
          })}
        />,
      )
      const svgs = container.querySelectorAll("svg")
      expect(svgs.length).toBeGreaterThan(0)
    })

    it("expands to show output on click", () => {
      render(
        <ToolUseCard
          event={createToolEvent("Bash", {
            input: { command: "echo test" },
            output: "test output here",
          })}
        />,
      )

      // Output should not be fully visible initially
      expect(screen.queryByText("test output here")).not.toBeInTheDocument()

      // Click to expand
      fireEvent.click(screen.getByRole("button"))

      // Output should now be visible
      expect(screen.getByText("test output here")).toBeInTheDocument()
    })

    it("shows error when status is error", () => {
      render(
        <ToolUseCard
          event={createToolEvent("Bash", {
            input: { command: "exit 1" },
            status: "error",
            error: "Command failed",
          })}
        />,
      )

      fireEvent.click(screen.getByRole("button"))

      expect(screen.getByText("Command failed")).toBeInTheDocument()
    })
  })

  describe("Read tool output summary", () => {
    it("shows read line count when output is present", () => {
      render(
        <ToolUseCard
          event={createToolEvent("Read", {
            input: { file_path: "/test.ts" },
            output: "line 1\nline 2\nline 3",
          })}
        />,
      )

      expect(screen.getByText(/Read 3 lines/)).toBeInTheDocument()
    })

    it("shows singular line for single line output", () => {
      render(
        <ToolUseCard
          event={createToolEvent("Read", {
            input: { file_path: "/test.ts" },
            output: "single line",
          })}
        />,
      )

      expect(screen.getByText(/Read 1 line/)).toBeInTheDocument()
    })
  })

  describe("Edit tool diff view", () => {
    it("shows diff when old_string and new_string are present", () => {
      render(
        <ToolUseCard
          event={createToolEvent("Edit", {
            input: {
              file_path: "/test.ts",
              old_string: "const x = 1",
              new_string: "const x = 2",
            },
          })}
          defaultExpanded
        />,
      )

      expect(screen.getByText("const x = 1")).toBeInTheDocument()
      expect(screen.getByText("const x = 2")).toBeInTheDocument()
    })
  })

  describe("aria attributes", () => {
    it("has aria-expanded attribute on expandable cards", () => {
      render(
        <ToolUseCard
          event={createToolEvent("Bash", {
            input: { command: "test" },
            output: "test output",
          })}
        />,
      )

      const button = screen.getByRole("button")
      expect(button).toHaveAttribute("aria-expanded", "false")

      fireEvent.click(button)
      expect(button).toHaveAttribute("aria-expanded", "true")
    })
  })

  describe("styling", () => {
    it("applies custom className", () => {
      const { container } = render(
        <ToolUseCard event={createToolEvent("Read")} className="custom-class" />,
      )
      expect(container.firstChild).toHaveClass("custom-class")
    })
  })
})
