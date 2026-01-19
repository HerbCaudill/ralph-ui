import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { TaskIdLink, containsTaskId } from "./TaskIdLink"
import { TaskDialogProvider } from "@/contexts"

// Helper to render with context
function renderWithContext(ui: React.ReactNode, openTaskById = vi.fn()) {
  return render(<TaskDialogProvider openTaskById={openTaskById}>{ui}</TaskDialogProvider>)
}

describe("TaskIdLink", () => {
  describe("without context", () => {
    it("renders text without changes when no context is provided", () => {
      render(<TaskIdLink>Check out rui-48s for details</TaskIdLink>)
      expect(screen.getByText("Check out rui-48s for details")).toBeInTheDocument()
    })

    it("renders empty string correctly", () => {
      const { container } = render(<TaskIdLink>{""}</TaskIdLink>)
      expect(container.textContent).toBe("")
    })
  })

  describe("with context", () => {
    it("renders text without task IDs unchanged", () => {
      renderWithContext(<TaskIdLink>Hello world</TaskIdLink>)
      expect(screen.getByText("Hello world")).toBeInTheDocument()
    })

    it("converts task ID to clickable link", () => {
      const openTaskById = vi.fn()
      renderWithContext(<TaskIdLink>Check out rui-48s for details</TaskIdLink>, openTaskById)

      const link = screen.getByRole("button", { name: "View task rui-48s" })
      expect(link).toBeInTheDocument()
      expect(link).toHaveTextContent("rui-48s")
    })

    it("calls openTaskById when task link is clicked", () => {
      const openTaskById = vi.fn()
      renderWithContext(<TaskIdLink>Check rui-48s</TaskIdLink>, openTaskById)

      const link = screen.getByRole("button", { name: "View task rui-48s" })
      fireEvent.click(link)

      expect(openTaskById).toHaveBeenCalledWith("rui-48s")
      expect(openTaskById).toHaveBeenCalledTimes(1)
    })

    it("handles multiple task IDs in same text", () => {
      const openTaskById = vi.fn()
      renderWithContext(
        <TaskIdLink>See rui-48s and also rui-26f for details</TaskIdLink>,
        openTaskById,
      )

      const link1 = screen.getByRole("button", { name: "View task rui-48s" })
      const link2 = screen.getByRole("button", { name: "View task rui-26f" })

      expect(link1).toBeInTheDocument()
      expect(link2).toBeInTheDocument()

      fireEvent.click(link1)
      expect(openTaskById).toHaveBeenCalledWith("rui-48s")

      fireEvent.click(link2)
      expect(openTaskById).toHaveBeenCalledWith("rui-26f")
    })

    it("handles different project prefixes", () => {
      const openTaskById = vi.fn()
      renderWithContext(<TaskIdLink>Tasks: proj-abc123, foo-1, bar-xyz</TaskIdLink>, openTaskById)

      expect(screen.getByRole("button", { name: "View task proj-abc123" })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: "View task foo-1" })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: "View task bar-xyz" })).toBeInTheDocument()
    })

    it("preserves text before, between, and after task IDs", () => {
      const { container } = renderWithContext(<TaskIdLink>Start rui-1 middle rui-2 end</TaskIdLink>)

      // Check the full text content
      expect(container.textContent).toBe("Start rui-1 middle rui-2 end")

      // Verify both task IDs are clickable
      expect(screen.getByRole("button", { name: "View task rui-1" })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: "View task rui-2" })).toBeInTheDocument()
    })

    it("does not linkify uppercase task IDs", () => {
      renderWithContext(<TaskIdLink>RUI-48S is not a valid task ID</TaskIdLink>)

      const buttons = screen.queryAllByRole("button")
      expect(buttons).toHaveLength(0)
    })

    it("does not linkify IDs with only prefix", () => {
      renderWithContext(<TaskIdLink>rui- is incomplete</TaskIdLink>)

      const buttons = screen.queryAllByRole("button")
      expect(buttons).toHaveLength(0)
    })

    it("stops event propagation when clicking task link", () => {
      const openTaskById = vi.fn()
      const parentClick = vi.fn()

      render(
        <TaskDialogProvider openTaskById={openTaskById}>
          <div onClick={parentClick}>
            <TaskIdLink>Click rui-48s here</TaskIdLink>
          </div>
        </TaskDialogProvider>,
      )

      const link = screen.getByRole("button", { name: "View task rui-48s" })
      fireEvent.click(link)

      expect(openTaskById).toHaveBeenCalled()
      expect(parentClick).not.toHaveBeenCalled()
    })
  })
})

describe("containsTaskId", () => {
  it("returns true for text containing a task ID", () => {
    expect(containsTaskId("Check rui-48s")).toBe(true)
    expect(containsTaskId("proj-abc123")).toBe(true)
  })

  it("returns false for text without task IDs", () => {
    expect(containsTaskId("Hello world")).toBe(false)
    expect(containsTaskId("")).toBe(false)
    expect(containsTaskId("RUI-48S")).toBe(false)
    expect(containsTaskId("rui-")).toBe(false)
  })
})
