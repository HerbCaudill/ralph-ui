import { render, screen, waitFor } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { CodeBlock } from "./code-block"

describe("CodeBlock", () => {
  it("renders code content", async () => {
    render(<CodeBlock code="const x = 1;" language="typescript" />)
    // Initially shows loading state with plain code
    expect(screen.getByText("const x = 1;")).toBeInTheDocument()
  })

  it("renders with syntax highlighting", async () => {
    render(<CodeBlock code="const x = 1;" language="typescript" isDark={true} />)

    // Wait for shiki to load and highlight
    await waitFor(
      () => {
        const container = document.querySelector("[class*='shiki']")
        expect(container).toBeInTheDocument()
      },
      { timeout: 5000 },
    )
  })

  it("handles light theme", async () => {
    render(<CodeBlock code="const x = 1;" language="typescript" isDark={false} />)

    // Wait for shiki to load and highlight with light theme
    await waitFor(
      () => {
        const container = document.querySelector("[class*='github-light']")
        expect(container).toBeInTheDocument()
      },
      { timeout: 5000 },
    )
  })

  it("handles dark theme", async () => {
    render(<CodeBlock code="const x = 1;" language="typescript" isDark={true} />)

    // Wait for shiki to load and highlight with dark theme
    await waitFor(
      () => {
        const container = document.querySelector("[class*='github-dark']")
        expect(container).toBeInTheDocument()
      },
      { timeout: 5000 },
    )
  })

  it("handles language aliases", async () => {
    render(<CodeBlock code="const x = 1;" language="ts" isDark={true} />)

    // Should work with "ts" alias for "typescript"
    await waitFor(
      () => {
        const container = document.querySelector("[class*='shiki']")
        expect(container).toBeInTheDocument()
      },
      { timeout: 5000 },
    )
  })

  it("handles unknown languages gracefully", async () => {
    render(<CodeBlock code="some code" language="unknownlanguage" isDark={true} />)

    // Should still render with text fallback
    await waitFor(
      () => {
        const container = document.querySelector("[class*='shiki']")
        expect(container).toBeInTheDocument()
      },
      { timeout: 5000 },
    )
  })

  it("applies custom className", () => {
    const { container } = render(
      <CodeBlock code="const x = 1;" language="typescript" className="custom-class" />,
    )
    // The custom class is on the outermost wrapper
    expect(container.firstChild).toHaveClass("custom-class")
  })

  it("preserves multiline code", async () => {
    const multilineCode = `function test() {
  return 42;
}`
    render(<CodeBlock code={multilineCode} language="javascript" />)

    // Check that the code content is preserved
    expect(screen.getByText(/function test/)).toBeInTheDocument()
    expect(screen.getByText(/return 42/)).toBeInTheDocument()
  })
})
