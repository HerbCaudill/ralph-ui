import express, { type Express, type Request, type Response } from "express"
import { createServer, type Server } from "node:http"
import path from "node:path"
import { readFile } from "node:fs/promises"
import { WebSocketServer, type WebSocket, type RawData } from "ws"
import { RalphManager, type RalphEvent, type RalphStatus } from "./RalphManager.js"
import { BdProxy, type BdCreateOptions } from "./BdProxy.js"
import { getAliveWorkspaces } from "./registry.js"

// =============================================================================
// Peacock Color Reader
// =============================================================================

/**
 * Read the peacock accent color from .vscode/settings.json in the workspace.
 * Returns null if not found or on any error.
 */
export async function readPeacockColor(workspacePath: string): Promise<string | null> {
  try {
    const settingsPath = path.join(workspacePath, ".vscode", "settings.json")
    const content = await readFile(settingsPath, "utf-8")
    const settings = JSON.parse(content) as { "peacock.color"?: string }
    return settings["peacock.color"] ?? null
  } catch {
    // File doesn't exist or is invalid JSON - return null (fallback to black)
    return null
  }
}

// =============================================================================
// Configuration
// =============================================================================

export interface ServerConfig {
  host: string
  port: number
  appDir: string
}

function getConfig(): ServerConfig {
  return {
    host: process.env.HOST || "localhost",
    port: parseInt(process.env.PORT || "3000", 10),
    appDir: path.resolve(import.meta.dirname, "..", "dist"),
  }
}

// =============================================================================
// Express App
// =============================================================================

function createApp(config: ServerConfig): Express {
  const app = express()

  // Disable x-powered-by header
  app.disable("x-powered-by")

  // Parse JSON bodies
  app.use(express.json())

  // Health endpoint
  app.get("/healthz", (_req: Request, res: Response) => {
    res.type("application/json")
    res.status(200).json({ ok: true })
  })

  // API endpoints
  app.post("/api/start", async (req: Request, res: Response) => {
    try {
      const manager = getRalphManager()
      if (manager.isRunning) {
        res.status(409).json({ ok: false, error: "Ralph is already running" })
        return
      }

      const { iterations } = req.body as { iterations?: number }
      await manager.start(iterations)
      res.status(200).json({ ok: true, status: manager.status })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to start"
      res.status(500).json({ ok: false, error: message })
    }
  })

  app.post("/api/stop", async (_req: Request, res: Response) => {
    try {
      const manager = getRalphManager()
      if (!manager.isRunning) {
        res.status(409).json({ ok: false, error: "Ralph is not running" })
        return
      }

      await manager.stop()
      res.status(200).json({ ok: true, status: manager.status })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to stop"
      res.status(500).json({ ok: false, error: message })
    }
  })

  app.post("/api/message", (req: Request, res: Response) => {
    try {
      const manager = getRalphManager()
      if (!manager.isRunning) {
        res.status(409).json({ ok: false, error: "Ralph is not running" })
        return
      }

      const { message } = req.body as { message?: string | object }
      if (message === undefined) {
        res.status(400).json({ ok: false, error: "Message is required" })
        return
      }

      manager.send(message)
      res.status(200).json({ ok: true })
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to send message"
      res.status(500).json({ ok: false, error: msg })
    }
  })

  // Status endpoint (GET for convenience)
  app.get("/api/status", (_req: Request, res: Response) => {
    const manager = getRalphManager()
    res.status(200).json({ ok: true, status: manager.status })
  })

  // Workspace info endpoint
  app.get("/api/workspace", async (_req: Request, res: Response) => {
    try {
      const bdProxy = getBdProxy()
      const info = await bdProxy.getInfo()

      // Extract workspace path from database_path (remove .beads/beads.db suffix)
      const workspacePath = info.database_path.replace(/\/.beads\/beads\.db$/, "")

      // Read peacock accent color from .vscode/settings.json
      const accentColor = await readPeacockColor(workspacePath)

      res.status(200).json({
        ok: true,
        workspace: {
          path: workspacePath,
          name: workspacePath.split("/").pop() || workspacePath,
          issueCount: info.issue_count,
          daemonConnected: info.daemon_connected,
          daemonStatus: info.daemon_status,
          accentColor,
        },
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to get workspace info"
      res.status(500).json({ ok: false, error: message })
    }
  })

  // List all available workspaces from the global registry
  app.get("/api/workspaces", async (_req: Request, res: Response) => {
    try {
      // Get current workspace path for marking active
      const bdProxy = getBdProxy()
      let currentWorkspacePath: string | undefined
      try {
        const info = await bdProxy.getInfo()
        currentWorkspacePath = info.database_path.replace(/\/.beads\/beads\.db$/, "")
      } catch {
        // If we can't get current workspace, that's fine - just don't mark any as active
      }

      const workspaces = getAliveWorkspaces(currentWorkspacePath)

      // Add accent colors for each workspace
      const workspacesWithColors = await Promise.all(
        workspaces.map(async ws => ({
          ...ws,
          accentColor: await readPeacockColor(ws.path),
        })),
      )

      res.status(200).json({
        ok: true,
        workspaces: workspacesWithColors,
        currentPath: currentWorkspacePath,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to list workspaces"
      res.status(500).json({ ok: false, error: message })
    }
  })

  // Switch to a different workspace
  app.post("/api/workspace/switch", async (req: Request, res: Response) => {
    try {
      const { path: workspacePath } = req.body as { path?: string }

      if (!workspacePath?.trim()) {
        res.status(400).json({ ok: false, error: "Workspace path is required" })
        return
      }

      // Switch the BdProxy to the new workspace
      switchWorkspace(workspacePath)

      // Get info from the new workspace to confirm it works
      const bdProxy = getBdProxy()
      const info = await bdProxy.getInfo()
      const accentColor = await readPeacockColor(workspacePath)

      res.status(200).json({
        ok: true,
        workspace: {
          path: workspacePath,
          name: workspacePath.split("/").pop(),
          issueCount: info.issue_count,
          daemonConnected: info.daemon_connected,
          daemonStatus: info.daemon_status,
          accentColor,
        },
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to switch workspace"
      res.status(500).json({ ok: false, error: message })
    }
  })

  // Task management endpoints
  app.post("/api/tasks", async (req: Request, res: Response) => {
    try {
      const { title, description, priority, type, assignee, parent, labels } = req.body as {
        title?: string
        description?: string
        priority?: number
        type?: string
        assignee?: string
        parent?: string
        labels?: string[]
      }

      if (!title?.trim()) {
        res.status(400).json({ ok: false, error: "Title is required" })
        return
      }

      const bdProxy = getBdProxy()
      const options: BdCreateOptions = { title: title.trim() }
      if (description) options.description = description
      if (priority !== undefined) options.priority = priority
      if (type) options.type = type
      if (assignee) options.assignee = assignee
      if (parent) options.parent = parent
      if (labels) options.labels = labels

      const issue = await bdProxy.create(options)
      res.status(201).json({ ok: true, issue })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create task"
      res.status(500).json({ ok: false, error: message })
    }
  })

  // Static assets from dist (built by Vite)
  app.use(express.static(config.appDir))

  // SPA fallback - serve index.html for non-API routes
  // Express 5 requires named parameter for wildcard routes
  app.get("/{*splat}", (_req: Request, res: Response) => {
    const indexPath = path.join(config.appDir, "index.html")
    res.sendFile(indexPath, err => {
      if (err) {
        res.status(404).send("Not found")
      }
    })
  })

  return app
}

// =============================================================================
// WebSocket Server
// =============================================================================

export interface WsClient {
  ws: WebSocket
  isAlive: boolean
}

const clients = new Set<WsClient>()

/**
 * Get the number of connected WebSocket clients.
 */
export function getClientCount(): number {
  return clients.size
}

function attachWsServer(httpServer: Server): WebSocketServer {
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" })

  // Heartbeat interval (30s)
  const heartbeatInterval = setInterval(() => {
    for (const client of clients) {
      if (!client.isAlive) {
        console.log("[ws] client timeout, terminating")
        client.ws.terminate()
        clients.delete(client)
        continue
      }
      client.isAlive = false
      client.ws.ping()
    }
  }, 30_000)

  wss.on("close", () => {
    clearInterval(heartbeatInterval)
  })

  wss.on("connection", (ws: WebSocket) => {
    console.log("[ws] client connected")

    const client: WsClient = { ws, isAlive: true }
    clients.add(client)

    ws.on("pong", () => {
      client.isAlive = true
    })

    ws.on("message", (data: RawData) => {
      handleWsMessage(ws, data)
    })

    ws.on("close", () => {
      console.log("[ws] client disconnected")
      clients.delete(client)
    })

    ws.on("error", err => {
      console.error("[ws] client error:", err)
      clients.delete(client)
    })

    // Send welcome message
    ws.send(JSON.stringify({ type: "connected", timestamp: Date.now() }))
  })

  return wss
}

function handleWsMessage(ws: WebSocket, data: RawData): void {
  try {
    const message = JSON.parse(data.toString())
    console.log("[ws] received:", message.type)

    // Handle different message types
    switch (message.type) {
      case "ping":
        ws.send(JSON.stringify({ type: "pong", timestamp: Date.now() }))
        break

      case "chat_message": {
        // Forward user message to ralph stdin
        const manager = getRalphManager()
        const chatMessage = message.message as string | undefined
        if (!chatMessage) {
          ws.send(
            JSON.stringify({ type: "error", error: "Message is required", timestamp: Date.now() }),
          )
          return
        }

        if (!manager.isRunning) {
          ws.send(
            JSON.stringify({ type: "error", error: "Ralph is not running", timestamp: Date.now() }),
          )
          return
        }

        // Send to ralph
        manager.send(chatMessage)

        // Broadcast user message to all clients so it appears in event stream
        broadcast({
          type: "user_message",
          message: chatMessage,
          timestamp: Date.now(),
        })
        break
      }

      default:
        console.log("[ws] unknown message type:", message.type)
    }
  } catch (err) {
    console.error("[ws] failed to parse message:", err)
  }
}

/**
 * Broadcast a message to all connected clients.
 */
export function broadcast(message: unknown): void {
  const payload = JSON.stringify(message)
  for (const client of clients) {
    if (client.ws.readyState === client.ws.OPEN) {
      client.ws.send(payload)
    }
  }
}

// =============================================================================
// BdProxy Integration
// =============================================================================

// Singleton BdProxy instance
let bdProxy: BdProxy | null = null

/**
 * Get the singleton BdProxy instance, creating it if needed.
 */
export function getBdProxy(): BdProxy {
  if (!bdProxy) {
    bdProxy = new BdProxy()
  }
  return bdProxy
}

/**
 * Reset the BdProxy singleton (for testing).
 */
export function resetBdProxy(): void {
  bdProxy = null
}

/**
 * Switch to a different workspace by creating a new BdProxy with the given cwd.
 */
export function switchWorkspace(workspacePath: string): void {
  bdProxy = new BdProxy({ cwd: workspacePath })
}

// =============================================================================
// RalphManager Integration
// =============================================================================

// Singleton RalphManager instance
let ralphManager: RalphManager | null = null

/**
 * Get the singleton RalphManager instance, creating it if needed.
 */
export function getRalphManager(): RalphManager {
  if (!ralphManager) {
    ralphManager = createRalphManager()
  }
  return ralphManager
}

/**
 * Create a RalphManager and wire up event broadcasting.
 */
function createRalphManager(): RalphManager {
  const manager = new RalphManager()

  // Broadcast ralph events to all WebSocket clients
  manager.on("event", (event: RalphEvent) => {
    broadcast({
      type: "ralph:event",
      event,
      timestamp: Date.now(),
    })
  })

  // Broadcast status changes
  manager.on("status", (status: RalphStatus) => {
    broadcast({
      type: "ralph:status",
      status,
      timestamp: Date.now(),
    })
  })

  // Broadcast non-JSON output lines
  manager.on("output", (line: string) => {
    broadcast({
      type: "ralph:output",
      line,
      timestamp: Date.now(),
    })
  })

  // Broadcast errors
  manager.on("error", (error: Error) => {
    broadcast({
      type: "ralph:error",
      error: error.message,
      timestamp: Date.now(),
    })
  })

  // Broadcast exit events
  manager.on("exit", (info: { code: number | null; signal: string | null }) => {
    broadcast({
      type: "ralph:exit",
      code: info.code,
      signal: info.signal,
      timestamp: Date.now(),
    })
  })

  return manager
}

/**
 * Reset the RalphManager singleton (for testing).
 */
export function resetRalphManager(): void {
  if (ralphManager) {
    ralphManager.removeAllListeners()
    ralphManager = null
  }
}

// =============================================================================
// Port availability check
// =============================================================================

async function findAvailablePort(
  host: string,
  startPort: number,
  maxAttempts = 10,
): Promise<number> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const port = startPort + attempt
    const available = await checkPortAvailable(host, port)
    if (available) {
      return port
    }
    console.log(`[server] port ${port} in use, trying ${port + 1}`)
  }
  throw new Error(
    `No available port found after ${maxAttempts} attempts starting from ${startPort}`,
  )
}

function checkPortAvailable(host: string, port: number): Promise<boolean> {
  return new Promise(resolve => {
    const testServer = createServer()
    testServer.once("error", () => {
      resolve(false)
    })
    testServer.listen(port, host, () => {
      testServer.close(() => {
        resolve(true)
      })
    })
  })
}

// =============================================================================
// Main entry point
// =============================================================================

async function startServer(config: ServerConfig): Promise<void> {
  const app = createApp(config)
  const server = createServer(app)

  attachWsServer(server)

  server.on("error", err => {
    console.error("[server] error:", err)
    process.exitCode = 1
  })

  server.listen(config.port, config.host, () => {
    console.log(`[server] ralph-ui running at http://${config.host}:${config.port}`)
    console.log(`[server] WebSocket available at ws://${config.host}:${config.port}/ws`)
  })
}

// Main
;(async () => {
  try {
    const config = getConfig()
    const availablePort = await findAvailablePort(config.host, config.port)
    if (availablePort !== config.port) {
      process.env.PORT = String(availablePort)
      config.port = availablePort
    }
    await startServer(config)
  } catch (err) {
    console.error("[server] startup error:", err)
    process.exitCode = 1
  }
})()
