import { MainLayout } from "./components/layout"
import { ChatInput } from "./components/chat/ChatInput"
import { EventStream } from "./components/events"
import {
  useAppStore,
  selectConnectionStatus,
  selectRalphStatus,
  selectIsRalphRunning,
} from "./store"
import { useRalphConnection } from "./hooks"

// =============================================================================
// Placeholder Components (to be replaced with actual implementations)
// =============================================================================

function TasksSidebar() {
  return (
    <div className="space-y-4">
      <h2 className="text-sidebar-foreground text-lg font-semibold">Tasks</h2>
      <p className="text-muted-foreground text-sm">No tasks yet</p>
    </div>
  )
}

function AgentView() {
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
  return <MainLayout sidebar={<TasksSidebar />} main={<AgentView />} statusBar={<StatusBar />} />
}
