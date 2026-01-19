import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { EventEmitter } from "node:events"
import { RalphManager, type RalphEvent, type SpawnFn } from "./RalphManager"

// Create a mock process helper
function createMockProcess() {
  const proc = new EventEmitter() as EventEmitter & {
    stdin: { writable: boolean; write: ReturnType<typeof vi.fn> }
    stdout: EventEmitter
    stderr: EventEmitter
    kill: ReturnType<typeof vi.fn>
  }
  proc.stdin = { writable: true, write: vi.fn() }
  proc.stdout = new EventEmitter()
  proc.stderr = new EventEmitter()
  proc.kill = vi.fn()
  return proc
}

describe("RalphManager", () => {
  let manager: RalphManager
  let mockProcess: ReturnType<typeof createMockProcess>
  let mockSpawn: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockProcess = createMockProcess()
    mockSpawn = vi.fn().mockReturnValue(mockProcess)
    manager = new RalphManager({ spawn: mockSpawn as unknown as SpawnFn })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe("initialization", () => {
    it("starts with stopped status", () => {
      expect(manager.status).toBe("stopped")
      expect(manager.isRunning).toBe(false)
    })

    it("accepts custom options", () => {
      const customManager = new RalphManager({
        command: "custom-ralph",
        args: ["--custom"],
        cwd: "/custom/path",
        env: { CUSTOM_VAR: "value" },
        spawn: mockSpawn as unknown as SpawnFn,
      })
      expect(customManager.status).toBe("stopped")
    })
  })

  describe("start", () => {
    it("spawns ralph process with --json flag", async () => {
      const startPromise = manager.start()
      mockProcess.emit("spawn")
      await startPromise

      expect(mockSpawn).toHaveBeenCalledWith(
        "npx",
        ["@herbcaudill/ralph", "--json"],
        expect.objectContaining({
          stdio: ["pipe", "pipe", "pipe"],
        }),
      )
    })

    it("includes iterations argument when provided", async () => {
      const startPromise = manager.start(50)
      mockProcess.emit("spawn")
      await startPromise

      expect(mockSpawn).toHaveBeenCalledWith(
        "npx",
        ["@herbcaudill/ralph", "--json", "50"],
        expect.anything(),
      )
    })

    it("includes --watch flag when watch option is enabled", async () => {
      const watchManager = new RalphManager({
        spawn: mockSpawn as unknown as SpawnFn,
        watch: true,
      })

      const startPromise = watchManager.start()
      mockProcess.emit("spawn")
      await startPromise

      expect(mockSpawn).toHaveBeenCalledWith(
        "npx",
        ["@herbcaudill/ralph", "--json", "--watch"],
        expect.anything(),
      )
    })

    it("includes both --watch and iterations when both provided", async () => {
      const watchManager = new RalphManager({
        spawn: mockSpawn as unknown as SpawnFn,
        watch: true,
      })

      const startPromise = watchManager.start(25)
      mockProcess.emit("spawn")
      await startPromise

      expect(mockSpawn).toHaveBeenCalledWith(
        "npx",
        ["@herbcaudill/ralph", "--json", "--watch", "25"],
        expect.anything(),
      )
    })

    it("transitions to running status", async () => {
      const statusChanges: string[] = []
      manager.on("status", status => statusChanges.push(status))

      const startPromise = manager.start()
      mockProcess.emit("spawn")
      await startPromise

      expect(statusChanges).toContain("starting")
      expect(statusChanges).toContain("running")
      expect(manager.status).toBe("running")
      expect(manager.isRunning).toBe(true)
    })

    it("throws if already running", async () => {
      const startPromise = manager.start()
      mockProcess.emit("spawn")
      await startPromise

      await expect(manager.start()).rejects.toThrow("Ralph is already running")
    })

    it("emits error and rejects on spawn error", async () => {
      const errors: Error[] = []
      manager.on("error", err => errors.push(err))

      const startPromise = manager.start()
      const spawnError = new Error("spawn failed")
      mockProcess.emit("error", spawnError)

      await expect(startPromise).rejects.toThrow("spawn failed")
      expect(errors).toHaveLength(1)
      expect(manager.status).toBe("stopped")
    })
  })

  describe("stop", () => {
    it("sends SIGTERM to process", async () => {
      const startPromise = manager.start()
      mockProcess.emit("spawn")
      await startPromise

      const stopPromise = manager.stop()
      mockProcess.emit("exit", 0, null)
      await stopPromise

      expect(mockProcess.kill).toHaveBeenCalledWith("SIGTERM")
    })

    it("transitions to stopped status", async () => {
      const startPromise = manager.start()
      mockProcess.emit("spawn")
      await startPromise

      const stopPromise = manager.stop()
      mockProcess.emit("exit", 0, null)
      await stopPromise

      expect(manager.status).toBe("stopped")
      expect(manager.isRunning).toBe(false)
    })

    it("resolves immediately if not running", async () => {
      await expect(manager.stop()).resolves.toBeUndefined()
    })

    it("force kills after timeout", async () => {
      vi.useFakeTimers()

      const startPromise = manager.start()
      mockProcess.emit("spawn")
      await startPromise

      const stopPromise = manager.stop(1000)
      expect(mockProcess.kill).toHaveBeenCalledWith("SIGTERM")

      // Advance past timeout
      vi.advanceTimersByTime(1001)
      expect(mockProcess.kill).toHaveBeenCalledWith("SIGKILL")

      // Cleanup
      mockProcess.emit("exit", null, "SIGKILL")
      await stopPromise

      vi.useRealTimers()
    })

    it("emits exit event with code and signal", async () => {
      const exits: Array<{ code: number | null; signal: string | null }> = []
      manager.on("exit", evt => exits.push(evt))

      const startPromise = manager.start()
      mockProcess.emit("spawn")
      await startPromise

      const stopPromise = manager.stop()
      mockProcess.emit("exit", 0, null)
      await stopPromise

      expect(exits).toEqual([{ code: 0, signal: null }])
    })
  })

  describe("send", () => {
    it("writes string message to stdin", async () => {
      const startPromise = manager.start()
      mockProcess.emit("spawn")
      await startPromise

      manager.send("hello")
      expect(mockProcess.stdin.write).toHaveBeenCalledWith("hello\n")
    })

    it("JSON stringifies object messages", async () => {
      const startPromise = manager.start()
      mockProcess.emit("spawn")
      await startPromise

      manager.send({ type: "test", data: 123 })
      expect(mockProcess.stdin.write).toHaveBeenCalledWith('{"type":"test","data":123}\n')
    })

    it("throws if not running", () => {
      expect(() => manager.send("test")).toThrow("Ralph is not running")
    })
  })

  describe("stdout parsing", () => {
    it("emits event for valid JSON lines", async () => {
      const events: RalphEvent[] = []
      manager.on("event", evt => events.push(evt))

      const startPromise = manager.start()
      mockProcess.emit("spawn")
      await startPromise

      mockProcess.stdout.emit("data", Buffer.from('{"type":"test","timestamp":123}\n'))

      expect(events).toEqual([{ type: "test", timestamp: 123 }])
    })

    it("handles multiple events in single chunk", async () => {
      const events: RalphEvent[] = []
      manager.on("event", evt => events.push(evt))

      const startPromise = manager.start()
      mockProcess.emit("spawn")
      await startPromise

      mockProcess.stdout.emit(
        "data",
        Buffer.from('{"type":"a","timestamp":1}\n{"type":"b","timestamp":2}\n'),
      )

      expect(events).toHaveLength(2)
      expect(events[0]).toMatchObject({ type: "a" })
      expect(events[1]).toMatchObject({ type: "b" })
    })

    it("handles events split across chunks", async () => {
      const events: RalphEvent[] = []
      manager.on("event", evt => events.push(evt))

      const startPromise = manager.start()
      mockProcess.emit("spawn")
      await startPromise

      mockProcess.stdout.emit("data", Buffer.from('{"type":"split",'))
      mockProcess.stdout.emit("data", Buffer.from('"timestamp":999}\n'))

      expect(events).toEqual([{ type: "split", timestamp: 999 }])
    })

    it("emits output for non-JSON lines", async () => {
      const outputs: string[] = []
      manager.on("output", line => outputs.push(line))

      const startPromise = manager.start()
      mockProcess.emit("spawn")
      await startPromise

      mockProcess.stdout.emit("data", Buffer.from("plain text line\n"))

      expect(outputs).toEqual(["plain text line"])
    })
  })

  describe("stderr handling", () => {
    it("emits error for stderr output", async () => {
      const errors: Error[] = []
      manager.on("error", err => errors.push(err))

      const startPromise = manager.start()
      mockProcess.emit("spawn")
      await startPromise

      mockProcess.stderr.emit("data", Buffer.from("Something went wrong"))

      expect(errors).toHaveLength(1)
      expect(errors[0].message).toBe("stderr: Something went wrong")
    })
  })

  describe("pause", () => {
    it("sends SIGTSTP to process", async () => {
      const startPromise = manager.start()
      mockProcess.emit("spawn")
      await startPromise

      manager.pause()

      expect(mockProcess.kill).toHaveBeenCalledWith("SIGTSTP")
    })

    it("transitions to paused status", async () => {
      const statusChanges: string[] = []
      manager.on("status", status => statusChanges.push(status))

      const startPromise = manager.start()
      mockProcess.emit("spawn")
      await startPromise

      manager.pause()

      expect(manager.status).toBe("paused")
      expect(statusChanges).toContain("paused")
    })

    it("throws if not running", () => {
      expect(() => manager.pause()).toThrow("Ralph is not running")
    })

    it("throws if in wrong state", async () => {
      const startPromise = manager.start()
      mockProcess.emit("spawn")
      await startPromise

      manager.pause()

      // Already paused - should be a no-op
      manager.pause()
      expect(manager.status).toBe("paused")
    })

    it("throws if trying to pause while stopped", () => {
      expect(() => manager.pause()).toThrow("Ralph is not running")
    })
  })

  describe("resume", () => {
    it("sends SIGCONT to process", async () => {
      const startPromise = manager.start()
      mockProcess.emit("spawn")
      await startPromise

      manager.pause()
      manager.resume()

      expect(mockProcess.kill).toHaveBeenCalledWith("SIGCONT")
    })

    it("transitions back to running status", async () => {
      const statusChanges: string[] = []
      manager.on("status", status => statusChanges.push(status))

      const startPromise = manager.start()
      mockProcess.emit("spawn")
      await startPromise

      manager.pause()
      manager.resume()

      expect(manager.status).toBe("running")
      expect(statusChanges).toContain("running")
    })

    it("throws if not paused", async () => {
      const startPromise = manager.start()
      mockProcess.emit("spawn")
      await startPromise

      expect(() => manager.resume()).toThrow("Cannot resume ralph in running state")
    })

    it("throws if not running", () => {
      expect(() => manager.resume()).toThrow("Ralph is not running")
    })

    it("emits buffered events when resumed", async () => {
      const events: RalphEvent[] = []
      manager.on("event", evt => events.push(evt))

      const startPromise = manager.start()
      mockProcess.emit("spawn")
      await startPromise

      manager.pause()

      // Simulate events arriving while paused
      mockProcess.stdout.emit("data", Buffer.from('{"type":"buffered1","timestamp":1}\n'))
      mockProcess.stdout.emit("data", Buffer.from('{"type":"buffered2","timestamp":2}\n'))

      // Events should not be emitted while paused
      expect(events).toHaveLength(0)

      manager.resume()

      // Events should now be emitted
      expect(events).toHaveLength(2)
      expect(events[0]).toMatchObject({ type: "buffered1" })
      expect(events[1]).toMatchObject({ type: "buffered2" })
    })
  })

  describe("pause event buffering", () => {
    it("does not emit events while paused", async () => {
      const events: RalphEvent[] = []
      manager.on("event", evt => events.push(evt))

      const startPromise = manager.start()
      mockProcess.emit("spawn")
      await startPromise

      manager.pause()

      mockProcess.stdout.emit("data", Buffer.from('{"type":"test","timestamp":123}\n'))

      expect(events).toHaveLength(0)
    })

    it("does not emit output while paused", async () => {
      const outputs: string[] = []
      manager.on("output", line => outputs.push(line))

      const startPromise = manager.start()
      mockProcess.emit("spawn")
      await startPromise

      manager.pause()

      mockProcess.stdout.emit("data", Buffer.from("plain text line\n"))

      expect(outputs).toHaveLength(0)
    })

    it("clears buffered events on process exit", async () => {
      const events: RalphEvent[] = []
      manager.on("event", evt => events.push(evt))

      const startPromise = manager.start()
      mockProcess.emit("spawn")
      await startPromise

      manager.pause()

      // Buffer some events
      mockProcess.stdout.emit("data", Buffer.from('{"type":"buffered","timestamp":1}\n'))

      // Process exits
      mockProcess.emit("exit", 0, null)

      // Restart the manager
      const newProcess = createMockProcess()
      mockSpawn.mockReturnValue(newProcess)
      const startPromise2 = manager.start()
      newProcess.emit("spawn")
      await startPromise2

      // Events should not include the old buffered event
      expect(events).toHaveLength(0)
    })
  })

  describe("stopAfterCurrent", () => {
    it("sends stop_after_current message to stdin", async () => {
      const startPromise = manager.start()
      mockProcess.emit("spawn")
      await startPromise

      manager.stopAfterCurrent()

      expect(mockProcess.stdin.write).toHaveBeenCalledWith('{"type":"stop_after_current"}\n')
    })

    it("transitions to stopping_after_current status", async () => {
      const statusChanges: string[] = []
      manager.on("status", status => statusChanges.push(status))

      const startPromise = manager.start()
      mockProcess.emit("spawn")
      await startPromise

      manager.stopAfterCurrent()

      expect(manager.status).toBe("stopping_after_current")
      expect(statusChanges).toContain("stopping_after_current")
    })

    it("throws if not running", () => {
      expect(() => manager.stopAfterCurrent()).toThrow("Ralph is not running")
    })

    it("throws if in wrong state", async () => {
      const startPromise = manager.start()
      mockProcess.emit("spawn")
      await startPromise

      const stopPromise = manager.stop()
      mockProcess.emit("exit", 0, null)
      await stopPromise

      expect(() => manager.stopAfterCurrent()).toThrow("Ralph is not running")
    })

    it("works when paused", async () => {
      const startPromise = manager.start()
      mockProcess.emit("spawn")
      await startPromise

      manager.pause()
      manager.stopAfterCurrent()

      expect(manager.status).toBe("stopping_after_current")
      expect(mockProcess.stdin.write).toHaveBeenCalledWith('{"type":"stop_after_current"}\n')
    })
  })

  describe("cancelStopAfterCurrent", () => {
    it("sends cancel_stop_after_current message to stdin", async () => {
      const startPromise = manager.start()
      mockProcess.emit("spawn")
      await startPromise

      manager.stopAfterCurrent()
      manager.cancelStopAfterCurrent()

      expect(mockProcess.stdin.write).toHaveBeenCalledWith('{"type":"cancel_stop_after_current"}\n')
    })

    it("transitions back to running status", async () => {
      const statusChanges: string[] = []
      manager.on("status", status => statusChanges.push(status))

      const startPromise = manager.start()
      mockProcess.emit("spawn")
      await startPromise

      manager.stopAfterCurrent()
      manager.cancelStopAfterCurrent()

      expect(manager.status).toBe("running")
    })

    it("throws if not in stopping_after_current state", async () => {
      const startPromise = manager.start()
      mockProcess.emit("spawn")
      await startPromise

      expect(() => manager.cancelStopAfterCurrent()).toThrow(
        "Cannot cancel stop-after-current in running state",
      )
    })

    it("throws if not running", () => {
      expect(() => manager.cancelStopAfterCurrent()).toThrow("Ralph is not running")
    })
  })
})
