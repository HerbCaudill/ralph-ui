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

    it("renders timestamp", () => {
      const date = new Date(2024, 0, 18, 14, 30, 45, 123)
      render(<ToolUseCard event={createToolEvent("Read", { timestamp: date.getTime() })} />)
      expect(screen.getByText("14:30:45.123")).toBeInTheDocument()
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

    it("renders todo count summary for TodoWrite tool", () => {
      render(
        <ToolUseCard
          event={createToolEvent("TodoWrite", {
            input: { todos: [{ content: "Task 1" }, { content: "Task 2" }] },
          })}
        />,
      )
      expect(screen.getByText("2 todo(s)")).toBeInTheDocument()
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

    it("renders duration when present", () => {
      render(
        <ToolUseCard
          event={createToolEvent("Read", {
            duration: 1234,
          })}
        />,
      )
      expect(screen.getByText("1.2s")).toBeInTheDocument()
    })

    it("renders duration in ms for short durations", () => {
      render(
        <ToolUseCard
          event={createToolEvent("Read", {
            duration: 456,
          })}
        />,
      )
      expect(screen.getByText("456ms")).toBeInTheDocument()
    })

    it("renders duration in minutes for long durations", () => {
      render(
        <ToolUseCard
          event={createToolEvent("Bash", {
            duration: 125000, // 2 minutes 5 seconds
          })}
        />,
      )
      expect(screen.getByText("2m 5s")).toBeInTheDocument()
    })
  })

  describe("tool-specific icons and colors", () => {
    const tools: ToolName[] = [
      "Read",
      "Edit",
      "Write",
      "Bash",
      "Grep",
      "Glob",
      "WebSearch",
      "WebFetch",
      "TodoWrite",
      "Task",
    ]

    it.each(tools)("renders %s tool with appropriate styling", tool => {
      render(<ToolUseCard event={createToolEvent(tool)} />)
      // Just verify the tool renders without errors
      expect(
        screen.getByText(
          tool === "WebSearch" ? "Web Search"
          : tool === "WebFetch" ? "Web Fetch"
          : tool === "TodoWrite" ? "Todo"
          : tool,
        ),
      ).toBeInTheDocument()
    })
  })

  describe("status indicator", () => {
    it("shows gray indicator for pending status", () => {
      render(<ToolUseCard event={createToolEvent("Read", { status: "pending" })} />)
      expect(screen.getByLabelText("pending")).toHaveClass("bg-gray-400")
    })

    it("shows blue pulsing indicator for running status", () => {
      render(<ToolUseCard event={createToolEvent("Read", { status: "running" })} />)
      const indicator = screen.getByLabelText("running")
      expect(indicator).toHaveClass("bg-blue-500")
      expect(indicator).toHaveClass("animate-pulse")
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

  describe("expand/collapse behavior", () => {
    it("does not show expand button when no details", () => {
      const { container } = render(<ToolUseCard event={createToolEvent("Read")} />)
      // No chevron icon should be present
      const chevrons = container.querySelectorAll("svg")
      // Should only have the tool icon, no chevron
      expect(chevrons.length).toBe(1)
    })

    it("shows expand button when input is present", () => {
      const { container } = render(
        <ToolUseCard
          event={createToolEvent("Read", {
            input: { file_path: "/test.ts" },
          })}
        />,
      )
      // Should have tool icon + chevron
      const chevrons = container.querySelectorAll("svg")
      expect(chevrons.length).toBe(2)
    })

    it("expands to show input details on click", () => {
      render(
        <ToolUseCard
          event={createToolEvent("Read", {
            input: { file_path: "/test.ts" },
          })}
        />,
      )

      // Input details should not be visible initially
      expect(screen.queryByText("Input")).not.toBeInTheDocument()

      // Click to expand
      fireEvent.click(screen.getByRole("button"))

      // Input details should now be visible
      expect(screen.getByText("Input")).toBeInTheDocument()
      expect(screen.getByText(/file_path/)).toBeInTheDocument()
    })

    it("shows output when expanded", () => {
      render(
        <ToolUseCard
          event={createToolEvent("Read", {
            output: "File contents here",
          })}
        />,
      )

      fireEvent.click(screen.getByRole("button"))

      expect(screen.getByText("Output")).toBeInTheDocument()
      expect(screen.getByText("File contents here")).toBeInTheDocument()
    })

    it("shows error when expanded", () => {
      render(
        <ToolUseCard
          event={createToolEvent("Read", {
            status: "error",
            error: "File not found",
          })}
        />,
      )

      fireEvent.click(screen.getByRole("button"))

      expect(screen.getByText("Error")).toBeInTheDocument()
      expect(screen.getByText("File not found")).toBeInTheDocument()
    })

    it("collapses on second click", () => {
      render(
        <ToolUseCard
          event={createToolEvent("Read", {
            input: { file_path: "/test.ts" },
          })}
        />,
      )

      const button = screen.getByRole("button")

      // Expand
      fireEvent.click(button)
      expect(screen.getByText("Input")).toBeInTheDocument()

      // Collapse
      fireEvent.click(button)
      expect(screen.queryByText("Input")).not.toBeInTheDocument()
    })

    it("starts expanded when defaultExpanded is true", () => {
      render(
        <ToolUseCard
          event={createToolEvent("Read", {
            input: { file_path: "/test.ts" },
          })}
          defaultExpanded
        />,
      )

      expect(screen.getByText("Input")).toBeInTheDocument()
    })
  })

  describe("aria attributes", () => {
    it("has aria-expanded attribute", () => {
      render(
        <ToolUseCard
          event={createToolEvent("Read", {
            input: { file_path: "/test.ts" },
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
