import { describe, it, expect, beforeEach } from "vitest"
import { useAppStore } from "./index"
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

  describe("reset", () => {
    it("resets all state to initial values", () => {
      // Modify all state
      const {
        setRalphStatus,
        addEvent,
        setTasks,
        setWorkspace,
        setBranch,
        setTokenUsage,
        setIteration,
        setConnectionStatus,
      } = useAppStore.getState()

      setRalphStatus("running")
      addEvent({ type: "test", timestamp: 1 })
      setTasks([{ id: "1", content: "Task", status: "pending" }])
      setWorkspace("/path")
      setBranch("feature/test")
      setTokenUsage({ input: 1000, output: 500 })
      setIteration({ current: 5, total: 10 })
      setConnectionStatus("connected")

      // Verify state is modified
      let state = useAppStore.getState()
      expect(state.ralphStatus).toBe("running")
      expect(state.events).toHaveLength(1)
      expect(state.tasks).toHaveLength(1)
      expect(state.workspace).toBe("/path")
      expect(state.branch).toBe("feature/test")
      expect(state.tokenUsage).toEqual({ input: 1000, output: 500 })
      expect(state.iteration).toEqual({ current: 5, total: 10 })
      expect(state.connectionStatus).toBe("connected")

      // Reset
      useAppStore.getState().reset()

      // Verify reset
      state = useAppStore.getState()
      expect(state.ralphStatus).toBe("stopped")
      expect(state.events).toEqual([])
      expect(state.tasks).toEqual([])
      expect(state.workspace).toBeNull()
      expect(state.branch).toBeNull()
      expect(state.tokenUsage).toEqual({ input: 0, output: 0 })
      expect(state.iteration).toEqual({ current: 0, total: 0 })
      expect(state.connectionStatus).toBe("disconnected")
    })
  })
})
