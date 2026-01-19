import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor, cleanup, act } from "@testing-library/react"
import { TaskDetailsDialog } from "./TaskDetailsDialog"
import type { TaskCardTask } from "./TaskCard"

// Helper functions

function typeInInput(input: HTMLElement, value: string) {
  fireEvent.change(input, { target: { value } })
}

describe("TaskDetailsDialog", () => {
  const mockTask: TaskCardTask = {
    id: "test-123",
    title: "Test Task",
    description: "This is a test description",
    status: "open",
    priority: 2,
    issue_type: "task",
    parent: "parent-456",
  }

  const mockOnClose = vi.fn()
  const mockOnSave = vi.fn()

  beforeEach(() => {
    mockOnClose.mockClear()
    mockOnSave.mockClear()
  })

  afterEach(() => {
    cleanup()
  })

  describe("rendering", () => {
    it("renders task details when open", () => {
      render(
        <TaskDetailsDialog task={mockTask} open={true} onClose={mockOnClose} onSave={mockOnSave} />,
      )

      expect(screen.getByText("test-123")).toBeInTheDocument()
      expect(screen.getByDisplayValue("Test Task")).toBeInTheDocument()
      expect(screen.getByDisplayValue("This is a test description")).toBeInTheDocument()
    })

    it("does not render when task is null", () => {
      render(
        <TaskDetailsDialog task={null} open={true} onClose={mockOnClose} onSave={mockOnSave} />,
      )

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    })

    it("does not render when open is false", () => {
      render(
        <TaskDetailsDialog
          task={mockTask}
          open={false}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />,
      )

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    })

    it("shows task ID in header", () => {
      render(
        <TaskDetailsDialog task={mockTask} open={true} onClose={mockOnClose} onSave={mockOnSave} />,
      )

      expect(screen.getByText("test-123")).toBeInTheDocument()
    })

    it("shows task type and parent in metadata section", () => {
      render(
        <TaskDetailsDialog task={mockTask} open={true} onClose={mockOnClose} onSave={mockOnSave} />,
      )

      expect(screen.getByText("task")).toBeInTheDocument()
      expect(screen.getByText("parent-456")).toBeInTheDocument()
    })

    it("does not show metadata section when no type or parent", () => {
      const taskWithoutMetadata: TaskCardTask = {
        id: "test-123",
        title: "Test Task",
        status: "open",
      }

      render(
        <TaskDetailsDialog
          task={taskWithoutMetadata}
          open={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />,
      )

      expect(screen.queryByText("Type:")).not.toBeInTheDocument()
      expect(screen.queryByText("Parent:")).not.toBeInTheDocument()
    })
  })

  describe("read-only mode", () => {
    it("displays values as text instead of inputs when readOnly", () => {
      render(
        <TaskDetailsDialog
          task={mockTask}
          open={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          readOnly={true}
        />,
      )

      // Should show text, not inputs
      expect(screen.queryByRole("textbox", { name: /title/i })).not.toBeInTheDocument()
      expect(screen.getByText("Test Task")).toBeInTheDocument()
    })

    it("does not show save button in read-only mode", () => {
      render(
        <TaskDetailsDialog
          task={mockTask}
          open={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          readOnly={true}
        />,
      )

      expect(screen.queryByRole("button", { name: /save/i })).not.toBeInTheDocument()
    })

    it("does not show cancel button in read-only mode", () => {
      render(
        <TaskDetailsDialog
          task={mockTask}
          open={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          readOnly={true}
        />,
      )

      expect(screen.queryByRole("button", { name: /cancel/i })).not.toBeInTheDocument()
    })
  })

  describe("editing", () => {
    it("allows editing title", async () => {
      render(
        <TaskDetailsDialog task={mockTask} open={true} onClose={mockOnClose} onSave={mockOnSave} />,
      )

      const titleInput = screen.getByLabelText(/title/i)
      typeInInput(titleInput, "Updated Title")

      expect(titleInput).toHaveValue("Updated Title")
    })

    it("allows editing description", async () => {
      render(
        <TaskDetailsDialog task={mockTask} open={true} onClose={mockOnClose} onSave={mockOnSave} />,
      )

      const descInput = screen.getByLabelText(/description/i)
      typeInInput(descInput, "Updated description")

      expect(descInput).toHaveValue("Updated description")
    })

    it("enables save button when changes are made", async () => {
      render(
        <TaskDetailsDialog task={mockTask} open={true} onClose={mockOnClose} onSave={mockOnSave} />,
      )

      const saveButton = screen.getByRole("button", { name: /save/i })
      expect(saveButton).toBeDisabled()

      const titleInput = screen.getByLabelText(/title/i)
      typeInInput(titleInput, "New Title")

      await waitFor(() => {
        expect(saveButton).toBeEnabled()
      })
    })

    it("disables save button when changes are reverted", async () => {
      render(
        <TaskDetailsDialog task={mockTask} open={true} onClose={mockOnClose} onSave={mockOnSave} />,
      )

      const saveButton = screen.getByRole("button", { name: /save/i })
      const titleInput = screen.getByLabelText(/title/i)

      typeInInput(titleInput, "New Title")
      await waitFor(() => {
        expect(saveButton).toBeEnabled()
      })

      typeInInput(titleInput, mockTask.title)
      await waitFor(() => {
        expect(saveButton).toBeDisabled()
      })
    })
  })

  describe("saving", () => {
    it("calls onSave with updated fields when save is clicked", async () => {
      render(
        <TaskDetailsDialog task={mockTask} open={true} onClose={mockOnClose} onSave={mockOnSave} />,
      )

      const titleInput = screen.getByLabelText(/title/i)
      typeInInput(titleInput, "Updated Title")

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /save/i })).toBeEnabled()
      })

      const saveButton = screen.getByRole("button", { name: /save/i })
      await act(async () => {
        fireEvent.click(saveButton)
      })

      expect(mockOnSave).toHaveBeenCalledWith(mockTask.id, { title: "Updated Title" })
    })

    it("only includes changed fields in save payload", async () => {
      render(
        <TaskDetailsDialog task={mockTask} open={true} onClose={mockOnClose} onSave={mockOnSave} />,
      )

      const titleInput = screen.getByLabelText(/title/i)
      typeInInput(titleInput, "Updated Title")

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /save/i })).toBeEnabled()
      })

      const saveButton = screen.getByRole("button", { name: /save/i })
      await act(async () => {
        fireEvent.click(saveButton)
      })

      // Should only include title, not description or other unchanged fields
      expect(mockOnSave).toHaveBeenCalledWith(mockTask.id, { title: "Updated Title" })
    })

    it("calls onClose after successful save", async () => {
      mockOnSave.mockResolvedValue(undefined)

      render(
        <TaskDetailsDialog task={mockTask} open={true} onClose={mockOnClose} onSave={mockOnSave} />,
      )

      const titleInput = screen.getByLabelText(/title/i)
      typeInInput(titleInput, "Updated Title")

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /save/i })).toBeEnabled()
      })

      const saveButton = screen.getByRole("button", { name: /save/i })
      await act(async () => {
        fireEvent.click(saveButton)
      })

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled()
      })
    })

    it("shows saving state while save is in progress", async () => {
      let resolvePromise: () => void = () => {}
      mockOnSave.mockImplementation(
        () =>
          new Promise<void>(resolve => {
            resolvePromise = resolve
          }),
      )

      render(
        <TaskDetailsDialog task={mockTask} open={true} onClose={mockOnClose} onSave={mockOnSave} />,
      )

      const titleInput = screen.getByLabelText(/title/i)
      typeInInput(titleInput, "Updated Title")

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /save/i })).toBeEnabled()
      })

      const saveButton = screen.getByRole("button", { name: /save/i })
      await act(async () => {
        fireEvent.click(saveButton)
      })

      expect(screen.getByText(/saving/i)).toBeInTheDocument()

      await act(async () => {
        resolvePromise()
      })

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled()
      })
    })
  })

  describe("closing", () => {
    it("calls onClose when cancel is clicked", async () => {
      render(
        <TaskDetailsDialog task={mockTask} open={true} onClose={mockOnClose} onSave={mockOnSave} />,
      )

      const cancelButton = screen.getByRole("button", { name: /cancel/i })
      await act(async () => {
        fireEvent.click(cancelButton)
      })

      expect(mockOnClose).toHaveBeenCalled()
    })

    it("calls onClose when X button is clicked", async () => {
      render(
        <TaskDetailsDialog task={mockTask} open={true} onClose={mockOnClose} onSave={mockOnSave} />,
      )

      const closeButton = screen.getByRole("button", { name: /close/i })
      await act(async () => {
        fireEvent.click(closeButton)
      })

      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  describe("state reset", () => {
    it("resets form when task changes", () => {
      const { rerender } = render(
        <TaskDetailsDialog task={mockTask} open={true} onClose={mockOnClose} onSave={mockOnSave} />,
      )

      expect(screen.getByDisplayValue("Test Task")).toBeInTheDocument()

      const newTask: TaskCardTask = {
        id: "new-456",
        title: "New Task",
        description: "New description",
        status: "in_progress",
        priority: 1,
      }

      rerender(
        <TaskDetailsDialog task={newTask} open={true} onClose={mockOnClose} onSave={mockOnSave} />,
      )

      expect(screen.getByDisplayValue("New Task")).toBeInTheDocument()
      expect(screen.getByDisplayValue("New description")).toBeInTheDocument()
    })
  })

  describe("empty description", () => {
    it("handles task without description", () => {
      const taskWithoutDescription: TaskCardTask = {
        id: "test-123",
        title: "Test Task",
        status: "open",
      }

      render(
        <TaskDetailsDialog
          task={taskWithoutDescription}
          open={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />,
      )

      const descInput = screen.getByLabelText(/description/i)
      expect(descInput).toHaveValue("")
    })

    it("shows 'No description' in read-only mode when description is empty", () => {
      const taskWithoutDescription: TaskCardTask = {
        id: "test-123",
        title: "Test Task",
        status: "open",
      }

      render(
        <TaskDetailsDialog
          task={taskWithoutDescription}
          open={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          readOnly={true}
        />,
      )

      expect(screen.getByText("No description")).toBeInTheDocument()
    })
  })
})
