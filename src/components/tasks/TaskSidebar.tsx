import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

// =============================================================================
// Types
// =============================================================================

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

// =============================================================================
// TaskSidebar Component
// =============================================================================

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
      {/* Header */}
      <div className="border-border flex shrink-0 items-center gap-2 border-b px-4 py-3">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-primary"
          aria-hidden="true"
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
        <h2 className="text-sm font-semibold">Tasks</h2>
      </div>

      {/* Quick Input Area */}
      {quickInput && <div className="border-border shrink-0 border-b px-4 py-3">{quickInput}</div>}

      {/* Task List Area */}
      <div className="flex-1 overflow-y-auto">
        {taskList ?? (
          <div className="text-muted-foreground flex h-full items-center justify-center p-4 text-center text-sm">
            No tasks yet
          </div>
        )}
      </div>
    </div>
  )
}
