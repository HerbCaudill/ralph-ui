import express, { type Express, type Request, type Response } from "express"
import { createServer, type Server } from "node:http"
import path from "node:path"
import { WebSocketServer, type WebSocket, type RawData } from "ws"

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

  // API endpoints (to be expanded)
  app.post("/api/start", (_req: Request, res: Response) => {
    // TODO: Implement ralph spawn
    res.status(501).json({ ok: false, error: "Not implemented" })
  })

  app.post("/api/stop", (_req: Request, res: Response) => {
    // TODO: Implement ralph stop
    res.status(501).json({ ok: false, error: "Not implemented" })
  })

  app.post("/api/message", (_req: Request, res: Response) => {
    // TODO: Implement message to ralph stdin
    res.status(501).json({ ok: false, error: "Not implemented" })
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

interface WsClient {
  ws: WebSocket
  isAlive: boolean
}

const clients = new Set<WsClient>()

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
