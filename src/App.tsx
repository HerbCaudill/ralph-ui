import { useRef, useCallback, useState, useEffect } from "react"
import { MainLayout, type MainLayoutHandle, StatusBar, HotkeysDialog } from "./components/layout"
import { ChatInput, type ChatInputHandle } from "./components/chat/ChatInput"
import { EventStream } from "./components/events"
import { TaskSidebar } from "./components/tasks/TaskSidebar"
import { TaskList } from "./components/tasks/TaskList"
import { TaskDetailsDialog } from "./components/tasks/TaskDetailsDialog"
import { QuickTaskInput, type QuickTaskInputHandle } from "./components/tasks/QuickTaskInput"
import { useAppStore, selectRalphStatus, selectIsRalphRunning, selectIsConnected } from "./store"
import { useRalphConnection, useHotkeys, useTheme, useTasks, useTaskDialog } from "./hooks"

// API Functions (for hotkeys)

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

async function pauseRalph(): Promise<{ ok: boolean; error?: string }> {
  try {
    const response = await fetch("/api/pause", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    })
    return await response.json()
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to pause" }
  }
}

async function resumeRalph(): Promise<{ ok: boolean; error?: string }> {
  try {
    const response = await fetch("/api/resume", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    })
    return await response.json()
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to resume" }
  }
}

async function stopAfterCurrentRalph(): Promise<{ ok: boolean; error?: string }> {
  try {
    const response = await fetch("/api/stop-after-current", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    })
    return await response.json()
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to stop after current" }
  }
}

// Tasks Sidebar

interface TasksSidebarPanelProps {
  quickInputRef?: React.RefObject<QuickTaskInputHandle | null>
  onTaskClick?: (taskId: string) => void
  onTaskCreated?: () => void
}

function TasksSidebarPanel({ quickInputRef, onTaskClick, onTaskCreated }: TasksSidebarPanelProps) {
  const { tasks, refresh } = useTasks({ all: true })

  const handleTaskCreated = useCallback(async () => {
    await refresh()
    onTaskCreated?.()
  }, [refresh, onTaskCreated])

  return (
    <TaskSidebar
      quickInput={<QuickTaskInput ref={quickInputRef} onTaskCreated={handleTaskCreated} />}
      taskList={<TaskList tasks={tasks} onTaskClick={onTaskClick} />}
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

// App Component

export function App() {
  const layoutRef = useRef<MainLayoutHandle>(null)
  const chatInputRef = useRef<ChatInputHandle>(null)
  const quickTaskInputRef = useRef<QuickTaskInputHandle>(null)

  // Initialize theme management (applies dark class and listens for system changes)
  const { cycleTheme } = useTheme()

  // Task dialog state
  const taskDialog = useTaskDialog()

  // Hotkeys dialog state
  const [hotkeysDialogOpen, setHotkeysDialogOpen] = useState(false)

  // Handle task click - open the dialog
  const handleTaskClick = useCallback(
    (taskId: string) => {
      taskDialog.openDialogById(taskId)
    },
    [taskDialog],
  )

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

  const handleAgentPause = useCallback(async () => {
    // Toggle between pause and resume based on current status
    if (ralphStatus === "paused") {
      await resumeRalph()
    } else if (ralphStatus === "running" && isConnected) {
      await pauseRalph()
    }
  }, [ralphStatus, isConnected])

  const handleAgentStopAfterCurrent = useCallback(async () => {
    // Only stop-after-current if running or paused and connected
    if ((ralphStatus !== "running" && ralphStatus !== "paused") || !isConnected) return
    await stopAfterCurrentRalph()
  }, [ralphStatus, isConnected])

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
    quickTaskInputRef.current?.focus()
  }, [])

  const handleFocusChatInput = useCallback(() => {
    chatInputRef.current?.focus()
  }, [])

  // Toggle focus between task input and chat input
  const handleToggleInputFocus = useCallback(() => {
    // Check if task input is currently focused
    const activeElement = document.activeElement
    const taskInput = document.querySelector('[aria-label="New task title"]')

    if (activeElement === taskInput) {
      chatInputRef.current?.focus()
    } else {
      quickTaskInputRef.current?.focus()
    }
  }, [])

  const handleCycleTheme = useCallback(() => {
    cycleTheme()
  }, [cycleTheme])

  const handleShowHotkeys = useCallback(() => {
    setHotkeysDialogOpen(true)
  }, [])

  const handleCloseHotkeysDialog = useCallback(() => {
    setHotkeysDialogOpen(false)
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
      cycleTheme: handleCycleTheme,
      showHotkeys: handleShowHotkeys,
      toggleInputFocus: handleToggleInputFocus,
    },
  })

  // Auto-focus task input on mount
  useEffect(() => {
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      quickTaskInputRef.current?.focus()
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  return (
    <>
      <MainLayout
        ref={layoutRef}
        sidebar={
          <TasksSidebarPanel quickInputRef={quickTaskInputRef} onTaskClick={handleTaskClick} />
        }
        main={<AgentView chatInputRef={chatInputRef} />}
        statusBar={<StatusBar />}
      />
      <TaskDetailsDialog
        task={taskDialog.selectedTask}
        open={taskDialog.isOpen}
        onClose={taskDialog.closeDialog}
        onSave={taskDialog.saveTask}
      />
      <HotkeysDialog open={hotkeysDialogOpen} onClose={handleCloseHotkeysDialog} />
    </>
  )
}
