import { cn } from "@/lib/utils"
import { useAppStore, selectEvents, type RalphEvent } from "@/store"
import { useCallback, useEffect, useRef, useState } from "react"

// =============================================================================
// Types
// =============================================================================

export interface EventStreamProps {
  className?: string
  /**
   * Maximum number of events to display. Older events are removed when exceeded.
   * @default 1000
   */
  maxEvents?: number
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Formats a timestamp as HH:MM:SS.mmm
 */
function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp)
  const hours = date.getHours().toString().padStart(2, "0")
  const minutes = date.getMinutes().toString().padStart(2, "0")
  const seconds = date.getSeconds().toString().padStart(2, "0")
  const millis = date.getMilliseconds().toString().padStart(3, "0")
  return `${hours}:${minutes}:${seconds}.${millis}`
}

/**
 * Get a display-friendly label for an event type
 */
function getEventTypeLabel(type: string): string {
  return type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())
}

/**
 * Get a color class for an event type
 */
function getEventTypeColor(type: string): string {
  if (type.includes("error")) return "text-red-500"
  if (type.includes("warning")) return "text-yellow-500"
  if (type.includes("success") || type.includes("complete")) return "text-green-500"
  if (type.includes("tool")) return "text-blue-500"
  if (type.includes("text") || type.includes("message")) return "text-purple-500"
  return "text-muted-foreground"
}

// =============================================================================
// EventItem Component
// =============================================================================

interface EventItemProps {
  event: RalphEvent
}

function EventItem({ event }: EventItemProps) {
  const { type, timestamp, ...rest } = event
  const hasDetails = Object.keys(rest).length > 0

  return (
    <div className="hover:bg-muted/50 border-border group border-b px-3 py-2 transition-colors last:border-b-0">
      <div className="flex items-start gap-3">
        {/* Timestamp */}
        <span className="text-muted-foreground shrink-0 font-mono text-xs">
          {formatTimestamp(timestamp)}
        </span>

        {/* Event type badge */}
        <span
          className={cn(
            "shrink-0 rounded px-1.5 py-0.5 text-xs font-medium",
            getEventTypeColor(type),
            "bg-current/10",
          )}
        >
          {getEventTypeLabel(type)}
        </span>

        {/* Event details (if any) */}
        {hasDetails && (
          <span className="text-foreground/80 min-w-0 flex-1 truncate text-sm">
            {JSON.stringify(rest)}
          </span>
        )}
      </div>
    </div>
  )
}

// =============================================================================
// EventStream Component
// =============================================================================

/**
 * Scrollable container displaying real-time events from ralph.
 * Auto-scrolls to bottom, pauses on user interaction.
 */
export function EventStream({ className, maxEvents = 1000 }: EventStreamProps) {
  const events = useAppStore(selectEvents)
  const containerRef = useRef<HTMLDivElement>(null)
  const [autoScroll, setAutoScroll] = useState(true)
  const [isAtBottom, setIsAtBottom] = useState(true)

  // Limit displayed events
  const displayedEvents = events.slice(-maxEvents)

  // Check if user is at the bottom of the scroll container
  const checkIsAtBottom = useCallback(() => {
    const container = containerRef.current
    if (!container) return true

    const threshold = 50 // pixels from bottom to consider "at bottom"
    const scrollBottom = container.scrollHeight - container.scrollTop - container.clientHeight
    return scrollBottom <= threshold
  }, [])

  // Handle scroll events
  const handleScroll = useCallback(() => {
    const atBottom = checkIsAtBottom()
    setIsAtBottom(atBottom)

    // Re-enable auto-scroll when user scrolls to bottom
    if (atBottom && !autoScroll) {
      setAutoScroll(true)
    }
  }, [checkIsAtBottom, autoScroll])

  // Handle user interaction (wheel/touch) to detect intentional scrolling
  const handleUserScroll = useCallback(() => {
    const atBottom = checkIsAtBottom()
    // If user scrolls away from bottom, disable auto-scroll
    if (!atBottom) {
      setAutoScroll(false)
    }
  }, [checkIsAtBottom])

  // Auto-scroll to bottom when new events arrive
  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [events, autoScroll])

  // Scroll to bottom button handler
  const scrollToBottom = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
      setAutoScroll(true)
      setIsAtBottom(true)
    }
  }, [])

  return (
    <div className={cn("relative flex h-full flex-col", className)}>
      {/* Events container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        onWheel={handleUserScroll}
        onTouchMove={handleUserScroll}
        className="bg-background flex-1 overflow-y-auto"
        role="log"
        aria-label="Event stream"
        aria-live="polite"
      >
        {displayedEvents.length === 0 ?
          <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
            No events yet
          </div>
        : displayedEvents.map((event, index) => (
            <EventItem key={`${event.timestamp}-${index}`} event={event} />
          ))
        }
      </div>

      {/* Scroll to bottom button (shown when not at bottom) */}
      {!isAtBottom && (
        <button
          onClick={scrollToBottom}
          className={cn(
            "bg-primary text-primary-foreground absolute right-4 bottom-4 rounded-full p-2 shadow-lg transition-opacity hover:opacity-90",
            "flex items-center gap-1.5",
          )}
          aria-label="Scroll to latest events"
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
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
          <span className="pr-1 text-xs font-medium">Latest</span>
        </button>
      )}

      {/* Auto-scroll indicator */}
      {autoScroll && events.length > 0 && (
        <div className="text-muted-foreground absolute top-2 right-4 flex items-center gap-1 text-xs opacity-60">
          <span className="bg-primary size-1.5 animate-pulse rounded-full" />
          <span>Auto-scroll</span>
        </div>
      )}
    </div>
  )
}
