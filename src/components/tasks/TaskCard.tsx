import { cn } from "@/lib/utils"
import { useState, useCallback } from "react"
import {
  IconCircle,
  IconCircleDot,
  IconCircleCheck,
  IconBan,
  IconClock,
  type TablerIcon,
} from "@tabler/icons-react"

// Types

export type TaskStatus = "open" | "in_progress" | "blocked" | "deferred" | "closed"

export interface TaskCardTask {
  /** Unique task ID (e.g., "rui-4rt.5") */
  id: string
  /** Task title */
  title: string
  /** Optional description */
  description?: string
  /** Task status */
  status: TaskStatus
  /** Priority (0 = highest, 4 = lowest) */
  priority?: number
  /** Issue type (e.g., "task", "bug", "epic") */
  issue_type?: string
  /** Parent issue ID */
  parent?: string
  /** Timestamp when task was closed */
  closed_at?: string
}

export interface TaskCardProps {
  /** The task to display */
  task: TaskCardTask
  /** Additional CSS classes */
  className?: string
  /** Whether to show expanded details by default */
  defaultExpanded?: boolean
  /** Callback when status is changed */
  onStatusChange?: (id: string, status: TaskStatus) => void
  /** Callback when task is clicked */
  onClick?: (id: string) => void
}

// Status Configuration

interface StatusConfig {
  icon: TablerIcon
  label: string
  color: string
  bgColor: string
}

const statusConfig: Record<TaskStatus, StatusConfig> = {
  open: {
    icon: IconCircle,
    label: "Open",
    color: "text-gray-500",
    bgColor: "bg-gray-500/10",
  },
  in_progress: {
    icon: IconCircleDot,
    label: "In Progress",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  blocked: {
    icon: IconBan,
    label: "Blocked",
    color: "text-red-500",
    bgColor: "bg-red-500/10",
  },
  deferred: {
    icon: IconClock,
    label: "Deferred",
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
  closed: {
    icon: IconCircleCheck,
    label: "Closed",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
}

// Available Statuses for Transition

const availableStatuses: TaskStatus[] = ["open", "in_progress", "blocked", "deferred", "closed"]

// TaskCard Component

/**
 * Card component for displaying an individual task.
 * Shows task ID, title, status with expandable details.
 * Supports inline status changes via dropdown.
 */
export function TaskCard({
  task,
  className,
  defaultExpanded = false,
  onStatusChange,
  onClick,
}: TaskCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false)

  const config = statusConfig[task.status]
  const StatusIcon = config.icon

  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev)
  }, [])

  const handleClick = useCallback(() => {
    onClick?.(task.id)
    toggleExpanded()
  }, [onClick, task.id, toggleExpanded])

  const handleStatusClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      if (onStatusChange) {
        setIsStatusMenuOpen(prev => !prev)
      }
    },
    [onStatusChange],
  )

  const handleStatusSelect = useCallback(
    (status: TaskStatus) => {
      onStatusChange?.(task.id, status)
      setIsStatusMenuOpen(false)
    },
    [onStatusChange, task.id],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault()
        handleClick()
      }
    },
    [handleClick],
  )

  const hasDetails = task.description || task.parent || task.issue_type

  return (
    <div
      className={cn(
        "border-border hover:bg-muted/50 group border-b transition-colors",
        task.status === "closed" && "opacity-60",
        className,
      )}
    >
      {/* Main row */}
      <div className="flex w-full items-center gap-2 px-3 py-2">
        {/* Status indicator button */}
        <button
          type="button"
          onClick={handleStatusClick}
          className={cn(
            "relative shrink-0 rounded p-0.5 transition-colors",
            onStatusChange && "hover:bg-muted cursor-pointer",
            !onStatusChange && "cursor-default",
          )}
          aria-label={`Status: ${config.label}${onStatusChange ? ". Click to change." : ""}`}
          aria-haspopup={onStatusChange ? "listbox" : undefined}
          aria-expanded={isStatusMenuOpen}
        >
          <StatusIcon className={cn("size-4", config.color)} />

          {/* Status dropdown menu */}
          {isStatusMenuOpen && (
            <div
              className="bg-popover border-border absolute top-full left-0 z-10 mt-1 min-w-32 rounded-md border py-1 shadow-lg"
              role="listbox"
              aria-label="Select status"
            >
              {availableStatuses.map(status => {
                const sc = statusConfig[status]
                const Icon = sc.icon
                return (
                  <div
                    key={status}
                    role="option"
                    tabIndex={0}
                    aria-selected={status === task.status}
                    onClick={e => {
                      e.stopPropagation()
                      handleStatusSelect(status)
                    }}
                    onKeyDown={e => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        e.stopPropagation()
                        handleStatusSelect(status)
                      }
                    }}
                    className={cn(
                      "hover:bg-muted flex w-full cursor-pointer items-center gap-2 px-3 py-1.5 text-left text-sm",
                      status === task.status && "bg-muted",
                    )}
                  >
                    <Icon className={cn("size-3.5", sc.color)} />
                    <span>{sc.label}</span>
                  </div>
                )
              })}
            </div>
          )}
        </button>

        {/* Clickable content area */}
        <div
          role="button"
          tabIndex={0}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-2"
          aria-expanded={isExpanded}
          aria-label={task.title}
        >
          {/* Title */}
          <span
            className={cn(
              "min-w-0 flex-1 truncate text-sm",
              task.status === "closed" && "line-through",
            )}
          >
            {task.title}
          </span>
        </div>
      </div>

      {/* Expanded details */}
      {isExpanded && hasDetails && (
        <div className="bg-muted/30 border-border border-t px-3 py-2">
          {/* Type and parent info */}
          {(task.issue_type || task.parent) && (
            <div className="text-muted-foreground mb-2 flex flex-wrap gap-2 text-xs">
              {task.issue_type && (
                <span className="bg-muted rounded px-1.5 py-0.5 capitalize">{task.issue_type}</span>
              )}
              {task.parent && (
                <span className="bg-muted rounded px-1.5 py-0.5">Parent: {task.parent}</span>
              )}
            </div>
          )}

          {/* Description */}
          {task.description && (
            <p className="text-foreground/80 text-sm whitespace-pre-wrap">{task.description}</p>
          )}
        </div>
      )}
    </div>
  )
}
