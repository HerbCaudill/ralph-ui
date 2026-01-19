import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { EventEmitter } from "node:events"
import { BdProxy, type SpawnFn, type BdIssue } from "./BdProxy"

// Create a mock process helper
function createMockProcess() {
  const proc = new EventEmitter() as EventEmitter & {
    stdout: EventEmitter
    stderr: EventEmitter
    kill: ReturnType<typeof vi.fn>
  }
  proc.stdout = new EventEmitter()
  proc.stderr = new EventEmitter()
  proc.kill = vi.fn()
  return proc
}

// Sample issue data
const sampleIssue: BdIssue = {
  id: "rui-123",
  title: "Test Issue",
  description: "A test issue",
  status: "open",
  priority: 2,
  issue_type: "task",
  owner: "test@example.com",
  created_at: "2026-01-18T12:00:00Z",
  updated_at: "2026-01-18T12:00:00Z",
}

describe("BdProxy", () => {
  let proxy: BdProxy
  let mockProcess: ReturnType<typeof createMockProcess>
  let mockSpawn: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockProcess = createMockProcess()
    mockSpawn = vi.fn().mockReturnValue(mockProcess)
    proxy = new BdProxy({ spawn: mockSpawn as unknown as SpawnFn })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe("list", () => {
    it("calls bd list with --json flag", async () => {
      const listPromise = proxy.list()

      // Simulate successful response
      mockProcess.stdout.emit("data", Buffer.from(JSON.stringify([sampleIssue])))
      mockProcess.emit("close", 0)

      const result = await listPromise

      expect(mockSpawn).toHaveBeenCalledWith(
        "bd",
        ["list", "--json"],
        expect.objectContaining({
          stdio: ["ignore", "pipe", "pipe"],
        }),
      )
      expect(result).toEqual([sampleIssue])
    })

    it("passes limit option", async () => {
      const listPromise = proxy.list({ limit: 10 })

      mockProcess.stdout.emit("data", Buffer.from("[]"))
      mockProcess.emit("close", 0)

      await listPromise

      expect(mockSpawn).toHaveBeenCalledWith(
        "bd",
        ["list", "--json", "--limit", "10"],
        expect.anything(),
      )
    })

    it("passes status filter", async () => {
      const listPromise = proxy.list({ status: "in_progress" })

      mockProcess.stdout.emit("data", Buffer.from("[]"))
      mockProcess.emit("close", 0)

      await listPromise

      expect(mockSpawn).toHaveBeenCalledWith(
        "bd",
        ["list", "--json", "--status", "in_progress"],
        expect.anything(),
      )
    })

    it("passes priority filter", async () => {
      const listPromise = proxy.list({ priority: 1 })

      mockProcess.stdout.emit("data", Buffer.from("[]"))
      mockProcess.emit("close", 0)

      await listPromise

      expect(mockSpawn).toHaveBeenCalledWith(
        "bd",
        ["list", "--json", "--priority", "1"],
        expect.anything(),
      )
    })

    it("passes type filter", async () => {
      const listPromise = proxy.list({ type: "bug" })

      mockProcess.stdout.emit("data", Buffer.from("[]"))
      mockProcess.emit("close", 0)

      await listPromise

      expect(mockSpawn).toHaveBeenCalledWith(
        "bd",
        ["list", "--json", "--type", "bug"],
        expect.anything(),
      )
    })

    it("passes ready flag", async () => {
      const listPromise = proxy.list({ ready: true })

      mockProcess.stdout.emit("data", Buffer.from("[]"))
      mockProcess.emit("close", 0)

      await listPromise

      expect(mockSpawn).toHaveBeenCalledWith("bd", ["list", "--json", "--ready"], expect.anything())
    })

    it("passes all flag", async () => {
      const listPromise = proxy.list({ all: true })

      mockProcess.stdout.emit("data", Buffer.from("[]"))
      mockProcess.emit("close", 0)

      await listPromise

      expect(mockSpawn).toHaveBeenCalledWith("bd", ["list", "--json", "--all"], expect.anything())
    })

    it("passes parent filter", async () => {
      const listPromise = proxy.list({ parent: "rui-epic" })

      mockProcess.stdout.emit("data", Buffer.from("[]"))
      mockProcess.emit("close", 0)

      await listPromise

      expect(mockSpawn).toHaveBeenCalledWith(
        "bd",
        ["list", "--json", "--parent", "rui-epic"],
        expect.anything(),
      )
    })

    it("rejects on non-zero exit code", async () => {
      const listPromise = proxy.list()

      mockProcess.stderr.emit("data", Buffer.from("some error"))
      mockProcess.emit("close", 1)

      await expect(listPromise).rejects.toThrow("bd exited with code 1: some error")
    })

    it("rejects on spawn error", async () => {
      const listPromise = proxy.list()

      mockProcess.emit("error", new Error("spawn failed"))

      await expect(listPromise).rejects.toThrow("spawn failed")
    })
  })

  describe("show", () => {
    it("calls bd show with single id", async () => {
      const showPromise = proxy.show("rui-123")

      mockProcess.stdout.emit("data", Buffer.from(JSON.stringify([sampleIssue])))
      mockProcess.emit("close", 0)

      const result = await showPromise

      expect(mockSpawn).toHaveBeenCalledWith("bd", ["show", "--json", "rui-123"], expect.anything())
      expect(result).toEqual([sampleIssue])
    })

    it("calls bd show with multiple ids", async () => {
      const showPromise = proxy.show(["rui-1", "rui-2"])

      mockProcess.stdout.emit("data", Buffer.from(JSON.stringify([sampleIssue, sampleIssue])))
      mockProcess.emit("close", 0)

      await showPromise

      expect(mockSpawn).toHaveBeenCalledWith(
        "bd",
        ["show", "--json", "rui-1", "rui-2"],
        expect.anything(),
      )
    })
  })

  describe("create", () => {
    it("creates issue with title", async () => {
      const createPromise = proxy.create({ title: "New Issue" })

      mockProcess.stdout.emit("data", Buffer.from(JSON.stringify([sampleIssue])))
      mockProcess.emit("close", 0)

      const result = await createPromise

      expect(mockSpawn).toHaveBeenCalledWith(
        "bd",
        ["create", "--json", "New Issue"],
        expect.anything(),
      )
      expect(result).toEqual(sampleIssue)
    })

    it("passes description option", async () => {
      const createPromise = proxy.create({
        title: "New Issue",
        description: "Issue description",
      })

      mockProcess.stdout.emit("data", Buffer.from(JSON.stringify([sampleIssue])))
      mockProcess.emit("close", 0)

      await createPromise

      expect(mockSpawn).toHaveBeenCalledWith(
        "bd",
        ["create", "--json", "New Issue", "--description", "Issue description"],
        expect.anything(),
      )
    })

    it("passes priority option", async () => {
      const createPromise = proxy.create({
        title: "New Issue",
        priority: 1,
      })

      mockProcess.stdout.emit("data", Buffer.from(JSON.stringify([sampleIssue])))
      mockProcess.emit("close", 0)

      await createPromise

      expect(mockSpawn).toHaveBeenCalledWith(
        "bd",
        ["create", "--json", "New Issue", "--priority", "1"],
        expect.anything(),
      )
    })

    it("passes type option", async () => {
      const createPromise = proxy.create({
        title: "New Issue",
        type: "bug",
      })

      mockProcess.stdout.emit("data", Buffer.from(JSON.stringify([sampleIssue])))
      mockProcess.emit("close", 0)

      await createPromise

      expect(mockSpawn).toHaveBeenCalledWith(
        "bd",
        ["create", "--json", "New Issue", "--type", "bug"],
        expect.anything(),
      )
    })

    it("passes assignee option", async () => {
      const createPromise = proxy.create({
        title: "New Issue",
        assignee: "alice",
      })

      mockProcess.stdout.emit("data", Buffer.from(JSON.stringify([sampleIssue])))
      mockProcess.emit("close", 0)

      await createPromise

      expect(mockSpawn).toHaveBeenCalledWith(
        "bd",
        ["create", "--json", "New Issue", "--assignee", "alice"],
        expect.anything(),
      )
    })

    it("passes parent option", async () => {
      const createPromise = proxy.create({
        title: "New Issue",
        parent: "rui-epic",
      })

      mockProcess.stdout.emit("data", Buffer.from(JSON.stringify([sampleIssue])))
      mockProcess.emit("close", 0)

      await createPromise

      expect(mockSpawn).toHaveBeenCalledWith(
        "bd",
        ["create", "--json", "New Issue", "--parent", "rui-epic"],
        expect.anything(),
      )
    })

    it("passes labels option", async () => {
      const createPromise = proxy.create({
        title: "New Issue",
        labels: ["urgent", "frontend"],
      })

      mockProcess.stdout.emit("data", Buffer.from(JSON.stringify([sampleIssue])))
      mockProcess.emit("close", 0)

      await createPromise

      expect(mockSpawn).toHaveBeenCalledWith(
        "bd",
        ["create", "--json", "New Issue", "--labels", "urgent,frontend"],
        expect.anything(),
      )
    })
  })

  describe("update", () => {
    it("updates issue with single id", async () => {
      const updatePromise = proxy.update("rui-123", { title: "Updated Title" })

      mockProcess.stdout.emit("data", Buffer.from(JSON.stringify([sampleIssue])))
      mockProcess.emit("close", 0)

      const result = await updatePromise

      expect(mockSpawn).toHaveBeenCalledWith(
        "bd",
        ["update", "--json", "rui-123", "--title", "Updated Title"],
        expect.anything(),
      )
      expect(result).toEqual([sampleIssue])
    })

    it("updates multiple issues", async () => {
      const updatePromise = proxy.update(["rui-1", "rui-2"], { priority: 0 })

      mockProcess.stdout.emit("data", Buffer.from(JSON.stringify([sampleIssue, sampleIssue])))
      mockProcess.emit("close", 0)

      await updatePromise

      expect(mockSpawn).toHaveBeenCalledWith(
        "bd",
        ["update", "--json", "rui-1", "rui-2", "--priority", "0"],
        expect.anything(),
      )
    })

    it("passes status option", async () => {
      const updatePromise = proxy.update("rui-123", { status: "in_progress" })

      mockProcess.stdout.emit("data", Buffer.from(JSON.stringify([sampleIssue])))
      mockProcess.emit("close", 0)

      await updatePromise

      expect(mockSpawn).toHaveBeenCalledWith(
        "bd",
        ["update", "--json", "rui-123", "--status", "in_progress"],
        expect.anything(),
      )
    })

    it("passes description option", async () => {
      const updatePromise = proxy.update("rui-123", { description: "New description" })

      mockProcess.stdout.emit("data", Buffer.from(JSON.stringify([sampleIssue])))
      mockProcess.emit("close", 0)

      await updatePromise

      expect(mockSpawn).toHaveBeenCalledWith(
        "bd",
        ["update", "--json", "rui-123", "--description", "New description"],
        expect.anything(),
      )
    })

    it("passes add-label options", async () => {
      const updatePromise = proxy.update("rui-123", {
        addLabels: ["urgent", "frontend"],
      })

      mockProcess.stdout.emit("data", Buffer.from(JSON.stringify([sampleIssue])))
      mockProcess.emit("close", 0)

      await updatePromise

      expect(mockSpawn).toHaveBeenCalledWith(
        "bd",
        ["update", "--json", "rui-123", "--add-label", "urgent", "--add-label", "frontend"],
        expect.anything(),
      )
    })

    it("passes remove-label options", async () => {
      const updatePromise = proxy.update("rui-123", {
        removeLabels: ["wontfix"],
      })

      mockProcess.stdout.emit("data", Buffer.from(JSON.stringify([sampleIssue])))
      mockProcess.emit("close", 0)

      await updatePromise

      expect(mockSpawn).toHaveBeenCalledWith(
        "bd",
        ["update", "--json", "rui-123", "--remove-label", "wontfix"],
        expect.anything(),
      )
    })

    it("passes empty parent to clear parent", async () => {
      const updatePromise = proxy.update("rui-123", { parent: "" })

      mockProcess.stdout.emit("data", Buffer.from(JSON.stringify([sampleIssue])))
      mockProcess.emit("close", 0)

      await updatePromise

      expect(mockSpawn).toHaveBeenCalledWith(
        "bd",
        ["update", "--json", "rui-123", "--parent", ""],
        expect.anything(),
      )
    })
  })

  describe("getInfo", () => {
    const sampleInfo = {
      database_path: "/Users/test/my-project/.beads/beads.db",
      issue_count: 42,
      mode: "daemon",
      daemon_connected: true,
      daemon_status: "healthy",
      daemon_version: "0.47.1",
      socket_path: "/Users/test/my-project/.beads/bd.sock",
      config: {
        issue_prefix: "rui",
      },
    }

    it("calls bd info with --json flag", async () => {
      const infoPromise = proxy.getInfo()

      mockProcess.stdout.emit("data", Buffer.from(JSON.stringify(sampleInfo)))
      mockProcess.emit("close", 0)

      const result = await infoPromise

      expect(mockSpawn).toHaveBeenCalledWith(
        "bd",
        ["info", "--json"],
        expect.objectContaining({
          stdio: ["ignore", "pipe", "pipe"],
        }),
      )
      expect(result).toEqual(sampleInfo)
    })

    it("returns database path", async () => {
      const infoPromise = proxy.getInfo()

      mockProcess.stdout.emit("data", Buffer.from(JSON.stringify(sampleInfo)))
      mockProcess.emit("close", 0)

      const result = await infoPromise
      expect(result.database_path).toBe("/Users/test/my-project/.beads/beads.db")
    })

    it("returns issue count", async () => {
      const infoPromise = proxy.getInfo()

      mockProcess.stdout.emit("data", Buffer.from(JSON.stringify(sampleInfo)))
      mockProcess.emit("close", 0)

      const result = await infoPromise
      expect(result.issue_count).toBe(42)
    })

    it("returns daemon connection status", async () => {
      const infoPromise = proxy.getInfo()

      mockProcess.stdout.emit("data", Buffer.from(JSON.stringify(sampleInfo)))
      mockProcess.emit("close", 0)

      const result = await infoPromise
      expect(result.daemon_connected).toBe(true)
      expect(result.daemon_status).toBe("healthy")
    })
  })

  describe("close", () => {
    it("closes single issue", async () => {
      const closePromise = proxy.close("rui-123")

      const closedIssue = { ...sampleIssue, status: "closed" as const }
      mockProcess.stdout.emit("data", Buffer.from(JSON.stringify([closedIssue])))
      mockProcess.emit("close", 0)

      const result = await closePromise

      expect(mockSpawn).toHaveBeenCalledWith(
        "bd",
        ["close", "--json", "rui-123"],
        expect.anything(),
      )
      expect(result[0].status).toBe("closed")
    })

    it("closes multiple issues", async () => {
      const closePromise = proxy.close(["rui-1", "rui-2"])

      mockProcess.stdout.emit("data", Buffer.from(JSON.stringify([sampleIssue, sampleIssue])))
      mockProcess.emit("close", 0)

      await closePromise

      expect(mockSpawn).toHaveBeenCalledWith(
        "bd",
        ["close", "--json", "rui-1", "rui-2"],
        expect.anything(),
      )
    })
  })

  describe("addComment", () => {
    it("adds a comment to an issue", async () => {
      const commentPromise = proxy.addComment("rui-123", "This is a comment")

      mockProcess.stdout.emit("data", Buffer.from(""))
      mockProcess.emit("close", 0)

      await commentPromise

      expect(mockSpawn).toHaveBeenCalledWith(
        "bd",
        ["comments", "add", "rui-123", "This is a comment"],
        expect.anything(),
      )
    })

    it("adds a comment with author", async () => {
      const commentPromise = proxy.addComment("rui-123", "This is a comment", "Ralph")

      mockProcess.stdout.emit("data", Buffer.from(""))
      mockProcess.emit("close", 0)

      await commentPromise

      expect(mockSpawn).toHaveBeenCalledWith(
        "bd",
        ["comments", "add", "rui-123", "This is a comment", "--author", "Ralph"],
        expect.anything(),
      )
    })

    it("rejects on command failure", async () => {
      const commentPromise = proxy.addComment("rui-123", "Comment")

      mockProcess.stderr.emit("data", Buffer.from("Issue not found"))
      mockProcess.emit("close", 1)

      await expect(commentPromise).rejects.toThrow("bd exited with code 1: Issue not found")
    })
  })

  describe("timeout", () => {
    it("uses default timeout", () => {
      const defaultProxy = new BdProxy({ spawn: mockSpawn as unknown as SpawnFn })
      expect(defaultProxy).toBeDefined()
    })

    it("accepts custom timeout", () => {
      const customProxy = new BdProxy({
        spawn: mockSpawn as unknown as SpawnFn,
        timeout: 5000,
      })
      expect(customProxy).toBeDefined()
    })

    it("kills process and rejects on timeout", async () => {
      vi.useFakeTimers()

      const timeoutProxy = new BdProxy({
        spawn: mockSpawn as unknown as SpawnFn,
        timeout: 1000,
      })

      const listPromise = timeoutProxy.list()

      // Advance past timeout
      vi.advanceTimersByTime(1001)

      await expect(listPromise).rejects.toThrow("bd command timed out after 1000ms")
      expect(mockProcess.kill).toHaveBeenCalledWith("SIGKILL")

      vi.useRealTimers()
    })
  })

  describe("custom options", () => {
    it("uses custom command", async () => {
      const customProxy = new BdProxy({
        command: "custom-bd",
        spawn: mockSpawn as unknown as SpawnFn,
      })

      const listPromise = customProxy.list()
      mockProcess.stdout.emit("data", Buffer.from("[]"))
      mockProcess.emit("close", 0)

      await listPromise

      expect(mockSpawn).toHaveBeenCalledWith("custom-bd", expect.anything(), expect.anything())
    })

    it("uses custom cwd", async () => {
      const customProxy = new BdProxy({
        cwd: "/custom/path",
        spawn: mockSpawn as unknown as SpawnFn,
      })

      const listPromise = customProxy.list()
      mockProcess.stdout.emit("data", Buffer.from("[]"))
      mockProcess.emit("close", 0)

      await listPromise

      expect(mockSpawn).toHaveBeenCalledWith(
        "bd",
        expect.anything(),
        expect.objectContaining({
          cwd: "/custom/path",
        }),
      )
    })

    it("merges custom env with process.env", async () => {
      const customProxy = new BdProxy({
        env: { CUSTOM_VAR: "value" },
        spawn: mockSpawn as unknown as SpawnFn,
      })

      const listPromise = customProxy.list()
      mockProcess.stdout.emit("data", Buffer.from("[]"))
      mockProcess.emit("close", 0)

      await listPromise

      expect(mockSpawn).toHaveBeenCalledWith(
        "bd",
        expect.anything(),
        expect.objectContaining({
          env: expect.objectContaining({
            CUSTOM_VAR: "value",
          }),
        }),
      )
    })
  })
})
