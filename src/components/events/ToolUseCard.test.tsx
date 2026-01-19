import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, beforeEach } from "vitest"
import { ToolUseCard, type ToolUseEvent, type ToolName } from "./ToolUseCard"
import { useAppStore } from "@/store"

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
  beforeEach(() => {
    useAppStore.getState().reset()
  })

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

  describe("expand behavior for Bash tool", () => {
    it("shows output directly when lines fit within preview", () => {
      render(
        <ToolUseCard
          event={createToolEvent("Bash", {
            input: { command: "echo test" },
            output: "test output",
          })}
        />,
      )
      // Short output is shown immediately
      expect(screen.getByText("test output")).toBeInTheDocument()
    })

    it("shows truncated preview and expands on click anywhere in output", () => {
      const longOutput = "line 1\nline 2\nline 3\nline 4\nline 5\nline 6\nline 7\nline 8"
      render(
        <ToolUseCard
          event={createToolEvent("Bash", {
            input: { command: "echo test" },
            output: longOutput,
          })}
        />,
      )

      // First 5 lines should be visible
      expect(screen.getByText(/line 1/)).toBeInTheDocument()

      // Expand indicator should be present
      expect(screen.getByText(/\.\.\. \+3 lines/)).toBeInTheDocument()

      // Line 8 should not be visible initially
      expect(screen.queryByText("line 8")).not.toBeInTheDocument()

      // Click anywhere on the output to expand
      fireEvent.click(screen.getByText(/line 1/))

      // All lines should now be visible
      expect(screen.getByText(/line 8/)).toBeInTheDocument()
    })

    it("shows error without needing to expand", () => {
      render(
        <ToolUseCard
          event={createToolEvent("Bash", {
            input: { command: "exit 1" },
            status: "error",
            error: "Command failed",
          })}
        />,
      )

      // Error is shown immediately
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

  describe("accessibility", () => {
    it("shows expand indicator and expands on click", () => {
      const longOutput = "line 1\nline 2\nline 3\nline 4\nline 5\nline 6\nline 7"
      render(
        <ToolUseCard
          event={createToolEvent("Bash", {
            input: { command: "test" },
            output: longOutput,
          })}
        />,
      )

      // Expand indicator should be visible
      expect(screen.getByText(/\.\.\. \+2 lines/)).toBeInTheDocument()

      // Click on the output area to expand
      const outputArea = screen.getByText(/line 1/)
      fireEvent.click(outputArea)

      // All content should now be visible
      expect(screen.getByText(/line 7/)).toBeInTheDocument()
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

  describe("relative path display", () => {
    it("shows relative path when file is within workspace", () => {
      useAppStore.getState().setWorkspace("/Users/herbcaudill/Code/HerbCaudill/ralph-ui")
      render(
        <ToolUseCard
          event={createToolEvent("Read", {
            input: {
              file_path: "/Users/herbcaudill/Code/HerbCaudill/ralph-ui/src/components/App.tsx",
            },
          })}
        />,
      )
      expect(screen.getByText("src/components/App.tsx")).toBeInTheDocument()
    })

    it("shows absolute path when file is outside workspace", () => {
      useAppStore.getState().setWorkspace("/Users/herbcaudill/Code/HerbCaudill/ralph-ui")
      render(
        <ToolUseCard
          event={createToolEvent("Read", {
            input: { file_path: "/Users/herbcaudill/Code/other-project/index.ts" },
          })}
        />,
      )
      expect(screen.getByText("/Users/herbcaudill/Code/other-project/index.ts")).toBeInTheDocument()
    })

    it("shows absolute path when workspace is not set", () => {
      // workspace is null by default after reset
      render(
        <ToolUseCard
          event={createToolEvent("Read", {
            input: { file_path: "/Users/herbcaudill/Code/HerbCaudill/ralph-ui/src/App.tsx" },
          })}
        />,
      )
      expect(
        screen.getByText("/Users/herbcaudill/Code/HerbCaudill/ralph-ui/src/App.tsx"),
      ).toBeInTheDocument()
    })

    it("shows relative path for Edit tool", () => {
      useAppStore.getState().setWorkspace("/Users/herbcaudill/Code/HerbCaudill/ralph-ui")
      render(
        <ToolUseCard
          event={createToolEvent("Edit", {
            input: {
              file_path: "/Users/herbcaudill/Code/HerbCaudill/ralph-ui/src/lib/utils.ts",
              old_string: "foo",
              new_string: "bar",
            },
          })}
        />,
      )
      expect(screen.getByText("src/lib/utils.ts")).toBeInTheDocument()
    })

    it("shows relative path for Write tool", () => {
      useAppStore.getState().setWorkspace("/Users/herbcaudill/Code/HerbCaudill/ralph-ui")
      render(
        <ToolUseCard
          event={createToolEvent("Write", {
            input: { file_path: "/Users/herbcaudill/Code/HerbCaudill/ralph-ui/new-file.ts" },
          })}
        />,
      )
      expect(screen.getByText("new-file.ts")).toBeInTheDocument()
    })
  })
})
