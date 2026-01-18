import { cn } from "@/lib/utils"
import { useState, useCallback, useMemo } from "react"
import { ChevronDown } from "lucide-react"
import { TaskCard, type TaskCardTask, type TaskStatus } from "./TaskCard"

// =============================================================================
// Types
// =============================================================================

/** Task status groups for display in the task list. */
export type TaskGroup = "ready" | "in_progress" | "blocked" | "other"

export interface TaskListProps {
  /** Tasks to display in the list */
  tasks: TaskCardTask[]
  /** Additional CSS classes */
  className?: string
  /** Callback when a task's status is changed */
  onStatusChange?: (id: string, status: TaskStatus) => void
  /** Callback when a task is clicked */
  onTaskClick?: (id: string) => void
  /** Initial collapsed state for groups (default: all expanded) */
  defaultCollapsed?: Partial<Record<TaskGroup, boolean>>
  /** Whether to show empty groups (default: false) */
  showEmptyGroups?: boolean
}

// =============================================================================
// Group Configuration
// =============================================================================

interface GroupConfig {
  key: TaskGroup
  label: string
  statusFilter: (status: TaskStatus) => boolean
}

const groupConfigs: GroupConfig[] = [
  {
    key: "ready",
    label: "Ready",
    statusFilter: status => status === "open",
  },
  {
    key: "in_progress",
    label: "In Progress",
    statusFilter: status => status === "in_progress",
  },
  {
    key: "blocked",
    label: "Blocked",
    statusFilter: status => status === "blocked",
  },
  {
    key: "other",
    label: "Other",
    statusFilter: status => status === "deferred" || status === "closed",
  },
]

// =============================================================================
// TaskGroupHeader Component
// =============================================================================

interface TaskGroupHeaderProps {
  label: string
  count: number
  isCollapsed: boolean
  onToggle: () => void
}

function TaskGroupHeader({ label, count, isCollapsed, onToggle }: TaskGroupHeaderProps) {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault()
        onToggle()
      }
    },
    [onToggle],
  )

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={handleKeyDown}
      className={cn(
        "bg-muted/50 hover:bg-muted border-border flex cursor-pointer items-center gap-2 border-b px-3 py-2",
        "transition-colors",
      )}
      aria-expanded={!isCollapsed}
      aria-label={`${label} section, ${count} task${count === 1 ? "" : "s"}`}
    >
      <ChevronDown
        size={14}
        className={cn(
          "text-muted-foreground shrink-0 transition-transform",
          isCollapsed && "-rotate-90",
        )}
      />
      <span className="text-sm font-medium">{label}</span>
      <span className="text-muted-foreground bg-muted rounded px-1.5 py-0.5 text-xs">{count}</span>
    </div>
  )
}

// =============================================================================
// TaskList Component
// =============================================================================

/**
 * List component for displaying tasks grouped by status.
 * Groups: Ready (open), In Progress, Blocked, Other (deferred/closed).
 * Each group is collapsible with task count.
 */
export function TaskList({
  tasks,
  className,
  onStatusChange,
  onTaskClick,
  defaultCollapsed = {},
  showEmptyGroups = false,
}: TaskListProps) {
  const [collapsedState, setCollapsedState] = useState<Record<TaskGroup, boolean>>({
    ready: defaultCollapsed.ready ?? false,
    in_progress: defaultCollapsed.in_progress ?? false,
    blocked: defaultCollapsed.blocked ?? false,
    other: defaultCollapsed.other ?? true, // Default collapsed for other/completed
  })

  const toggleGroup = useCallback((group: TaskGroup) => {
    setCollapsedState(prev => ({
      ...prev,
      [group]: !prev[group],
    }))
  }, [])

  // Group tasks by status
  const groupedTasks = useMemo(() => {
    const groups: Record<TaskGroup, TaskCardTask[]> = {
      ready: [],
      in_progress: [],
      blocked: [],
      other: [],
    }

    for (const task of tasks) {
      const config = groupConfigs.find(g => g.statusFilter(task.status))
      if (config) {
        groups[config.key].push(task)
      }
    }

    // Sort tasks within each group by priority (lower number = higher priority)
    for (const group of Object.keys(groups) as TaskGroup[]) {
      groups[group].sort((a, b) => (a.priority ?? 4) - (b.priority ?? 4))
    }

    return groups
  }, [tasks])

  // Filter to only non-empty groups (or all if showEmptyGroups is true)
  const visibleGroups = useMemo(() => {
    return groupConfigs.filter(config => {
      const count = groupedTasks[config.key].length
      return showEmptyGroups || count > 0
    })
  }, [groupedTasks, showEmptyGroups])

  if (tasks.length === 0 && !showEmptyGroups) {
    return (
      <div
        className={cn(
          "text-muted-foreground flex h-full items-center justify-center p-4 text-center text-sm",
          className,
        )}
        role="status"
        aria-label="No tasks"
      >
        No tasks
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col", className)} role="list" aria-label="Task list">
      {visibleGroups.map(config => {
        const groupTasks = groupedTasks[config.key]
        const isCollapsed = collapsedState[config.key]

        return (
          <div key={config.key} role="listitem" aria-label={`${config.label} group`}>
            <TaskGroupHeader
              label={config.label}
              count={groupTasks.length}
              isCollapsed={isCollapsed}
              onToggle={() => toggleGroup(config.key)}
            />
            {!isCollapsed && (
              <div role="group" aria-label={`${config.label} tasks`}>
                {groupTasks.length > 0 ?
                  groupTasks.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onStatusChange={onStatusChange}
                      onClick={onTaskClick}
                    />
                  ))
                : <div className="text-muted-foreground px-3 py-3 text-center text-xs italic">
                    No tasks in this group
                  </div>
                }
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
