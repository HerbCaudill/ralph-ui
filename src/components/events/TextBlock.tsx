import { cn } from "@/lib/utils"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { MessageSquare } from "lucide-react"

// =============================================================================
// Types
// =============================================================================

export interface TextEvent {
  type: "text"
  timestamp: number
  /** The text content to display (may contain markdown) */
  content: string
  /** Optional role indicator */
  role?: "assistant" | "user" | "system"
}

export interface TextBlockProps {
  event: TextEvent
  className?: string
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
 * Get role-specific styling
 */
function getRoleStyles(role?: string): { color: string; bgColor: string; label: string } {
  switch (role) {
    case "user":
      return {
        color: "text-green-500",
        bgColor: "bg-green-500/10",
        label: "User",
      }
    case "system":
      return {
        color: "text-amber-500",
        bgColor: "bg-amber-500/10",
        label: "System",
      }
    case "assistant":
    default:
      return {
        color: "text-purple-500",
        bgColor: "bg-purple-500/10",
        label: "Claude",
      }
  }
}

// =============================================================================
// TextBlock Component
// =============================================================================

/**
 * Component for displaying Claude's text output with markdown rendering.
 * Supports GitHub Flavored Markdown including tables, strikethrough, and code blocks.
 */
export function TextBlock({ event, className }: TextBlockProps) {
  const roleStyles = getRoleStyles(event.role)

  return (
    <div
      className={cn("border-border hover:bg-muted/50 group border-b transition-colors", className)}
      data-testid="text-block"
    >
      {/* Header row */}
      <div className="flex items-center gap-3 px-3 py-2">
        {/* Timestamp */}
        <span className="text-muted-foreground shrink-0 font-mono text-xs">
          {formatTimestamp(event.timestamp)}
        </span>

        {/* Role badge */}
        <span
          className={cn(
            "flex shrink-0 items-center gap-1.5 rounded px-2 py-0.5 text-xs font-medium",
            roleStyles.color,
            roleStyles.bgColor,
          )}
        >
          <MessageSquare size={14} />
          <span>{roleStyles.label}</span>
        </span>
      </div>

      {/* Content */}
      <div className="px-3 pb-3">
        <div
          className={cn(
            "prose prose-sm dark:prose-invert max-w-none",
            // Code block styling
            "prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:rounded-md",
            "prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm",
            "prose-code:before:content-none prose-code:after:content-none",
            // Link styling
            "prose-a:text-primary prose-a:no-underline hover:prose-a:underline",
            // Table styling
            "prose-table:border-collapse prose-th:border prose-th:border-border prose-th:px-2 prose-th:py-1",
            "prose-td:border prose-td:border-border prose-td:px-2 prose-td:py-1",
            // List styling
            "prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5",
            // Paragraph styling
            "prose-p:my-2 prose-p:first:mt-0 prose-p:last:mb-0",
          )}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{event.content}</ReactMarkdown>
        </div>
      </div>
    </div>
  )
}
