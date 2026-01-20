import { useTaskDialogContext } from "@/contexts"
import type { ReactNode, MouseEvent } from "react"

// Task ID pattern: prefix-alphanumeric with optional decimal suffix (e.g., rui-48s, proj-abc123, rui-4vp.5)
// The prefix is typically lowercase letters, the suffix is lowercase alphanumeric
// Optionally followed by a decimal point and digits for sub-task notation
const TASK_ID_PATTERN = /\b([a-z]+-[a-z0-9]+(?:\.\d+)?)\b/g

// Types

export interface TaskIdLinkProps {
  /** Text content that may contain task IDs */
  children: string
  /** Additional class name for task ID links */
  className?: string
}

// TaskIdLink Component

/**
 * Renders text with task IDs converted to clickable links.
 * Task IDs matching the pattern (e.g., rui-48s) become links that open
 * the task details dialog when clicked.
 */
export function TaskIdLink({ children, className }: TaskIdLinkProps) {
  const taskDialogContext = useTaskDialogContext()

  // If no task dialog context is available, just render the text
  if (!taskDialogContext) {
    return <>{children}</>
  }

  const { openTaskById } = taskDialogContext

  // Parse the text and replace task IDs with links
  const parts: ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  // Reset the regex state
  TASK_ID_PATTERN.lastIndex = 0

  while ((match = TASK_ID_PATTERN.exec(children)) !== null) {
    const taskId = match[1]
    const startIndex = match.index

    // Add text before the match
    if (startIndex > lastIndex) {
      parts.push(children.slice(lastIndex, startIndex))
    }

    // Add the clickable task ID link
    const handleClick = (e: MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      openTaskById(taskId)
    }

    parts.push(
      <button
        key={`${taskId}-${startIndex}`}
        onClick={handleClick}
        className={
          className ??
          "cursor-pointer text-cyan-600 hover:text-cyan-700 hover:underline dark:text-cyan-400 dark:hover:text-cyan-300"
        }
        type="button"
        aria-label={`View task ${taskId}`}
      >
        {taskId}
      </button>,
    )

    lastIndex = startIndex + match[0].length
  }

  // Add remaining text after the last match
  if (lastIndex < children.length) {
    parts.push(children.slice(lastIndex))
  }

  // If no matches were found, return the original text
  if (parts.length === 0) {
    return <>{children}</>
  }

  return <>{parts}</>
}

/**
 * Utility function to check if a string contains any task IDs
 */
export function containsTaskId(text: string): boolean {
  TASK_ID_PATTERN.lastIndex = 0
  return TASK_ID_PATTERN.test(text)
}
