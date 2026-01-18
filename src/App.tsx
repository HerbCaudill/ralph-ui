import { useRef, useCallback } from "react"
import { MainLayout, type MainLayoutHandle } from "./components/layout"
import { ChatInput, type ChatInputHandle } from "./components/chat/ChatInput"
import { EventStream } from "./components/events"
import { TaskSidebar } from "./components/tasks/TaskSidebar"
import { TaskList } from "./components/tasks/TaskList"
import { QuickTaskInput } from "./components/tasks/QuickTaskInput"
import {
  useAppStore,
  selectConnectionStatus,
  selectRalphStatus,
  selectIsRalphRunning,
  selectIsConnected,
} from "./store"
import { useRalphConnection, useHotkeys, useTheme, useTasks } from "./hooks"

// =============================================================================
// API Functions (for hotkeys)
// =============================================================================

async function startRalph(): Promise<{ ok: boolean; error?: string }> {
  try {
    const response = await fetch("/api/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    })
    return await response.json()
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to start" }
  }
}

async function stopRalph(): Promise<{ ok: boolean; error?: string }> {
  try {
    const response = await fetch("/api/stop", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    })
    return await response.json()
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to stop" }
  }
}

// =============================================================================
// Tasks Sidebar
// =============================================================================

function TasksSidebarPanel() {
  const { tasks, refresh } = useTasks({ all: true })

  return (
    <TaskSidebar
      quickInput={<QuickTaskInput onTaskCreated={refresh} />}
      taskList={<TaskList tasks={tasks} />}
    />
  )
}

interface AgentViewProps {
  chatInputRef?: React.RefObject<ChatInputHandle | null>
}

function AgentView({ chatInputRef }: AgentViewProps) {
  const { sendMessage, isConnected } = useRalphConnection()
  const isRalphRunning = useAppStore(selectIsRalphRunning)

  return (
    <div className="flex h-full flex-col">
      {/* Event stream */}
      <div className="min-h-0 flex-1">
        <EventStream />
      </div>

      {/* Chat input */}
      <div className="border-border border-t p-4">
        <ChatInput
          ref={chatInputRef}
          onSubmit={sendMessage}
          disabled={!isConnected || !isRalphRunning}
          placeholder={
            !isConnected ? "Connecting..."
            : !isRalphRunning ?
              "Start Ralph to send messages..."
            : "Type a message..."
          }
        />
      </div>
    </div>
  )
}

function StatusBar() {
  const connectionStatus = useAppStore(selectConnectionStatus)
  const ralphStatus = useAppStore(selectRalphStatus)

  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-2">
          <span
            className={
              connectionStatus === "connected" ? "size-2 rounded-full bg-green-500"
              : connectionStatus === "connecting" ?
                "size-2 rounded-full bg-yellow-500"
              : "size-2 rounded-full bg-red-500"
            }
          />
          <span className="text-muted-foreground">
            {connectionStatus === "connected" ?
              "Connected"
            : connectionStatus === "connecting" ?
              "Connecting..."
            : "Disconnected"}
          </span>
        </span>
        <span className="text-muted-foreground">Ralph: {ralphStatus}</span>
      </div>
    </div>
  )
}

// =============================================================================
// App Component
// =============================================================================

export function App() {
  const layoutRef = useRef<MainLayoutHandle>(null)
  const chatInputRef = useRef<ChatInputHandle>(null)

  // Initialize theme management (applies dark class and listens for system changes)
  useTheme()

  // Get state for hotkey conditions
  const ralphStatus = useAppStore(selectRalphStatus)
  const isConnected = useAppStore(selectIsConnected)
  const toggleSidebar = useAppStore(state => state.toggleSidebar)

  // Hotkey handlers
  const handleAgentStart = useCallback(async () => {
    // Only start if stopped and connected
    if (ralphStatus !== "stopped" || !isConnected) return
    await startRalph()
  }, [ralphStatus, isConnected])

  const handleAgentStop = useCallback(async () => {
    // Only stop if running and connected
    if (ralphStatus !== "running" || !isConnected) return
    await stopRalph()
  }, [ralphStatus, isConnected])

  const handleAgentPause = useCallback(() => {
    // See rui-fsd: Implement when ralph supports pause
    console.log("Pause not yet implemented in ralph")
  }, [])

  const handleAgentStopAfterCurrent = useCallback(() => {
    // See rui-4p3: Implement when ralph supports stop-after-current
    console.log("Stop-after-current not yet implemented in ralph")
  }, [])

  const handleToggleSidebar = useCallback(() => {
    toggleSidebar()
  }, [toggleSidebar])

  const handleFocusSidebar = useCallback(() => {
    layoutRef.current?.focusSidebar()
  }, [])

  const handleFocusMain = useCallback(() => {
    layoutRef.current?.focusMain()
  }, [])

  const handleFocusTaskInput = useCallback(() => {
    // See rui-7bu: Focus quick task input when wired up
    layoutRef.current?.focusSidebar()
  }, [])

  const handleFocusChatInput = useCallback(() => {
    chatInputRef.current?.focus()
  }, [])

  // Register hotkeys
  useHotkeys({
    handlers: {
      agentStart: handleAgentStart,
      agentStop: handleAgentStop,
      agentPause: handleAgentPause,
      agentStopAfterCurrent: handleAgentStopAfterCurrent,
      toggleSidebar: handleToggleSidebar,
      focusSidebar: handleFocusSidebar,
      focusMain: handleFocusMain,
      focusTaskInput: handleFocusTaskInput,
      focusChatInput: handleFocusChatInput,
    },
  })

  return (
    <MainLayout
      ref={layoutRef}
      sidebar={<TasksSidebarPanel />}
      main={<AgentView chatInputRef={chatInputRef} />}
      statusBar={<StatusBar />}
    />
  )
}
