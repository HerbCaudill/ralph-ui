import { useState, useCallback } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAppStore, selectRalphStatus, selectIsConnected } from "@/store"
import type { RalphStatus } from "@/store"

// Types

export interface ControlBarProps {
  className?: string
}

// API Functions

async function startRalph(iterations?: number): Promise<{ ok: boolean; error?: string }> {
  try {
    const response = await fetch("/api/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ iterations }),
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

// Icons

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  )
}

function PauseIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </svg>
  )
}

function StopIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <rect x="4" y="4" width="16" height="16" rx="2" />
    </svg>
  )
}

function StopAfterIcon({ className }: { className?: string }) {
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
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  )
}

// Helper Functions

/**
 * Determines which buttons should be enabled based on current status.
 */
function getButtonStates(status: RalphStatus, isConnected: boolean) {
  // If not connected, disable all buttons
  if (!isConnected) {
    return {
      start: false,
      pause: false,
      stop: false,
      stopAfterCurrent: false,
    }
  }

  switch (status) {
    case "stopped":
      return {
        start: true,
        pause: false,
        stop: false,
        stopAfterCurrent: false,
      }
    case "starting":
      return {
        start: false,
        pause: false,
        stop: false,
        stopAfterCurrent: false,
      }
    case "running":
      return {
        start: false,
        pause: true,
        stop: true,
        stopAfterCurrent: false,
      }
    case "paused":
      return {
        start: false,
        pause: true, // Acts as resume when paused
        stop: true,
        stopAfterCurrent: false,
      }
    case "stopping":
      return {
        start: false,
        pause: false,
        stop: false,
        stopAfterCurrent: false,
      }
    default:
      return {
        start: false,
        pause: false,
        stop: false,
        stopAfterCurrent: false,
      }
  }
}

// ControlBar Component

/**
 * Control bar with buttons for Start, Pause, Stop, and Stop-after-current.
 * Button states are disabled based on ralph status.
 */
export function ControlBar({ className }: ControlBarProps) {
  const status = useAppStore(selectRalphStatus)
  const isConnected = useAppStore(selectIsConnected)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const buttonStates = getButtonStates(status, isConnected)

  const handleStart = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    const result = await startRalph()
    setIsLoading(false)
    if (!result.ok) {
      setError(result.error || "Failed to start")
    }
  }, [])

  const handlePause = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    // Toggle between pause and resume based on current status
    const result = status === "paused" ? await resumeRalph() : await pauseRalph()
    setIsLoading(false)
    if (!result.ok) {
      setError(result.error || (status === "paused" ? "Failed to resume" : "Failed to pause"))
    }
  }, [status])

  const handleStop = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    const result = await stopRalph()
    setIsLoading(false)
    if (!result.ok) {
      setError(result.error || "Failed to stop")
    }
  }, [])

  const handleStopAfterCurrent = useCallback(() => {
    // See rui-4p3: Implement when ralph supports stop-after-current
    console.log("Stop-after-current not yet implemented in ralph")
  }, [])

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Start button */}
      <Button
        variant="outline"
        size="icon-sm"
        onClick={handleStart}
        disabled={!buttonStates.start || isLoading}
        title="Start ralph"
        aria-label="Start"
      >
        <PlayIcon />
      </Button>

      {/* Pause/Resume button */}
      <Button
        variant="outline"
        size="icon-sm"
        onClick={handlePause}
        disabled={!buttonStates.pause || isLoading}
        title={status === "paused" ? "Resume ralph" : "Pause ralph"}
        aria-label={status === "paused" ? "Resume" : "Pause"}
      >
        {status === "paused" ?
          <PlayIcon />
        : <PauseIcon />}
      </Button>

      {/* Stop button */}
      <Button
        variant="outline"
        size="icon-sm"
        onClick={handleStop}
        disabled={!buttonStates.stop || isLoading}
        title="Stop ralph"
        aria-label="Stop"
      >
        <StopIcon />
      </Button>

      {/* Stop after current button */}
      <Button
        variant="outline"
        size="icon-sm"
        onClick={handleStopAfterCurrent}
        disabled={!buttonStates.stopAfterCurrent || isLoading}
        title="Stop after current task (coming soon)"
        aria-label="Stop after current"
      >
        <StopAfterIcon />
      </Button>

      {/* Error display */}
      {error && <span className="text-destructive text-xs">{error}</span>}
    </div>
  )
}
