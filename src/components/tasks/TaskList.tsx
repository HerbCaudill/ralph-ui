import { cn } from "@/lib/utils"
import { useState, useCallback, useMemo, useEffect } from "react"
import { ChevronDown, Layers } from "lucide-react"
import { TaskCard, type TaskCardTask, type TaskStatus } from "./TaskCard"

// Constants

const STATUS_STORAGE_KEY = "ralph-ui-task-list-collapsed-state"
const EPIC_STORAGE_KEY = "ralph-ui-task-list-epic-collapsed-state"

// Types

/** Task status groups for display in the task list. */
export type TaskGroup = "blocked" | "ready" | "in_progress" | "closed"

export interface TaskListProps {
  /** Tasks to display in the list */
  tasks: TaskCardTask[]
  /** Additional CSS classes */
  className?: string
  /** Callback when a task's status is changed */
  onStatusChange?: (id: string, status: TaskStatus) => void
  /** Callback when a task is clicked */
  onTaskClick?: (id: string) => void
  /** Initial collapsed state for groups (overrides localStorage and defaults) */
  defaultCollapsed?: Partial<Record<TaskGroup, boolean>>
  /** Whether to show empty groups (default: false) */
  showEmptyGroups?: boolean
  /** Whether to persist collapsed state to localStorage (default: true) */
  persistCollapsedState?: boolean
}

// Group Configuration

interface GroupConfig {
  key: TaskGroup
  label: string
  statusFilter: (status: TaskStatus) => boolean
}

const groupConfigs: GroupConfig[] = [
  {
    key: "blocked",
    label: "Blocked",
    statusFilter: status => status === "blocked",
  },
  {
    key: "ready",
    label: "Ready",
    statusFilter: status => status === "open",
  },
  {
    key: "in_progress",
    label: "In progress",
    statusFilter: status => status === "in_progress",
  },
  {
    key: "closed",
    label: "Closed",
    statusFilter: status => status === "deferred" || status === "closed",
  },
]

// TaskGroupHeader Component

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

// EpicGroupHeader Component

interface EpicGroupHeaderProps {
  epicId: string
  epicTitle: string
  taskCount: number
  isCollapsed: boolean
  onToggle: () => void
}

function EpicGroupHeader({
  epicId,
  epicTitle,
  taskCount,
  isCollapsed,
  onToggle,
}: EpicGroupHeaderProps) {
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
        "bg-muted/30 hover:bg-muted/50 border-border flex cursor-pointer items-center gap-2 border-b px-3 py-2",
        "transition-colors",
      )}
      aria-expanded={!isCollapsed}
      aria-label={`${epicTitle} epic, ${taskCount} task${taskCount === 1 ? "" : "s"}`}
    >
      <ChevronDown
        size={14}
        className={cn(
          "text-muted-foreground shrink-0 transition-transform",
          isCollapsed && "-rotate-90",
        )}
      />
      <Layers size={14} className="text-primary shrink-0" />
      <span className="text-muted-foreground shrink-0 font-mono text-xs">{epicId}</span>
      <span className="min-w-0 flex-1 truncate text-sm font-medium">{epicTitle}</span>
      <span className="text-muted-foreground bg-muted shrink-0 rounded px-1.5 py-0.5 text-xs">
        {taskCount}
      </span>
    </div>
  )
}

// TaskList Component

/**
 * List component for displaying tasks grouped by epic and status.
 * - First groups tasks by their parent epic
 * - Tasks without an epic are shown as a flat list at the bottom
 * - Within each group, tasks are grouped by status (Ready, In Progress, Blocked, Other)
 * - Each epic is collapsible independently
 * - Status groups are also collapsible
 */

// Default collapsed state: Ready + In Progress expanded, Blocked + Closed collapsed
const DEFAULT_STATUS_COLLAPSED_STATE: Record<TaskGroup, boolean> = {
  blocked: true, // Collapsed by default
  ready: false,
  in_progress: false,
  closed: true, // Collapsed by default
}

/** Load status collapsed state from localStorage */
function loadStatusCollapsedState(): Record<TaskGroup, boolean> | null {
  if (typeof window === "undefined") return null
  try {
    const stored = localStorage.getItem(STATUS_STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored) as Record<TaskGroup, boolean>
    }
  } catch {
    // Ignore parse errors
  }
  return null
}

/** Save status collapsed state to localStorage */
function saveStatusCollapsedState(state: Record<TaskGroup, boolean>): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STATUS_STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Ignore storage errors
  }
}

/** Load epic collapsed state from localStorage */
function loadEpicCollapsedState(): Record<string, boolean> | null {
  if (typeof window === "undefined") return null
  try {
    const stored = localStorage.getItem(EPIC_STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored) as Record<string, boolean>
    }
  } catch {
    // Ignore parse errors
  }
  return null
}

/** Save epic collapsed state to localStorage */
function saveEpicCollapsedState(state: Record<string, boolean>): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(EPIC_STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Ignore storage errors
  }
}

/** Structure for an epic group with its tasks */
interface EpicGroup {
  epic: TaskCardTask
  tasks: TaskCardTask[]
}

export function TaskList({
  tasks,
  className,
  onStatusChange,
  onTaskClick,
  defaultCollapsed = {},
  showEmptyGroups = false,
  persistCollapsedState = true,
}: TaskListProps) {
  // Initialize status collapsed state: props override -> localStorage -> defaults
  const [statusCollapsedState, setStatusCollapsedState] = useState<Record<TaskGroup, boolean>>(
    () => {
      const stored = persistCollapsedState ? loadStatusCollapsedState() : null
      const base = stored ?? DEFAULT_STATUS_COLLAPSED_STATE
      return {
        blocked: defaultCollapsed.blocked ?? base.blocked,
        ready: defaultCollapsed.ready ?? base.ready,
        in_progress: defaultCollapsed.in_progress ?? base.in_progress,
        closed: defaultCollapsed.closed ?? base.closed,
      }
    },
  )

  // Initialize epic collapsed state from localStorage
  const [epicCollapsedState, setEpicCollapsedState] = useState<Record<string, boolean>>(() => {
    return persistCollapsedState ? (loadEpicCollapsedState() ?? {}) : {}
  })

  // Persist status collapsed state to localStorage when it changes
  useEffect(() => {
    if (persistCollapsedState) {
      saveStatusCollapsedState(statusCollapsedState)
    }
  }, [statusCollapsedState, persistCollapsedState])

  // Persist epic collapsed state to localStorage when it changes
  useEffect(() => {
    if (persistCollapsedState) {
      saveEpicCollapsedState(epicCollapsedState)
    }
  }, [epicCollapsedState, persistCollapsedState])

  const toggleStatusGroup = useCallback((group: TaskGroup) => {
    setStatusCollapsedState(prev => ({
      ...prev,
      [group]: !prev[group],
    }))
  }, [])

  const toggleEpicGroup = useCallback((epicId: string) => {
    setEpicCollapsedState(prev => ({
      ...prev,
      [epicId]: !prev[epicId],
    }))
  }, [])

  // Group tasks by epic and status
  const { epicGroups, ungroupedTasks } = useMemo(() => {
    // First, identify all epics and create a map
    const epicMap = new Map<string, TaskCardTask>()
    const childTasksByEpic = new Map<string, TaskCardTask[]>()

    for (const task of tasks) {
      if (task.issue_type === "epic") {
        epicMap.set(task.id, task)
        if (!childTasksByEpic.has(task.id)) {
          childTasksByEpic.set(task.id, [])
        }
      }
    }

    // Group child tasks by their parent epic
    const ungrouped: TaskCardTask[] = []
    for (const task of tasks) {
      if (task.issue_type === "epic") continue // Don't add epics as tasks

      if (task.parent && epicMap.has(task.parent)) {
        const children = childTasksByEpic.get(task.parent) ?? []
        children.push(task)
        childTasksByEpic.set(task.parent, children)
      } else {
        ungrouped.push(task)
      }
    }

    // Build epic groups, sorted by epic priority
    const epics = Array.from(epicMap.values()).sort((a, b) => (a.priority ?? 4) - (b.priority ?? 4))

    const groups: EpicGroup[] = epics.map(epic => ({
      epic,
      tasks: (childTasksByEpic.get(epic.id) ?? []).sort(
        (a, b) => (a.priority ?? 4) - (b.priority ?? 4),
      ),
    }))

    // Sort ungrouped tasks by priority
    ungrouped.sort((a, b) => (a.priority ?? 4) - (b.priority ?? 4))

    return { epicGroups: groups, ungroupedTasks: ungrouped }
  }, [tasks])

  // Group ungrouped tasks by status
  const groupedUngroupedTasks = useMemo(() => {
    const groups: Record<TaskGroup, TaskCardTask[]> = {
      blocked: [],
      ready: [],
      in_progress: [],
      closed: [],
    }

    for (const task of ungroupedTasks) {
      const config = groupConfigs.find(g => g.statusFilter(task.status))
      if (config) {
        groups[config.key].push(task)
      }
    }

    return groups
  }, [ungroupedTasks])

  // Filter to only non-empty status groups (or all if showEmptyGroups is true)
  const visibleStatusGroups = useMemo(() => {
    return groupConfigs.filter(config => {
      const count = groupedUngroupedTasks[config.key].length
      return showEmptyGroups || count > 0
    })
  }, [groupedUngroupedTasks, showEmptyGroups])

  // Check if we have any content to show
  const hasEpics = epicGroups.length > 0
  const hasUngroupedTasks = ungroupedTasks.length > 0

  if (!hasEpics && !hasUngroupedTasks && !showEmptyGroups) {
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
      {/* Epic groups */}
      {epicGroups.map(({ epic, tasks: epicTasks }) => {
        const isCollapsed = epicCollapsedState[epic.id] ?? false

        return (
          <div key={epic.id} role="listitem" aria-label={`${epic.title} epic group`}>
            <EpicGroupHeader
              epicId={epic.id}
              epicTitle={epic.title}
              taskCount={epicTasks.length}
              isCollapsed={isCollapsed}
              onToggle={() => toggleEpicGroup(epic.id)}
            />
            {!isCollapsed && (
              <div role="group" aria-label={`${epic.title} tasks`}>
                {epicTasks.length > 0 ?
                  epicTasks.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onStatusChange={onStatusChange}
                      onClick={onTaskClick}
                      className="pl-6"
                    />
                  ))
                : <div className="text-muted-foreground px-3 py-3 pl-6 text-center text-xs italic">
                    No tasks in this epic
                  </div>
                }
              </div>
            )}
          </div>
        )
      })}

      {/* Ungrouped tasks by status */}
      {(hasUngroupedTasks || showEmptyGroups) &&
        visibleStatusGroups.map(config => {
          const groupTasks = groupedUngroupedTasks[config.key]
          const isCollapsed = statusCollapsedState[config.key]

          return (
            <div key={config.key} role="listitem" aria-label={`${config.label} group`}>
              <TaskGroupHeader
                label={config.label}
                count={groupTasks.length}
                isCollapsed={isCollapsed}
                onToggle={() => toggleStatusGroup(config.key)}
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
