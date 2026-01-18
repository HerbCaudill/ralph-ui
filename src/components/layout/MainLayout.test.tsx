import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { MainLayout } from "./MainLayout"

describe("MainLayout", () => {
  it("renders sidebar content", () => {
    render(<MainLayout sidebar={<div>Sidebar Content</div>} />)
    expect(screen.getByText("Sidebar Content")).toBeInTheDocument()
  })

  it("renders main content", () => {
    render(<MainLayout main={<div>Main Content</div>} />)
    expect(screen.getByText("Main Content")).toBeInTheDocument()
  })

  it("renders status bar when provided", () => {
    render(<MainLayout statusBar={<div>Status Bar Content</div>} />)
    expect(screen.getByText("Status Bar Content")).toBeInTheDocument()
  })

  it("does not render status bar when not provided", () => {
    const { container } = render(<MainLayout />)
    expect(container.querySelector("footer")).not.toBeInTheDocument()
  })

  it("toggles sidebar visibility when button is clicked", () => {
    render(<MainLayout sidebar={<div>Sidebar Content</div>} />)

    // Sidebar should be visible initially
    expect(screen.getByText("Sidebar Content")).toBeInTheDocument()

    // Click the collapse button
    const toggleButton = screen.getByRole("button", { name: /collapse sidebar/i })
    fireEvent.click(toggleButton)

    // Sidebar content should be hidden
    expect(screen.queryByText("Sidebar Content")).not.toBeInTheDocument()

    // Click again to expand
    const expandButton = screen.getByRole("button", { name: /expand sidebar/i })
    fireEvent.click(expandButton)

    // Sidebar should be visible again
    expect(screen.getByText("Sidebar Content")).toBeInTheDocument()
  })

  it("applies custom className", () => {
    const { container } = render(<MainLayout className="custom-class" />)
    expect(container.firstChild).toHaveClass("custom-class")
  })
})
