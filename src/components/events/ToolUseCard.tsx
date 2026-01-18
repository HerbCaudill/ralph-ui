import { cn } from "@/lib/utils"
import {
  FileText,
  Pencil,
  FilePlus,
  Terminal,
  Search,
  FolderSearch,
  Globe,
  Link,
  ListTodo,
  Cog,
  type LucideIcon,
} from "lucide-react"
import { useState, useCallback } from "react"

// Types

export type ToolName =
  | "Read"
  | "Edit"
  | "Write"
  | "Bash"
  | "Grep"
  | "Glob"
  | "WebSearch"
  | "WebFetch"
  | "TodoWrite"
  | "Task"

export interface ToolUseEvent {
  type: "tool_use"
  timestamp: number
  tool: ToolName
  /** Input parameters for the tool */
  input?: Record<string, unknown>
  /** Output/result from the tool (when completed) */
  output?: string
  /** Status of the tool use */
  status?: "pending" | "running" | "success" | "error"
  /** Duration in milliseconds (when completed) */
  duration?: number
  /** Error message (when status is error) */
  error?: string
}

export interface ToolUseCardProps {
  event: ToolUseEvent
  className?: string
  /** Whether to show expanded details by default */
  defaultExpanded?: boolean
}

// Tool Configuration

interface ToolConfig {
  icon: LucideIcon
  label: string
  color: string
  bgColor: string
}

const toolConfig: Record<ToolName, ToolConfig> = {
  Read: {
    icon: FileText,
    label: "Read",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  Edit: {
    icon: Pencil,
    label: "Edit",
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
  Write: {
    icon: FilePlus,
    label: "Write",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  Bash: {
    icon: Terminal,
    label: "Bash",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  Grep: {
    icon: Search,
    label: "Grep",
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10",
  },
  Glob: {
    icon: FolderSearch,
    label: "Glob",
    color: "text-teal-500",
    bgColor: "bg-teal-500/10",
  },
  WebSearch: {
    icon: Globe,
    label: "Web Search",
    color: "text-indigo-500",
    bgColor: "bg-indigo-500/10",
  },
  WebFetch: {
    icon: Link,
    label: "Web Fetch",
    color: "text-pink-500",
    bgColor: "bg-pink-500/10",
  },
  TodoWrite: {
    icon: ListTodo,
    label: "Todo",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
  Task: {
    icon: Cog,
    label: "Task",
    color: "text-rose-500",
    bgColor: "bg-rose-500/10",
  },
}

// Helper Functions

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
 * Formats a duration in milliseconds to a human-readable string
 */
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  return `${minutes}m ${seconds}s`
}

/**
 * Get a summary of the tool input for display
 */
function getToolSummary(tool: ToolName, input?: Record<string, unknown>): string {
  if (!input) return ""

  switch (tool) {
    case "Read":
      return input.file_path ? String(input.file_path) : ""
    case "Edit":
      return input.file_path ? String(input.file_path) : ""
    case "Write":
      return input.file_path ? String(input.file_path) : ""
    case "Bash":
      return input.command ? String(input.command) : ""
    case "Grep":
      return input.pattern ? String(input.pattern) : ""
    case "Glob":
      return input.pattern ? String(input.pattern) : ""
    case "WebSearch":
      return input.query ? String(input.query) : ""
    case "WebFetch":
      return input.url ? String(input.url) : ""
    case "TodoWrite":
      if (Array.isArray(input.todos)) {
        return `${input.todos.length} todo(s)`
      }
      return ""
    case "Task":
      return input.description ? String(input.description) : ""
    default:
      return ""
  }
}

/**
 * Get status indicator styles
 */
function getStatusStyles(status?: string): { indicator: string; pulse: boolean } {
  switch (status) {
    case "running":
      return { indicator: "bg-blue-500", pulse: true }
    case "success":
      return { indicator: "bg-green-500", pulse: false }
    case "error":
      return { indicator: "bg-red-500", pulse: false }
    case "pending":
    default:
      return { indicator: "bg-gray-400", pulse: false }
  }
}

// ToolUseCard Component

/**
 * Card component for displaying tool use events.
 * Shows tool icon, name, summary, and expandable details.
 */
export function ToolUseCard({ event, className, defaultExpanded = false }: ToolUseCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  const config = toolConfig[event.tool] ?? {
    icon: Cog,
    label: event.tool,
    color: "text-gray-500",
    bgColor: "bg-gray-500/10",
  }

  const Icon = config.icon
  const summary = getToolSummary(event.tool, event.input)
  const statusStyles = getStatusStyles(event.status)

  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev)
  }, [])

  const hasDetails = event.input || event.output || event.error

  return (
    <div
      className={cn("border-border hover:bg-muted/50 group border-b transition-colors", className)}
    >
      {/* Main row */}
      <button
        onClick={toggleExpanded}
        disabled={!hasDetails}
        className={cn(
          "flex w-full items-center gap-3 px-3 py-2 text-left",
          hasDetails && "cursor-pointer",
          !hasDetails && "cursor-default",
        )}
        aria-expanded={isExpanded}
      >
        {/* Status indicator */}
        <span
          className={cn(
            "size-2 shrink-0 rounded-full",
            statusStyles.indicator,
            statusStyles.pulse && "animate-pulse",
          )}
          aria-label={event.status ?? "pending"}
        />

        {/* Timestamp */}
        <span className="text-muted-foreground shrink-0 font-mono text-xs">
          {formatTimestamp(event.timestamp)}
        </span>

        {/* Tool icon and name */}
        <span
          className={cn(
            "flex shrink-0 items-center gap-1.5 rounded px-2 py-0.5 text-xs font-medium",
            config.color,
            config.bgColor,
          )}
        >
          <Icon size={14} />
          <span>{config.label}</span>
        </span>

        {/* Summary */}
        {summary && (
          <span className="text-foreground/80 min-w-0 flex-1 truncate font-mono text-sm">
            {summary}
          </span>
        )}

        {/* Duration */}
        {event.duration !== undefined && (
          <span className="text-muted-foreground shrink-0 text-xs">
            {formatDuration(event.duration)}
          </span>
        )}

        {/* Expand indicator */}
        {hasDetails && (
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
            className={cn(
              "text-muted-foreground shrink-0 transition-transform",
              isExpanded && "rotate-180",
            )}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        )}
      </button>

      {/* Expanded details */}
      {isExpanded && hasDetails && (
        <div className="bg-muted/30 border-border border-t px-3 py-2">
          {/* Input */}
          {event.input && (
            <div className="mb-2">
              <span className="text-muted-foreground mb-1 block text-xs font-medium uppercase">
                Input
              </span>
              <pre className="bg-background overflow-x-auto rounded p-2 font-mono text-xs">
                {JSON.stringify(event.input, null, 2)}
              </pre>
            </div>
          )}

          {/* Output */}
          {event.output && (
            <div className="mb-2">
              <span className="text-muted-foreground mb-1 block text-xs font-medium uppercase">
                Output
              </span>
              <pre className="bg-background max-h-48 overflow-auto rounded p-2 font-mono text-xs whitespace-pre-wrap">
                {event.output}
              </pre>
            </div>
          )}

          {/* Error */}
          {event.error && (
            <div>
              <span className="mb-1 block text-xs font-medium text-red-500 uppercase">Error</span>
              <pre className="max-h-32 overflow-auto rounded bg-red-500/10 p-2 font-mono text-xs whitespace-pre-wrap text-red-500">
                {event.error}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
