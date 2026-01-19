import { describe, it, expect, beforeEach } from "vitest"
import { useAppStore, selectCurrentTask } from "./index"
import type { RalphEvent, Task } from "./index"

describe("useAppStore", () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useAppStore.getState().reset()
  })

  describe("initial state", () => {
    it("has correct initial values", () => {
      const state = useAppStore.getState()
      expect(state.ralphStatus).toBe("stopped")
      expect(state.events).toEqual([])
      expect(state.tasks).toEqual([])
      expect(state.workspace).toBeNull()
      expect(state.branch).toBeNull()
      expect(state.tokenUsage).toEqual({ input: 0, output: 0 })
      expect(state.iteration).toEqual({ current: 0, total: 0 })
      expect(state.connectionStatus).toBe("disconnected")
      expect(state.accentColor).toBeNull()
      expect(state.sidebarOpen).toBe(true)
      expect(state.sidebarWidth).toBe(320)
    })
  })

  describe("ralph status", () => {
    it("sets ralph status", () => {
      useAppStore.getState().setRalphStatus("running")
      expect(useAppStore.getState().ralphStatus).toBe("running")
    })

    it("updates through all status transitions", () => {
      const { setRalphStatus } = useAppStore.getState()

      setRalphStatus("starting")
      expect(useAppStore.getState().ralphStatus).toBe("starting")

      setRalphStatus("running")
      expect(useAppStore.getState().ralphStatus).toBe("running")

      setRalphStatus("stopping")
      expect(useAppStore.getState().ralphStatus).toBe("stopping")

      setRalphStatus("stopped")
      expect(useAppStore.getState().ralphStatus).toBe("stopped")
    })
  })

  describe("events", () => {
    it("adds events to the list", () => {
      const event: RalphEvent = { type: "test", timestamp: 1234567890 }
      useAppStore.getState().addEvent(event)

      const events = useAppStore.getState().events
      expect(events).toHaveLength(1)
      expect(events[0]).toEqual(event)
    })

    it("preserves event order", () => {
      const { addEvent } = useAppStore.getState()

      addEvent({ type: "first", timestamp: 1 })
      addEvent({ type: "second", timestamp: 2 })
      addEvent({ type: "third", timestamp: 3 })

      const events = useAppStore.getState().events
      expect(events).toHaveLength(3)
      expect(events[0].type).toBe("first")
      expect(events[1].type).toBe("second")
      expect(events[2].type).toBe("third")
    })

    it("clears all events", () => {
      const { addEvent, clearEvents } = useAppStore.getState()

      addEvent({ type: "test", timestamp: 1 })
      addEvent({ type: "test", timestamp: 2 })
      expect(useAppStore.getState().events).toHaveLength(2)

      clearEvents()
      expect(useAppStore.getState().events).toEqual([])
    })
  })

  describe("tasks", () => {
    const sampleTasks: Task[] = [
      { id: "1", content: "Task 1", status: "pending" },
      { id: "2", content: "Task 2", status: "in_progress" },
      { id: "3", content: "Task 3", status: "completed" },
    ]

    it("sets tasks", () => {
      useAppStore.getState().setTasks(sampleTasks)

      const tasks = useAppStore.getState().tasks
      expect(tasks).toHaveLength(3)
      expect(tasks).toEqual(sampleTasks)
    })

    it("updates a specific task", () => {
      useAppStore.getState().setTasks(sampleTasks)
      useAppStore.getState().updateTask("2", { status: "completed" })

      const tasks = useAppStore.getState().tasks
      const updatedTask = tasks.find(t => t.id === "2")
      expect(updatedTask?.status).toBe("completed")
    })

    it("updates task content", () => {
      useAppStore.getState().setTasks(sampleTasks)
      useAppStore.getState().updateTask("1", { content: "Updated content" })

      const tasks = useAppStore.getState().tasks
      const updatedTask = tasks.find(t => t.id === "1")
      expect(updatedTask?.content).toBe("Updated content")
    })

    it("does not modify other tasks when updating", () => {
      useAppStore.getState().setTasks(sampleTasks)
      useAppStore.getState().updateTask("2", { status: "completed" })

      const tasks = useAppStore.getState().tasks
      expect(tasks.find(t => t.id === "1")?.status).toBe("pending")
      expect(tasks.find(t => t.id === "3")?.status).toBe("completed")
    })

    it("clears all tasks", () => {
      useAppStore.getState().setTasks(sampleTasks)
      expect(useAppStore.getState().tasks).toHaveLength(3)

      useAppStore.getState().clearTasks()
      expect(useAppStore.getState().tasks).toEqual([])
    })

    describe("selectCurrentTask", () => {
      it("returns task with in_progress status", () => {
        useAppStore.getState().setTasks(sampleTasks)
        const currentTask = selectCurrentTask(useAppStore.getState())
        expect(currentTask).not.toBeNull()
        expect(currentTask?.id).toBe("2")
        expect(currentTask?.status).toBe("in_progress")
      })

      it("returns null when no task is in progress", () => {
        const tasksWithoutInProgress: Task[] = [
          { id: "1", content: "Task 1", status: "pending" },
          { id: "2", content: "Task 2", status: "completed" },
        ]
        useAppStore.getState().setTasks(tasksWithoutInProgress)
        const currentTask = selectCurrentTask(useAppStore.getState())
        expect(currentTask).toBeNull()
      })

      it("returns null when tasks are empty", () => {
        useAppStore.getState().setTasks([])
        const currentTask = selectCurrentTask(useAppStore.getState())
        expect(currentTask).toBeNull()
      })

      it("returns first in_progress task when multiple exist", () => {
        const tasksWithMultipleInProgress: Task[] = [
          { id: "1", content: "Task 1", status: "in_progress" },
          { id: "2", content: "Task 2", status: "in_progress" },
        ]
        useAppStore.getState().setTasks(tasksWithMultipleInProgress)
        const currentTask = selectCurrentTask(useAppStore.getState())
        expect(currentTask?.id).toBe("1")
      })
    })
  })

  describe("workspace", () => {
    it("sets workspace path", () => {
      useAppStore.getState().setWorkspace("/path/to/project")
      expect(useAppStore.getState().workspace).toBe("/path/to/project")
    })

    it("clears workspace", () => {
      useAppStore.getState().setWorkspace("/path/to/project")
      useAppStore.getState().setWorkspace(null)
      expect(useAppStore.getState().workspace).toBeNull()
    })
  })

  describe("accent color", () => {
    it("sets accent color", () => {
      useAppStore.getState().setAccentColor("#4d9697")
      expect(useAppStore.getState().accentColor).toBe("#4d9697")
    })

    it("clears accent color", () => {
      useAppStore.getState().setAccentColor("#4d9697")
      useAppStore.getState().setAccentColor(null)
      expect(useAppStore.getState().accentColor).toBeNull()
    })
  })

  describe("branch", () => {
    it("sets branch name", () => {
      useAppStore.getState().setBranch("feature/new-feature")
      expect(useAppStore.getState().branch).toBe("feature/new-feature")
    })

    it("clears branch", () => {
      useAppStore.getState().setBranch("main")
      useAppStore.getState().setBranch(null)
      expect(useAppStore.getState().branch).toBeNull()
    })
  })

  describe("token usage", () => {
    it("sets token usage", () => {
      useAppStore.getState().setTokenUsage({ input: 1000, output: 500 })
      expect(useAppStore.getState().tokenUsage).toEqual({ input: 1000, output: 500 })
    })

    it("adds to token usage", () => {
      useAppStore.getState().setTokenUsage({ input: 1000, output: 500 })
      useAppStore.getState().addTokenUsage({ input: 200, output: 100 })
      expect(useAppStore.getState().tokenUsage).toEqual({ input: 1200, output: 600 })
    })

    it("accumulates multiple token additions", () => {
      useAppStore.getState().addTokenUsage({ input: 100, output: 50 })
      useAppStore.getState().addTokenUsage({ input: 200, output: 100 })
      useAppStore.getState().addTokenUsage({ input: 300, output: 150 })
      expect(useAppStore.getState().tokenUsage).toEqual({ input: 600, output: 300 })
    })
  })

  describe("iteration", () => {
    it("sets iteration info", () => {
      useAppStore.getState().setIteration({ current: 3, total: 10 })
      expect(useAppStore.getState().iteration).toEqual({ current: 3, total: 10 })
    })

    it("updates iteration progress", () => {
      useAppStore.getState().setIteration({ current: 1, total: 5 })
      useAppStore.getState().setIteration({ current: 2, total: 5 })
      expect(useAppStore.getState().iteration).toEqual({ current: 2, total: 5 })
    })
  })

  describe("connection status", () => {
    it("sets connection status", () => {
      useAppStore.getState().setConnectionStatus("connected")
      expect(useAppStore.getState().connectionStatus).toBe("connected")
    })

    it("updates through all connection states", () => {
      const { setConnectionStatus } = useAppStore.getState()

      setConnectionStatus("connecting")
      expect(useAppStore.getState().connectionStatus).toBe("connecting")

      setConnectionStatus("connected")
      expect(useAppStore.getState().connectionStatus).toBe("connected")

      setConnectionStatus("disconnected")
      expect(useAppStore.getState().connectionStatus).toBe("disconnected")
    })
  })

  describe("sidebar state", () => {
    it("sets sidebar open state", () => {
      useAppStore.getState().setSidebarOpen(false)
      expect(useAppStore.getState().sidebarOpen).toBe(false)

      useAppStore.getState().setSidebarOpen(true)
      expect(useAppStore.getState().sidebarOpen).toBe(true)
    })

    it("toggles sidebar state", () => {
      // Initial state is true
      expect(useAppStore.getState().sidebarOpen).toBe(true)

      useAppStore.getState().toggleSidebar()
      expect(useAppStore.getState().sidebarOpen).toBe(false)

      useAppStore.getState().toggleSidebar()
      expect(useAppStore.getState().sidebarOpen).toBe(true)
    })

    it("sets sidebar width", () => {
      useAppStore.getState().setSidebarWidth(400)
      expect(useAppStore.getState().sidebarWidth).toBe(400)

      useAppStore.getState().setSidebarWidth(250)
      expect(useAppStore.getState().sidebarWidth).toBe(250)
    })
  })

  describe("reset", () => {
    it("resets all state to initial values", () => {
      // Modify all state
      const {
        setRalphStatus,
        addEvent,
        setTasks,
        setWorkspace,
        setAccentColor,
        setBranch,
        setTokenUsage,
        setIteration,
        setConnectionStatus,
        setSidebarOpen,
        setSidebarWidth,
      } = useAppStore.getState()

      setRalphStatus("running")
      addEvent({ type: "test", timestamp: 1 })
      setTasks([{ id: "1", content: "Task", status: "pending" }])
      setWorkspace("/path")
      setAccentColor("#4d9697")
      setBranch("feature/test")
      setTokenUsage({ input: 1000, output: 500 })
      setIteration({ current: 5, total: 10 })
      setConnectionStatus("connected")
      setSidebarOpen(false)
      setSidebarWidth(400)

      // Verify state is modified
      let state = useAppStore.getState()
      expect(state.ralphStatus).toBe("running")
      expect(state.events).toHaveLength(1)
      expect(state.tasks).toHaveLength(1)
      expect(state.workspace).toBe("/path")
      expect(state.accentColor).toBe("#4d9697")
      expect(state.branch).toBe("feature/test")
      expect(state.tokenUsage).toEqual({ input: 1000, output: 500 })
      expect(state.iteration).toEqual({ current: 5, total: 10 })
      expect(state.connectionStatus).toBe("connected")
      expect(state.sidebarOpen).toBe(false)
      expect(state.sidebarWidth).toBe(400)

      // Reset
      useAppStore.getState().reset()

      // Verify reset
      state = useAppStore.getState()
      expect(state.ralphStatus).toBe("stopped")
      expect(state.events).toEqual([])
      expect(state.tasks).toEqual([])
      expect(state.workspace).toBeNull()
      expect(state.accentColor).toBeNull()
      expect(state.branch).toBeNull()
      expect(state.tokenUsage).toEqual({ input: 0, output: 0 })
      expect(state.iteration).toEqual({ current: 0, total: 0 })
      expect(state.connectionStatus).toBe("disconnected")
      expect(state.sidebarOpen).toBe(true)
      expect(state.sidebarWidth).toBe(320)
    })
  })
})
