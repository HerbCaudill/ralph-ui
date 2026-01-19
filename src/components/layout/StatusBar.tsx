import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import {
  useAppStore,
  selectRalphStatus,
  selectWorkspace,
  selectBranch,
  selectTokenUsage,
  selectIteration,
  selectRunStartedAt,
} from "@/store"
import { ControlBar } from "@/components/controls/ControlBar"

// Types

export interface StatusBarProps {
  className?: string
}

// Helper Functions

/**
 * Formats a token count with k/M suffixes for readability.
 */
function formatTokenCount(count: number): string {
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1)}M`
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1)}k`
  }
  return count.toString()
}

/**
 * Extracts the repo name from a workspace path.
 */
function getRepoName(workspace: string | null): string | null {
  if (!workspace) return null
  return workspace.split("/").pop() || workspace
}

/**
 * Formats elapsed time in a human-readable format.
 * Shows seconds for < 1 minute, then minutes:seconds, then hours:minutes:seconds.
 */
export function formatElapsedTime(elapsedMs: number): string {
  const totalSeconds = Math.floor(elapsedMs / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }
  if (minutes > 0) {
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }
  return `${seconds}s`
}

// StatusIndicator Component

function StatusIndicator() {
  const status = useAppStore(selectRalphStatus)

  const statusConfig = {
    stopped: {
      color: "bg-gray-500",
      label: "Stopped",
    },
    starting: {
      color: "bg-yellow-500 animate-pulse",
      label: "Starting",
    },
    running: {
      color: "bg-green-500",
      label: "Running",
    },
    paused: {
      color: "bg-orange-500",
      label: "Paused",
    },
    stopping: {
      color: "bg-yellow-500 animate-pulse",
      label: "Stopping",
    },
    stopping_after_current: {
      color: "bg-yellow-500",
      label: "Stopping after task",
    },
  }

  const config = statusConfig[status]

  return (
    <div className="flex items-center gap-1.5" title={config.label}>
      <span className={cn("size-2 rounded-full", config.color)} />
      <span className="text-muted-foreground text-xs">{config.label}</span>
    </div>
  )
}

// RepoBranch Component

function RepoBranch() {
  const workspace = useAppStore(selectWorkspace)
  const branch = useAppStore(selectBranch)

  const repoName = getRepoName(workspace)

  if (!repoName && !branch) return null

  return (
    <div className="text-muted-foreground flex items-center gap-1 text-xs">
      {/* Git branch icon */}
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
        className="shrink-0"
      >
        <line x1="6" x2="6" y1="3" y2="15" />
        <circle cx="18" cy="6" r="3" />
        <circle cx="6" cy="18" r="3" />
        <path d="M18 9a9 9 0 0 1-9 9" />
      </svg>
      <span className="max-w-[150px] truncate">
        {repoName}
        {branch && (
          <>
            <span className="mx-1 opacity-50">/</span>
            {branch}
          </>
        )}
      </span>
    </div>
  )
}

// TokenUsage Component

function TokenUsageDisplay() {
  const tokenUsage = useAppStore(selectTokenUsage)

  return (
    <div
      className="text-muted-foreground flex items-center gap-2 text-xs"
      title="Token usage (input / output)"
    >
      <span className="flex items-center gap-0.5">
        <span className="opacity-70">↓</span>
        <span>{formatTokenCount(tokenUsage.input)}</span>
      </span>
      <span className="flex items-center gap-0.5">
        <span className="opacity-70">↑</span>
        <span>{formatTokenCount(tokenUsage.output)}</span>
      </span>
    </div>
  )
}

// IterationProgress Component

function IterationProgress() {
  const iteration = useAppStore(selectIteration)

  // Don't show if no total is set
  if (iteration.total === 0) return null

  const progress = (iteration.current / iteration.total) * 100

  return (
    <div
      className="flex items-center gap-2"
      title={`Iteration ${iteration.current} of ${iteration.total}`}
    >
      <div className="bg-muted h-1.5 w-16 overflow-hidden rounded-full">
        <div
          className="bg-primary h-full transition-all duration-300"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
      <span className="text-muted-foreground text-xs">
        {iteration.current}/{iteration.total}
      </span>
    </div>
  )
}

// RunDuration Component

function RunDuration() {
  const runStartedAt = useAppStore(selectRunStartedAt)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!runStartedAt) {
      setElapsed(0)
      return
    }

    // Update immediately
    setElapsed(Date.now() - runStartedAt)

    // Update every second
    const interval = setInterval(() => {
      setElapsed(Date.now() - runStartedAt)
    }, 1000)

    return () => clearInterval(interval)
  }, [runStartedAt])

  // Don't show if not running
  if (!runStartedAt) return null

  return (
    <div className="text-muted-foreground flex items-center gap-1 text-xs" title="Time running">
      {/* Clock icon */}
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
        className="shrink-0"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
      <span>{formatElapsedTime(elapsed)}</span>
    </div>
  )
}

// StatusBar Component

/**
 * Bottom status bar showing run status, control buttons, repo/branch, token usage, and iteration progress.
 */
export function StatusBar({ className }: StatusBarProps) {
  return (
    <div className={cn("flex items-center justify-between gap-4 text-sm", className)}>
      {/* Left section: Control buttons, status, run duration, and repo/branch */}
      <div className="flex items-center gap-4">
        <ControlBar />
        <StatusIndicator />
        <RunDuration />
        <RepoBranch />
      </div>

      {/* Right section: Token usage and iteration */}
      <div className="flex items-center gap-4">
        <TokenUsageDisplay />
        <IterationProgress />
      </div>
    </div>
  )
}
