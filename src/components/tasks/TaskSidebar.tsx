import { cn } from "@/lib/utils"
import type { ReactNode } from "react"
import { TaskProgressBar } from "./TaskProgressBar"

// Types

export interface TaskSidebarProps {
  /**
   * Quick task input component (rendered at top).
   */
  quickInput?: ReactNode

  /**
   * Task list component (rendered below input).
   */
  taskList?: ReactNode

  /**
   * Additional CSS classes.
   */
  className?: string
}

// TaskSidebar Component

/**
 * Sidebar container for task management.
 * Contains quick task input at top and task list below.
 */
export function TaskSidebar({ quickInput, taskList, className }: TaskSidebarProps) {
  return (
    <div
      className={cn("flex h-full flex-col", className)}
      role="complementary"
      aria-label="Task sidebar"
    >
      {/* Quick Input Area */}
      {quickInput && <div className="border-border shrink-0 border-b px-4 py-3">{quickInput}</div>}

      {/* Task List Area */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {taskList ?? (
          <div className="text-muted-foreground flex h-full items-center justify-center p-4 text-center text-sm">
            No tasks yet
          </div>
        )}
      </div>

      {/* Task Progress Bar */}
      <TaskProgressBar />
    </div>
  )
}
