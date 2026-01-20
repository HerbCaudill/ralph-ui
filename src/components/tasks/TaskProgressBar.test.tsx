import { render, screen } from "@testing-library/react"
import { describe, it, expect, beforeEach, vi } from "vitest"
import { TaskProgressBar } from "./TaskProgressBar"
import { useAppStore, type Task, type RalphStatus } from "@/store"

// Mock the store
vi.mock("@/store", async () => {
  const actual = await vi.importActual<typeof import("@/store")>("@/store")
  return {
    ...actual,
    useAppStore: vi.fn(),
  }
})

const mockUseAppStore = vi.mocked(useAppStore)

function setupMock(config: {
  tasks: Task[]
  initialTaskCount: number | null
  ralphStatus: RalphStatus
  accentColor?: string | null
}) {
  mockUseAppStore.mockImplementation(selector => {
    const state = {
      tasks: config.tasks,
      initialTaskCount: config.initialTaskCount,
      ralphStatus: config.ralphStatus,
      accentColor: config.accentColor ?? null,
    }
    return selector(state as any)
  })
}

function createTask(overrides: Partial<Task> = {}): Task {
  return {
    id: `task-${Math.random().toString(36).slice(2)}`,
    title: "Test task",
    status: "open",
    ...overrides,
  }
}

describe("TaskProgressBar", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("visibility", () => {
    it("does not render when Ralph is stopped", () => {
      setupMock({
        tasks: [createTask({ status: "closed" })],
        initialTaskCount: 1,
        ralphStatus: "stopped",
      })

      const { container } = render(<TaskProgressBar />)
      expect(container.firstChild).toBeNull()
    })

    it("does not render when initialTaskCount is null", () => {
      setupMock({
        tasks: [createTask()],
        initialTaskCount: null,
        ralphStatus: "running",
      })

      const { container } = render(<TaskProgressBar />)
      expect(container.firstChild).toBeNull()
    })

    it("does not render when there are no tasks", () => {
      setupMock({
        tasks: [],
        initialTaskCount: 0,
        ralphStatus: "running",
      })

      const { container } = render(<TaskProgressBar />)
      expect(container.firstChild).toBeNull()
    })

    it("renders when Ralph is running and has tasks", () => {
      setupMock({
        tasks: [createTask()],
        initialTaskCount: 1,
        ralphStatus: "running",
      })

      render(<TaskProgressBar />)
      expect(screen.getByTestId("task-progress-bar")).toBeInTheDocument()
    })

    it("renders when Ralph is paused", () => {
      setupMock({
        tasks: [createTask()],
        initialTaskCount: 1,
        ralphStatus: "paused",
      })

      render(<TaskProgressBar />)
      expect(screen.getByTestId("task-progress-bar")).toBeInTheDocument()
    })

    it("renders when Ralph is stopping_after_current", () => {
      setupMock({
        tasks: [createTask()],
        initialTaskCount: 1,
        ralphStatus: "stopping_after_current",
      })

      render(<TaskProgressBar />)
      expect(screen.getByTestId("task-progress-bar")).toBeInTheDocument()
    })
  })

  describe("progress calculation", () => {
    it("shows 0 closed when no tasks are closed", () => {
      setupMock({
        tasks: [createTask({ status: "open" }), createTask({ status: "in_progress" })],
        initialTaskCount: 2,
        ralphStatus: "running",
      })

      render(<TaskProgressBar />)
      expect(screen.getByText("0/2")).toBeInTheDocument()
    })

    it("shows correct count when some tasks are closed", () => {
      setupMock({
        tasks: [
          createTask({ status: "closed" }),
          createTask({ status: "open" }),
          createTask({ status: "closed" }),
        ],
        initialTaskCount: 3,
        ralphStatus: "running",
      })

      render(<TaskProgressBar />)
      expect(screen.getByText("2/3")).toBeInTheDocument()
    })

    it("shows correct count when all tasks are closed", () => {
      setupMock({
        tasks: [createTask({ status: "closed" }), createTask({ status: "closed" })],
        initialTaskCount: 2,
        ralphStatus: "running",
      })

      render(<TaskProgressBar />)
      expect(screen.getByText("2/2")).toBeInTheDocument()
    })

    it("uses current task count when it exceeds initial count (new tasks added)", () => {
      setupMock({
        tasks: [
          createTask({ status: "closed" }),
          createTask({ status: "open" }),
          createTask({ status: "open" }), // New task added during run
        ],
        initialTaskCount: 2, // Started with 2 tasks
        ralphStatus: "running",
      })

      render(<TaskProgressBar />)
      // Total should be 3 (current count), not 2 (initial count)
      expect(screen.getByText("1/3")).toBeInTheDocument()
    })

    it("uses initial count when current count is less (tasks deleted)", () => {
      setupMock({
        tasks: [createTask({ status: "closed" })],
        initialTaskCount: 3, // Started with 3 tasks
        ralphStatus: "running",
      })

      render(<TaskProgressBar />)
      // Total should use initial count of 3
      expect(screen.getByText("1/3")).toBeInTheDocument()
    })
  })

  describe("accessibility", () => {
    it("has progressbar role", () => {
      setupMock({
        tasks: [createTask({ status: "closed" }), createTask({ status: "open" })],
        initialTaskCount: 2,
        ralphStatus: "running",
      })

      render(<TaskProgressBar />)
      expect(screen.getByRole("progressbar")).toBeInTheDocument()
    })

    it("has correct aria attributes", () => {
      setupMock({
        tasks: [createTask({ status: "closed" }), createTask({ status: "open" })],
        initialTaskCount: 2,
        ralphStatus: "running",
      })

      render(<TaskProgressBar />)
      const progressbar = screen.getByRole("progressbar")
      expect(progressbar).toHaveAttribute("aria-valuenow", "1")
      expect(progressbar).toHaveAttribute("aria-valuemin", "0")
      expect(progressbar).toHaveAttribute("aria-valuemax", "2")
      expect(progressbar).toHaveAttribute("aria-label", "Task completion progress")
    })
  })

  describe("styling", () => {
    it("applies custom className", () => {
      setupMock({
        tasks: [createTask()],
        initialTaskCount: 1,
        ralphStatus: "running",
      })

      render(<TaskProgressBar className="custom-class" />)
      expect(screen.getByTestId("task-progress-bar")).toHaveClass("custom-class")
    })

    it("has border-t class for top border", () => {
      setupMock({
        tasks: [createTask()],
        initialTaskCount: 1,
        ralphStatus: "running",
      })

      render(<TaskProgressBar />)
      expect(screen.getByTestId("task-progress-bar")).toHaveClass("border-t")
    })

    it("uses accent color for progress bar fill when set", () => {
      setupMock({
        tasks: [createTask({ status: "closed" })],
        initialTaskCount: 1,
        ralphStatus: "running",
        accentColor: "#ff0000",
      })

      render(<TaskProgressBar />)
      const progressBar = screen.getByTestId("task-progress-bar")
      const fillElement = progressBar.querySelector(".h-full")
      expect(fillElement).toHaveStyle({ backgroundColor: "#ff0000" })
    })

    it("uses default accent color when peacock color is not set", () => {
      setupMock({
        tasks: [createTask({ status: "closed" })],
        initialTaskCount: 1,
        ralphStatus: "running",
        accentColor: null,
      })

      render(<TaskProgressBar />)
      const progressBar = screen.getByTestId("task-progress-bar")
      const fillElement = progressBar.querySelector(".h-full")
      expect(fillElement).toHaveStyle({ backgroundColor: "#374151" })
    })
  })
})
