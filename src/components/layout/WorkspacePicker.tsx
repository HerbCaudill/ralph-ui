import { cn } from "@/lib/utils"
import { useAppStore, selectWorkspace, selectAccentColor } from "@/store"
import { useState, useRef, useEffect, useCallback } from "react"

// Types

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
  activeIssueCount?: number
}

export interface WorkspacePickerProps {
  className?: string
}

// Icons

interface FolderIconProps {
  className?: string
  color?: string | null
  size?: number
}

function FolderFilledIcon({ className, color, size = 16 }: FolderIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color || "currentColor"}
      stroke="none"
      className={className}
    >
      <path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z" />
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

// WorkspacePicker Component

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

  // Switch to a different workspace
  const switchToWorkspace = useCallback(
    async (workspacePath: string) => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetch("/api/workspace/switch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path: workspacePath }),
        })
        if (!response.ok) {
          throw new Error("Failed to switch workspace")
        }
        const data = await response.json()
        if (data.ok && data.workspace) {
          setWorkspaceInfo(data.workspace)
          setWorkspace(data.workspace.path)
          setAccentColor(data.workspace.accentColor ?? null)
          // Update the list to reflect new active state
          setAllWorkspaces(prev =>
            prev.map(ws => ({
              ...ws,
              isActive: ws.path === workspacePath,
            })),
          )
        } else {
          throw new Error(data.error || "Unknown error")
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to switch workspace"
        setError(message)
      } finally {
        setIsLoading(false)
        setIsOpen(false)
      }
    },
    [setWorkspace, setAccentColor],
  )

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
        <FolderFilledIcon
          color={isServerDown ? undefined : accentColor}
          className={cn(isServerDown && "text-red-500", !accentColor && "text-muted-foreground")}
        />
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
                      if (!ws.isActive) {
                        switchToWorkspace(ws.path)
                      } else {
                        setIsOpen(false)
                      }
                    }}
                    className={cn(
                      "flex w-full items-center gap-2 rounded px-3 py-2 text-left",
                      "hover:bg-accent transition-colors",
                      ws.isActive && "bg-accent/50",
                    )}
                  >
                    {/* Accent color folder icon */}
                    <FolderFilledIcon
                      color={ws.accentColor}
                      size={14}
                      className={cn(!ws.accentColor && "text-muted-foreground")}
                    />
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <span className="truncate text-sm font-medium">{ws.name}</span>
                      {ws.activeIssueCount !== undefined && (
                        <span className="bg-muted text-muted-foreground rounded-full px-1.5 py-0.5 text-xs">
                          {ws.activeIssueCount}
                        </span>
                      )}
                      {ws.isActive && <CheckIcon className="text-primary shrink-0" />}
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
