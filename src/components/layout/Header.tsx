import { cn } from "@/lib/utils"
import { useAppStore, selectWorkspace, selectConnectionStatus } from "@/store"
import { useState, useRef, useEffect } from "react"

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
// WorkspacePicker Component
// =============================================================================

function WorkspacePicker() {
  const workspace = useAppStore(selectWorkspace)
  const setWorkspace = useAppStore(state => state.setWorkspace)
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // For now, we show the current workspace folder name or "No workspace"
  const displayName = workspace ? workspace.split("/").pop() || workspace : "No workspace"

  // Placeholder workspaces for the dropdown (in real usage, these would come from the server)
  const recentWorkspaces = [
    workspace, // Current workspace
  ].filter(Boolean) as string[]

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 rounded-md px-3 py-1.5",
          "bg-secondary hover:bg-secondary/80 transition-colors",
          "text-sm font-medium",
        )}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-muted-foreground"
        >
          <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
        </svg>
        <span className="max-w-[200px] truncate">{displayName}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn("transition-transform", isOpen && "rotate-180")}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {isOpen && (
        <div
          className={cn(
            "bg-popover border-border absolute top-full left-0 z-50 mt-1 w-64 rounded-md border shadow-lg",
          )}
        >
          <div className="p-1">
            {recentWorkspaces.length > 0 ?
              recentWorkspaces.map(ws => (
                <button
                  key={ws}
                  onClick={() => {
                    setWorkspace(ws)
                    setIsOpen(false)
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded px-3 py-2 text-sm",
                    "hover:bg-accent transition-colors",
                    ws === workspace && "bg-accent",
                  )}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-muted-foreground shrink-0"
                  >
                    <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
                  </svg>
                  <span className="truncate">{ws.split("/").pop() || ws}</span>
                  {ws === workspace && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-primary ml-auto shrink-0"
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  )}
                </button>
              ))
            : <div className="text-muted-foreground px-3 py-2 text-sm">No workspaces available</div>
            }
          </div>
          <div className="border-border border-t p-1">
            <button
              onClick={() => {
                // TODO: Implement workspace selection
                setIsOpen(false)
              }}
              className={cn(
                "flex w-full items-center gap-2 rounded px-3 py-2 text-sm",
                "hover:bg-accent transition-colors",
              )}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-muted-foreground"
              >
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
              <span>Open workspace...</span>
            </button>
          </div>
        </div>
      )}
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
