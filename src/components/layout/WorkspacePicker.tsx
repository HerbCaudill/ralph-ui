import { cn } from "@/lib/utils"
import { useAppStore, selectWorkspace, selectAccentColor } from "@/store"
import { useState, useRef, useEffect, useCallback } from "react"

// =============================================================================
// Types
// =============================================================================

export interface WorkspaceInfo {
  path: string
  name: string
  issueCount?: number
  daemonConnected?: boolean
  daemonStatus?: string
  accentColor?: string | null
}

export interface WorkspaceListEntry {
  path: string
  name: string
  database: string
  pid: number
  version: string
  startedAt: string
  isActive: boolean
  accentColor?: string | null
}

export interface WorkspacePickerProps {
  className?: string
}

// =============================================================================
// Icons
// =============================================================================

function FolderIcon({ className }: { className?: string }) {
  return (
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
      className={className}
    >
      <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
    </svg>
  )
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
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
      className={className}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
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
      className={className}
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

function PlusIcon({ className }: { className?: string }) {
  return (
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
      className={className}
    >
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  )
}

function RefreshIcon({ className }: { className?: string }) {
  return (
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
      className={className}
    >
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 16h5v5" />
    </svg>
  )
}

// =============================================================================
// WorkspacePicker Component
// =============================================================================

/**
 * Dropdown component to display and switch between bd workspaces.
 * Shows the current workspace name and allows switching to other workspaces.
 */
export function WorkspacePicker({ className }: WorkspacePickerProps) {
  const workspace = useAppStore(selectWorkspace)
  const accentColor = useAppStore(selectAccentColor)
  const setWorkspace = useAppStore(state => state.setWorkspace)
  const setAccentColor = useAppStore(state => state.setAccentColor)
  const [isOpen, setIsOpen] = useState(false)
  const [workspaceInfo, setWorkspaceInfo] = useState<WorkspaceInfo | null>(null)
  const [allWorkspaces, setAllWorkspaces] = useState<WorkspaceListEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingList, setIsLoadingList] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fetch workspace info from the server
  const fetchWorkspaceInfo = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/workspace")
      if (!response.ok) {
        throw new Error("Failed to fetch workspace info")
      }
      const data = await response.json()
      if (data.ok && data.workspace) {
        setWorkspaceInfo(data.workspace)
        // Update the store with the workspace path
        if (data.workspace.path !== workspace) {
          setWorkspace(data.workspace.path)
        }
        // Update the store with the accent color from peacock
        if (data.workspace.accentColor !== accentColor) {
          setAccentColor(data.workspace.accentColor ?? null)
        }
      } else {
        throw new Error(data.error || "Unknown error")
      }
    } catch (err) {
      // Detect connection refused (server not running)
      const message = err instanceof Error ? err.message : "Failed to fetch workspace"
      const isConnectionError =
        message.includes("fetch") || message.includes("ECONNREFUSED") || message.includes("network")
      setError(isConnectionError ? "Server not running" : message)
    } finally {
      setIsLoading(false)
    }
  }, [workspace, accentColor, setWorkspace, setAccentColor])

  // Fetch all available workspaces from the registry
  const fetchAllWorkspaces = useCallback(async () => {
    setIsLoadingList(true)
    try {
      const response = await fetch("/api/workspaces")
      if (!response.ok) {
        throw new Error("Failed to fetch workspaces")
      }
      const data = await response.json()
      if (data.ok && data.workspaces) {
        setAllWorkspaces(data.workspaces)
      }
    } catch (err) {
      console.error("Failed to fetch workspaces:", err)
    } finally {
      setIsLoadingList(false)
    }
  }, [])

  // Fetch workspace info on mount (only once)
  const hasFetchedRef = useRef(false)
  useEffect(() => {
    if (hasFetchedRef.current) return
    hasFetchedRef.current = true
    fetchWorkspaceInfo()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fetch all workspaces when dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchAllWorkspaces()
    }
  }, [isOpen, fetchAllWorkspaces])

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

  // Check if server is not running
  const isServerDown = error === "Server not running"

  // Display name: use workspaceInfo name, or derive from workspace path, or fallback
  const displayName =
    isServerDown ? "Server not running" : (
      workspaceInfo?.name || (workspace ? workspace.split("/").pop() : null) || "No workspace"
    )

  // Issue count badge
  const issueCount = workspaceInfo?.issueCount

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 rounded-md px-3 py-1.5",
          "bg-secondary hover:bg-secondary/80 transition-colors",
          "text-sm font-medium",
          isLoading && "opacity-70",
          isServerDown && "bg-red-500/10 text-red-500 hover:bg-red-500/20",
        )}
        aria-expanded={isOpen}
        aria-haspopup="true"
        disabled={isLoading}
      >
        <FolderIcon className={cn("text-muted-foreground", isServerDown && "text-red-500")} />
        <span className="max-w-[200px] truncate">{displayName}</span>
        {issueCount !== undefined && (
          <span className="bg-muted text-muted-foreground rounded-full px-1.5 py-0.5 text-xs">
            {issueCount}
          </span>
        )}
        <ChevronDownIcon className={cn("transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div
          className={cn(
            "bg-popover border-border absolute top-full left-0 z-50 mt-1 w-80 rounded-md border shadow-lg",
          )}
        >
          {/* Error state */}
          {error && (
            <div className="p-3">
              <div className="flex items-center gap-2 text-sm text-red-500">
                <span>{error}</span>
                <button
                  onClick={fetchWorkspaceInfo}
                  className="text-red-400 hover:text-red-300"
                  title="Retry"
                >
                  <RefreshIcon />
                </button>
              </div>
              {isServerDown && (
                <p className="text-muted-foreground mt-2 text-xs">
                  Run <code className="bg-muted rounded px-1">pnpm dev</code> to start both servers
                </p>
              )}
            </div>
          )}

          {/* Workspaces list */}
          {!error && (
            <div className="max-h-80 overflow-y-auto p-1">
              <div className="text-muted-foreground px-3 py-1.5 text-xs font-medium tracking-wider uppercase">
                Workspaces
              </div>
              {isLoadingList && allWorkspaces.length === 0 ?
                <div className="text-muted-foreground px-3 py-2 text-sm">Loading...</div>
              : allWorkspaces.length === 0 ?
                <div className="text-muted-foreground px-3 py-2 text-sm">No workspaces found</div>
              : allWorkspaces.map(ws => (
                  <button
                    key={ws.path}
                    onClick={() => {
                      // For now, just close the dropdown - switching requires server restart
                      setIsOpen(false)
                    }}
                    className={cn(
                      "flex w-full items-center gap-2 rounded px-3 py-2 text-left",
                      "hover:bg-accent transition-colors",
                      ws.isActive && "bg-accent/50",
                    )}
                  >
                    {/* Accent color indicator */}
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: ws.accentColor || "#666" }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium">{ws.name}</span>
                        {ws.isActive && <CheckIcon className="text-primary shrink-0" />}
                      </div>
                      <div className="text-muted-foreground truncate text-xs" title={ws.path}>
                        {ws.path.replace(/^\/Users\/[^/]+\//, "~/")}
                      </div>
                    </div>
                  </button>
                ))
              }
            </div>
          )}

          {/* Actions section */}
          <div className="border-border border-t p-1">
            <button
              onClick={() => {
                fetchWorkspaceInfo()
                fetchAllWorkspaces()
              }}
              className={cn(
                "flex w-full items-center gap-2 rounded px-3 py-2 text-sm",
                "hover:bg-accent transition-colors",
              )}
            >
              <RefreshIcon className="text-muted-foreground" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
