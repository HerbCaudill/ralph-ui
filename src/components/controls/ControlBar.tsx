import { useState, useCallback } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { TooltipButton } from "@/components/ui/tooltip"
import { useAppStore, selectRalphStatus, selectIsConnected } from "@/store"
import { useHotkeys } from "@/hooks"
import type { RalphStatus } from "@/store"

// Types

export interface ControlBarProps {
  className?: string
  /** Display variant - "header" for colored header background */
  variant?: "default" | "header"
  /** Text color to use when variant is "header" */
  textColor?: string
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

async function cancelStopAfterCurrentRalph(): Promise<{ ok: boolean; error?: string }> {
  try {
    const response = await fetch("/api/cancel-stop-after-current", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    })
    return await response.json()
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to cancel stop after current",
    }
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
        stopAfterCurrent: true,
      }
    case "paused":
      return {
        start: false,
        pause: true, // Acts as resume when paused
        stop: true,
        stopAfterCurrent: true,
      }
    case "stopping":
      return {
        start: false,
        pause: false,
        stop: false,
        stopAfterCurrent: false,
      }
    case "stopping_after_current":
      return {
        start: false,
        pause: false,
        stop: true, // Allow immediate stop to cancel
        stopAfterCurrent: true, // Allow canceling the stop-after-current
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
export function ControlBar({ className, variant = "default", textColor }: ControlBarProps) {
  const status = useAppStore(selectRalphStatus)
  const isConnected = useAppStore(selectIsConnected)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { getHotkeyDisplay } = useHotkeys({ handlers: {} })

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

  const handleStopAfterCurrent = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    // Toggle between stop-after-current and cancel based on current status
    const result =
      status === "stopping_after_current" ?
        await cancelStopAfterCurrentRalph()
      : await stopAfterCurrentRalph()
    setIsLoading(false)
    if (!result.ok) {
      setError(
        result.error ||
          (status === "stopping_after_current" ?
            "Failed to cancel stop after current"
          : "Failed to stop after current"),
      )
    }
  }, [status])

  const isHeaderVariant = variant === "header"

  // Button styling for header variant
  const headerButtonStyle =
    isHeaderVariant ?
      {
        color: textColor,
        borderColor: `${textColor}40`,
        backgroundColor: "transparent",
      }
    : undefined

  const headerButtonClassName = isHeaderVariant ? "hover:bg-white/20 border" : undefined

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Start button */}
      <TooltipButton tooltip="Start" hotkey={getHotkeyDisplay("agentStart")}>
        <Button
          variant={isHeaderVariant ? "ghost" : "outline"}
          size="icon-sm"
          onClick={handleStart}
          disabled={!buttonStates.start || isLoading}
          aria-label="Start"
          className={headerButtonClassName}
          style={headerButtonStyle}
        >
          <PlayIcon />
        </Button>
      </TooltipButton>

      {/* Pause/Resume button */}
      <TooltipButton
        tooltip={status === "paused" ? "Resume" : "Pause"}
        hotkey={getHotkeyDisplay("agentPause")}
      >
        <Button
          variant={isHeaderVariant ? "ghost" : "outline"}
          size="icon-sm"
          onClick={handlePause}
          disabled={!buttonStates.pause || isLoading}
          aria-label={status === "paused" ? "Resume" : "Pause"}
          className={headerButtonClassName}
          style={headerButtonStyle}
        >
          {status === "paused" ?
            <PlayIcon />
          : <PauseIcon />}
        </Button>
      </TooltipButton>

      {/* Stop button */}
      <TooltipButton tooltip="Stop" hotkey={getHotkeyDisplay("agentStop")}>
        <Button
          variant={isHeaderVariant ? "ghost" : "outline"}
          size="icon-sm"
          onClick={handleStop}
          disabled={!buttonStates.stop || isLoading}
          aria-label="Stop"
          className={headerButtonClassName}
          style={headerButtonStyle}
        >
          <StopIcon />
        </Button>
      </TooltipButton>

      {/* Stop after current button */}
      <TooltipButton
        tooltip={
          status === "stopping_after_current" ? "Cancel stop after current" : "Stop after current"
        }
        hotkey={getHotkeyDisplay("agentStopAfterCurrent")}
      >
        <Button
          variant={
            status === "stopping_after_current" ? "default"
            : isHeaderVariant ?
              "ghost"
            : "outline"
          }
          size="icon-sm"
          onClick={handleStopAfterCurrent}
          disabled={!buttonStates.stopAfterCurrent || isLoading}
          aria-label={
            status === "stopping_after_current" ? "Cancel stop after current" : "Stop after current"
          }
          className={status !== "stopping_after_current" ? headerButtonClassName : undefined}
          style={status !== "stopping_after_current" ? headerButtonStyle : undefined}
        >
          <StopAfterIcon />
        </Button>
      </TooltipButton>

      {/* Error display */}
      {error && (
        <span className={cn("text-xs", isHeaderVariant ? "text-red-200" : "text-destructive")}>
          {error}
        </span>
      )}
    </div>
  )
}
