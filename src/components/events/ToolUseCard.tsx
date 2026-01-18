import { cn } from "@/lib/utils"
import { useState, useCallback } from "react"
import { ChevronDown } from "lucide-react"

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
  input?: Record<string, unknown>
  output?: string
  status?: "pending" | "running" | "success" | "error"
  duration?: number
  error?: string
}

// Helper Functions

function getStatusColor(status?: string): string {
  switch (status) {
    case "running":
      return "bg-blue-500"
    case "success":
      return "bg-green-500"
    case "error":
      return "bg-red-500"
    case "pending":
    default:
      return "bg-amber-500"
  }
}

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

function getOutputSummary(tool: ToolName, output?: string): string | null {
  if (!output) return null

  if (tool === "Read") {
    const lines = output.split("\n").length
    return `Read ${lines} line${lines !== 1 ? "s" : ""}`
  }

  return null
}

function parseDiff(oldString: string, newString: string): DiffLine[] {
  const oldLines = oldString.split("\n")
  const newLines = newString.split("\n")
  const result: DiffLine[] = []

  // Find context around the change
  let oldIdx = 0
  let newIdx = 0

  // Simple diff: show removed lines then added lines
  // For a more sophisticated diff, we'd use a proper diff algorithm

  // Find common prefix
  while (
    oldIdx < oldLines.length &&
    newIdx < newLines.length &&
    oldLines[oldIdx] === newLines[newIdx]
  ) {
    oldIdx++
    newIdx++
  }

  // Show some context before
  const contextStart = Math.max(0, oldIdx - 1)
  for (let i = contextStart; i < oldIdx; i++) {
    result.push({ type: "context", lineOld: i + 1, lineNew: i + 1, content: oldLines[i] })
  }

  // Find common suffix
  let oldEnd = oldLines.length - 1
  let newEnd = newLines.length - 1
  while (oldEnd > oldIdx && newEnd > newIdx && oldLines[oldEnd] === newLines[newEnd]) {
    oldEnd--
    newEnd--
  }

  // Show removed lines
  for (let i = oldIdx; i <= oldEnd; i++) {
    result.push({ type: "removed", lineOld: i + 1, content: oldLines[i] })
  }

  // Show added lines
  for (let i = newIdx; i <= newEnd; i++) {
    result.push({ type: "added", lineNew: i + 1, content: newLines[i] })
  }

  // Show some context after
  const contextEnd = Math.min(oldLines.length - 1, oldEnd + 2)
  for (let i = oldEnd + 1; i <= contextEnd; i++) {
    const newLineNum = i - oldEnd + newEnd
    if (i < oldLines.length && newLineNum < newLines.length) {
      result.push({
        type: "context",
        lineOld: i + 1,
        lineNew: newLineNum + 1,
        content: oldLines[i],
      })
    }
  }

  return result
}

interface DiffLine {
  type: "context" | "added" | "removed"
  lineOld?: number
  lineNew?: number
  content: string
}

function DiffView({ oldString, newString }: { oldString: string; newString: string }) {
  const lines = parseDiff(oldString, newString)

  return (
    <div className="bg-muted/30 overflow-x-auto rounded border font-mono text-xs">
      {lines.map((line, i) => (
        <div
          key={i}
          className={cn(
            "flex",
            line.type === "added" && "bg-green-500/20",
            line.type === "removed" && "bg-red-500/20",
          )}
        >
          <span className="text-muted-foreground w-8 shrink-0 border-r px-1 text-right select-none">
            {line.lineOld ?? ""}
          </span>
          <span className="text-muted-foreground w-8 shrink-0 border-r px-1 text-right select-none">
            {line.lineNew ?? ""}
          </span>
          <span className="w-4 shrink-0 text-center select-none">
            {line.type === "added" ?
              <span className="text-green-500">+</span>
            : line.type === "removed" ?
              <span className="text-red-500">-</span>
            : ""}
          </span>
          <span className="flex-1 px-2 whitespace-pre">{line.content}</span>
        </div>
      ))}
    </div>
  )
}

function TodoList({
  todos,
  className,
}: {
  todos: Array<{ content: string; status: string }>
  className?: string
}) {
  return (
    <div className={cn("space-y-0.5", className)}>
      {todos.map((todo, i) => (
        <div key={i} className="flex items-start gap-2">
          <span
            className={cn(
              "mt-0.5 flex size-3 shrink-0 items-center justify-center rounded-xs border text-[10px]",
              todo.status === "completed" && "border-green-500 bg-green-500/20 text-green-500",
              todo.status === "in_progress" && "border-blue-500 bg-blue-500/20 text-blue-500",
              todo.status === "pending" && "border-muted-foreground",
            )}
          >
            {todo.status === "completed" && "✓"}
            {todo.status === "in_progress" && "•"}
          </span>
          <span
            className={cn(
              todo.status === "completed" && "text-muted-foreground line-through",
              todo.status === "in_progress" && "text-foreground",
              todo.status === "pending" && "text-muted-foreground",
            )}
          >
            {todo.content}
          </span>
        </div>
      ))}
    </div>
  )
}

// ToolUseCard Component

export function ToolUseCard({ event, className, defaultExpanded = false }: ToolUseCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  const summary = getToolSummary(event.tool, event.input)
  const outputSummary = getOutputSummary(event.tool, event.output)
  const statusColor = getStatusColor(event.status)

  const hasOutput = event.output || event.error
  const hasExpandableContent =
    hasOutput || (event.tool === "Edit" && event.input?.old_string && event.input?.new_string)

  const toggleExpanded = useCallback(() => {
    if (hasExpandableContent) {
      setIsExpanded(prev => !prev)
    }
  }, [hasExpandableContent])

  // Special handling for TodoWrite
  if (event.tool === "TodoWrite" && event.input?.todos && Array.isArray(event.input.todos)) {
    return (
      <div className={cn("py-1.5 pr-4 pl-4", className)}>
        <div className="flex items-center gap-2.5">
          <span className={cn("size-1.5 shrink-0 rounded-full", statusColor)} />
          <span className="text-foreground text-xs font-semibold">Update Todos</span>
        </div>
        <div className="border-muted-foreground/30 mt-1 ml-4 border-l pl-3">
          <TodoList
            todos={event.input.todos as Array<{ content: string; status: string }>}
            className="text-xs"
          />
        </div>
      </div>
    )
  }

  return (
    <div className={cn("py-1.5 pr-4 pl-4", className)}>
      {/* Main row */}
      <button
        onClick={toggleExpanded}
        disabled={!hasExpandableContent}
        className={cn(
          "flex w-full items-center gap-2.5 text-left",
          hasExpandableContent && "cursor-pointer",
          !hasExpandableContent && "cursor-default",
        )}
        aria-expanded={isExpanded}
      >
        {/* Status indicator */}
        <span
          className={cn("size-1.5 shrink-0 rounded-full", statusColor)}
          aria-label={event.status ?? "pending"}
        />

        {/* Content */}
        <div className="flex min-w-0 flex-1 items-baseline gap-2">
          {/* Tool name */}
          <span className="text-foreground shrink-0 text-xs font-semibold">{event.tool}</span>

          {/* Summary (file path, command, etc.) */}
          {summary && (
            <span className="text-foreground/80 min-w-0 flex-1 truncate font-mono text-xs">
              {summary}
            </span>
          )}

          {/* Expand indicator */}
          {hasExpandableContent && (
            <ChevronDown
              size={14}
              className={cn(
                "text-muted-foreground shrink-0 transition-transform",
                isExpanded && "rotate-180",
              )}
            />
          )}
        </div>
      </button>

      {/* Expanded output */}
      {isExpanded && hasExpandableContent && (
        <div className="border-muted-foreground/30 mt-1 ml-1 border-l pl-3">
          <div className="text-muted-foreground flex items-start gap-1 text-xs">
            <span>└</span>
            <div className="flex-1">
              {/* Edit tool: show diff */}
              {event.tool === "Edit" &&
                event.input?.old_string &&
                event.input?.new_string &&
                typeof event.input.old_string === "string" &&
                typeof event.input.new_string === "string" && (
                  <DiffView oldString={event.input.old_string} newString={event.input.new_string} />
                )}

              {/* Output summary for Read */}
              {outputSummary && <span>{outputSummary}</span>}

              {/* Bash output */}
              {event.tool === "Bash" && event.output && (
                <pre className="bg-muted/30 text-foreground/80 mt-1 max-h-48 overflow-auto rounded border p-2 font-mono text-xs whitespace-pre-wrap">
                  {event.output.length > 500 ?
                    <>
                      {event.output.slice(0, 200)}
                      {"\n"}
                      <span className="text-muted-foreground">
                        ... +{event.output.split("\n").length - 4} lines
                      </span>
                    </>
                  : event.output}
                </pre>
              )}

              {/* Error */}
              {event.error && <span className="text-red-500">{event.error}</span>}
            </div>
          </div>
        </div>
      )}

      {/* Non-expanded output summary */}
      {!isExpanded && outputSummary && (
        <div className="border-muted-foreground/30 mt-1 ml-1 border-l pl-3">
          <span className="text-muted-foreground text-xs">└ {outputSummary}</span>
        </div>
      )}
    </div>
  )
}

export type ToolUseCardProps = {
  event: ToolUseEvent
  className?: string
  defaultExpanded?: boolean
}
