import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { TextBlock, type TextEvent } from "./TextBlock"

// Helper to create a basic text event
function createTextEvent(content: string, overrides?: Partial<TextEvent>): TextEvent {
  return {
    type: "text",
    timestamp: 1705600000000,
    content,
    ...overrides,
  }
}

describe("TextBlock", () => {
  describe("rendering", () => {
    it("renders text content", () => {
      render(<TextBlock event={createTextEvent("Hello, world!")} />)
      expect(screen.getByText("Hello, world!")).toBeInTheDocument()
    })

    it("renders timestamp", () => {
      const date = new Date(2024, 0, 18, 14, 30, 45, 123)
      render(<TextBlock event={createTextEvent("Test", { timestamp: date.getTime() })} />)
      expect(screen.getByText("14:30:45.123")).toBeInTheDocument()
    })

    it("renders assistant role badge by default", () => {
      render(<TextBlock event={createTextEvent("Test")} />)
      expect(screen.getByText("Claude")).toBeInTheDocument()
    })

    it("renders user role badge", () => {
      render(<TextBlock event={createTextEvent("Test", { role: "user" })} />)
      expect(screen.getByText("User")).toBeInTheDocument()
    })

    it("renders system role badge", () => {
      render(<TextBlock event={createTextEvent("Test", { role: "system" })} />)
      expect(screen.getByText("System")).toBeInTheDocument()
    })

    it("renders assistant role badge explicitly", () => {
      render(<TextBlock event={createTextEvent("Test", { role: "assistant" })} />)
      expect(screen.getByText("Claude")).toBeInTheDocument()
    })
  })

  describe("markdown rendering", () => {
    it("renders bold text", () => {
      render(<TextBlock event={createTextEvent("This is **bold** text")} />)
      const boldElement = screen.getByText("bold")
      expect(boldElement.tagName).toBe("STRONG")
    })

    it("renders italic text", () => {
      render(<TextBlock event={createTextEvent("This is *italic* text")} />)
      const italicElement = screen.getByText("italic")
      expect(italicElement.tagName).toBe("EM")
    })

    it("renders code inline", () => {
      render(<TextBlock event={createTextEvent("Use `const` for constants")} />)
      const codeElement = screen.getByText("const")
      expect(codeElement.tagName).toBe("CODE")
    })

    it("renders code blocks", () => {
      const codeBlock = `\`\`\`typescript
const x = 1
\`\`\``
      render(<TextBlock event={createTextEvent(codeBlock)} />)
      expect(screen.getByText(/const x = 1/)).toBeInTheDocument()
    })

    it("renders links", () => {
      render(<TextBlock event={createTextEvent("[Click here](https://example.com)")} />)
      const link = screen.getByRole("link", { name: "Click here" })
      expect(link).toHaveAttribute("href", "https://example.com")
    })

    it("renders unordered lists", () => {
      const list = `- Item 1
- Item 2
- Item 3`
      render(<TextBlock event={createTextEvent(list)} />)
      expect(screen.getByText("Item 1")).toBeInTheDocument()
      expect(screen.getByText("Item 2")).toBeInTheDocument()
      expect(screen.getByText("Item 3")).toBeInTheDocument()
    })

    it("renders ordered lists", () => {
      const list = `1. First
2. Second
3. Third`
      render(<TextBlock event={createTextEvent(list)} />)
      expect(screen.getByText("First")).toBeInTheDocument()
      expect(screen.getByText("Second")).toBeInTheDocument()
      expect(screen.getByText("Third")).toBeInTheDocument()
    })

    it("renders headings", () => {
      render(<TextBlock event={createTextEvent("# Heading 1")} />)
      const heading = screen.getByRole("heading", { level: 1 })
      expect(heading).toHaveTextContent("Heading 1")
    })

    it("renders blockquotes", () => {
      render(<TextBlock event={createTextEvent("> This is a quote")} />)
      const quote = screen.getByText("This is a quote")
      expect(quote.closest("blockquote")).toBeInTheDocument()
    })

    // GFM (GitHub Flavored Markdown) features
    it("renders strikethrough text (GFM)", () => {
      render(<TextBlock event={createTextEvent("This is ~~deleted~~ text")} />)
      const deletedElement = screen.getByText("deleted")
      expect(deletedElement.tagName).toBe("DEL")
    })

    it("renders tables (GFM)", () => {
      const table = `| Column 1 | Column 2 |
| --- | --- |
| Cell 1 | Cell 2 |`
      render(<TextBlock event={createTextEvent(table)} />)
      expect(screen.getByRole("table")).toBeInTheDocument()
      expect(screen.getByText("Column 1")).toBeInTheDocument()
      expect(screen.getByText("Cell 1")).toBeInTheDocument()
    })

    it("renders task lists (GFM)", () => {
      const taskList = `- [x] Completed task
- [ ] Incomplete task`
      render(<TextBlock event={createTextEvent(taskList)} />)
      const checkboxes = screen.getAllByRole("checkbox")
      expect(checkboxes).toHaveLength(2)
      expect(checkboxes[0]).toBeChecked()
      expect(checkboxes[1]).not.toBeChecked()
    })
  })

  describe("styling", () => {
    it("applies custom className", () => {
      render(<TextBlock event={createTextEvent("Test")} className="custom-class" />)
      const block = screen.getByTestId("text-block")
      expect(block).toHaveClass("custom-class")
    })

    it("has border-b class for visual separation", () => {
      render(<TextBlock event={createTextEvent("Test")} />)
      const block = screen.getByTestId("text-block")
      expect(block).toHaveClass("border-b")
    })
  })

  describe("role styling", () => {
    it("applies purple color for assistant role", () => {
      render(<TextBlock event={createTextEvent("Test", { role: "assistant" })} />)
      // The badge is the span containing both the icon and the text
      const textSpan = screen.getByText("Claude")
      const badge = textSpan.parentElement
      expect(badge).toHaveClass("text-purple-500")
    })

    it("applies green color for user role", () => {
      render(<TextBlock event={createTextEvent("Test", { role: "user" })} />)
      const textSpan = screen.getByText("User")
      const badge = textSpan.parentElement
      expect(badge).toHaveClass("text-green-500")
    })

    it("applies amber color for system role", () => {
      render(<TextBlock event={createTextEvent("Test", { role: "system" })} />)
      const textSpan = screen.getByText("System")
      const badge = textSpan.parentElement
      expect(badge).toHaveClass("text-amber-500")
    })
  })

  describe("multiline content", () => {
    it("renders multiple paragraphs", () => {
      const content = `First paragraph.

Second paragraph.

Third paragraph.`
      render(<TextBlock event={createTextEvent(content)} />)
      expect(screen.getByText("First paragraph.")).toBeInTheDocument()
      expect(screen.getByText("Second paragraph.")).toBeInTheDocument()
      expect(screen.getByText("Third paragraph.")).toBeInTheDocument()
    })

    it("renders complex markdown content", () => {
      const content = `# Analysis Results

Here's what I found:

1. **Issue 1**: The \`config\` file is missing
2. **Issue 2**: Dependencies are outdated

> Note: This needs immediate attention

\`\`\`bash
npm update
\`\`\``
      render(<TextBlock event={createTextEvent(content)} />)
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Analysis Results")
      expect(screen.getByText("Issue 1")).toBeInTheDocument()
      expect(screen.getByText("config")).toBeInTheDocument()
      expect(screen.getByText(/npm update/)).toBeInTheDocument()
    })
  })
})
