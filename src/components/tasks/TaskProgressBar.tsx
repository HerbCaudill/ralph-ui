import { cn } from "@/lib/utils"
import { useAppStore, selectTasks, selectInitialTaskCount, selectRalphStatus } from "@/store"

// Types

export interface TaskProgressBarProps {
  /**
   * Additional CSS classes.
   */
  className?: string
}

// TaskProgressBar Component

/**
 * Shows task completion progress at the bottom of the sidebar.
 * Displays a progress bar with closed tasks / total tasks.
 * Total = initial tasks when Ralph started + any new tasks added since.
 * Only visible when Ralph is running.
 */
export function TaskProgressBar({ className }: TaskProgressBarProps) {
  const tasks = useAppStore(selectTasks)
  const initialTaskCount = useAppStore(selectInitialTaskCount)
  const ralphStatus = useAppStore(selectRalphStatus)

  // Only show when Ralph is running (or transitioning) and we have initial count
  const isRunning =
    ralphStatus === "running" ||
    ralphStatus === "paused" ||
    ralphStatus === "stopping_after_current"
  if (!isRunning || initialTaskCount === null) return null

  // Calculate progress
  // Total = max of (initial count, current count) to account for added tasks
  const currentTaskCount = tasks.length
  const totalTasks = Math.max(initialTaskCount, currentTaskCount)
  const closedTasks = tasks.filter(t => t.status === "closed").length

  // Don't show if there are no tasks
  if (totalTasks === 0) return null

  const progress = (closedTasks / totalTasks) * 100

  return (
    <div
      className={cn("border-border border-t px-4 py-3", className)}
      role="progressbar"
      aria-valuenow={closedTasks}
      aria-valuemin={0}
      aria-valuemax={totalTasks}
      aria-label="Task completion progress"
      data-testid="task-progress-bar"
    >
      <div className="flex items-center gap-3">
        {/* Progress bar */}
        <div className="bg-muted h-1.5 flex-1 overflow-hidden rounded-full">
          <div
            className="bg-primary h-full transition-all duration-300"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        {/* Count */}
        <span className="text-muted-foreground shrink-0 text-xs">
          {closedTasks}/{totalTasks}
        </span>
      </div>
    </div>
  )
}
