import { MainLayout } from "./components/layout"
import { useAppStore, selectConnectionStatus, selectRalphStatus } from "./store"

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
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <h1 className="text-2xl font-bold">Ralph UI</h1>
      <p className="text-muted-foreground mt-2">Agent monitoring dashboard</p>
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
