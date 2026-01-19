import { useCallback, useEffect } from "react"
import { useWebSocket, type ConnectionStatus } from "./useWebSocket"
import { useAppStore } from "../store"

// Types

export interface UseRalphConnectionOptions {
  /**
   * The WebSocket URL to connect to.
   * Defaults to `ws://${window.location.host}/ws`.
   */
  url?: string

  /**
   * Whether to automatically connect on mount.
   * @default true
   */
  autoConnect?: boolean
}

export interface UseRalphConnectionReturn {
  /**
   * Current connection status.
   */
  status: ConnectionStatus

  /**
   * Whether the connection is currently open.
   */
  isConnected: boolean

  /**
   * Send a chat message to ralph via WebSocket.
   * The message will be forwarded to ralph's stdin.
   */
  sendMessage: (message: string) => void

  /**
   * Manually connect to the WebSocket server.
   */
  connect: () => void

  /**
   * Manually disconnect from the WebSocket server.
   */
  disconnect: () => void
}

// Hook

/**
 * Hook for managing the WebSocket connection to the ralph-ui server.
 * Handles incoming events and provides methods to send messages.
 */
export function useRalphConnection(
  options: UseRalphConnectionOptions = {},
): UseRalphConnectionReturn {
  const { url, autoConnect = true } = options

  const addEvent = useAppStore(state => state.addEvent)
  const setConnectionStatus = useAppStore(state => state.setConnectionStatus)
  const setRalphStatus = useAppStore(state => state.setRalphStatus)

  const handleMessage = useCallback(
    (data: unknown) => {
      if (!data || typeof data !== "object") return

      const message = data as { type?: string; timestamp?: number; [key: string]: unknown }
      const { type, timestamp } = message

      if (!type) return

      switch (type) {
        case "connected":
          // Welcome message - sync Ralph status from server
          if (
            typeof message.ralphStatus === "string" &&
            [
              "stopped",
              "starting",
              "running",
              "paused",
              "stopping",
              "stopping_after_current",
            ].includes(message.ralphStatus)
          ) {
            setRalphStatus(
              message.ralphStatus as
                | "stopped"
                | "starting"
                | "running"
                | "paused"
                | "stopping"
                | "stopping_after_current",
            )
          }
          break

        case "ralph:event":
          // Ralph event - add to store
          if (message.event && typeof message.event === "object") {
            addEvent(message.event as { type: string; timestamp: number; [key: string]: unknown })
          }
          break

        case "ralph:status":
          // Ralph status change
          if (
            typeof message.status === "string" &&
            ["stopped", "starting", "running", "paused", "stopping"].includes(message.status)
          ) {
            setRalphStatus(
              message.status as "stopped" | "starting" | "running" | "paused" | "stopping",
            )
          }
          break

        case "ralph:output":
          // Non-JSON output from ralph
          addEvent({
            type: "output",
            timestamp: timestamp ?? Date.now(),
            line: message.line,
          })
          break

        case "ralph:error":
          // Error from ralph
          addEvent({
            type: "error",
            timestamp: timestamp ?? Date.now(),
            error: message.error,
          })
          break

        case "ralph:exit":
          // Ralph process exited
          addEvent({
            type: "exit",
            timestamp: timestamp ?? Date.now(),
            code: message.code,
            signal: message.signal,
          })
          break

        case "user_message":
          // User message sent to ralph
          addEvent({
            type: "user_message",
            timestamp: timestamp ?? Date.now(),
            message: message.message,
          })
          break

        case "error":
          // Server error
          addEvent({
            type: "server_error",
            timestamp: timestamp ?? Date.now(),
            error: message.error,
          })
          break

        case "pong":
          // Ping response, ignore
          break

        default:
          // Unknown message type - log it
          console.log("[useRalphConnection] unknown message type:", type)
      }
    },
    [addEvent, setRalphStatus],
  )

  const handleConnect = useCallback(() => {
    setConnectionStatus("connected")
  }, [setConnectionStatus])

  const handleDisconnect = useCallback(() => {
    setConnectionStatus("disconnected")
  }, [setConnectionStatus])

  const { status, isConnected, send, connect, disconnect } = useWebSocket({
    url,
    autoConnect,
    onMessage: handleMessage,
    onConnect: handleConnect,
    onDisconnect: handleDisconnect,
  })

  // Sync "connecting" status to store (callbacks only handle connected/disconnected)
  useEffect(() => {
    if (status === "connecting") {
      setConnectionStatus("connecting")
    }
  }, [status, setConnectionStatus])

  const sendMessage = useCallback(
    (message: string) => {
      send({ type: "chat_message", message })
    },
    [send],
  )

  return {
    status,
    isConnected,
    sendMessage,
    connect,
    disconnect,
  }
}
