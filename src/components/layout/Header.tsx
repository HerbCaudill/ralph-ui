import { cn } from "@/lib/utils"
import { useAppStore, selectConnectionStatus } from "@/store"
import { WorkspacePicker } from "./WorkspacePicker"

// =============================================================================
// Types
// =============================================================================

export interface HeaderProps {
  className?: string
}

// =============================================================================
// ConnectionIndicator Component
// =============================================================================

function ConnectionIndicator() {
  const connectionStatus = useAppStore(selectConnectionStatus)

  const statusConfig = {
    connected: {
      color: "bg-green-500",
      label: "Connected",
    },
    connecting: {
      color: "bg-yellow-500",
      label: "Connecting...",
    },
    disconnected: {
      color: "bg-red-500",
      label: "Disconnected",
    },
  }

  const config = statusConfig[connectionStatus]

  return (
    <div className="flex items-center gap-2" title={config.label}>
      <span className={cn("size-2 rounded-full", config.color)} />
      <span className="text-muted-foreground hidden text-sm sm:inline">{config.label}</span>
    </div>
  )
}

// =============================================================================
// Logo Component
// =============================================================================

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-primary"
      >
        <path d="M12 8V4H8" />
        <rect width="16" height="12" x="4" y="8" rx="2" />
        <path d="M2 14h2" />
        <path d="M20 14h2" />
        <path d="M15 13v2" />
        <path d="M9 13v2" />
      </svg>
      <span className="text-lg font-semibold">Ralph</span>
    </div>
  )
}

// =============================================================================
// Header Component
// =============================================================================

/**
 * Application header with logo, workspace picker, and connection status.
 */
export function Header({ className }: HeaderProps) {
  return (
    <header
      className={cn(
        "bg-background border-border flex h-14 shrink-0 items-center justify-between border-b px-4",
        className,
      )}
    >
      <div className="flex items-center gap-4">
        <Logo />
        <WorkspacePicker />
      </div>

      <div className="flex items-center gap-4">
        <ConnectionIndicator />
      </div>
    </header>
  )
}
