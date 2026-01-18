import { cn } from "@/lib/utils"
import { useCallback, useState, type FormEvent, type KeyboardEvent } from "react"
import { Plus, Loader2 } from "lucide-react"

// =============================================================================
// Types
// =============================================================================

export interface QuickTaskInputProps {
  /**
   * Callback when a task is successfully created.
   * Receives the created issue data from bd.
   */
  onTaskCreated?: (issue: CreatedIssue) => void

  /**
   * Callback when task creation fails.
   */
  onError?: (error: string) => void

  /**
   * Placeholder text for the input.
   * @default "Add a task..."
   */
  placeholder?: string

  /**
   * Whether the input is disabled.
   * @default false
   */
  disabled?: boolean

  /**
   * Additional CSS classes.
   */
  className?: string
}

export interface CreatedIssue {
  id: string
  title: string
  status: string
  priority: number
  issue_type: string
}

// =============================================================================
// QuickTaskInput Component
// =============================================================================

/**
 * Text input for quickly adding tasks.
 * Submits on Enter key, calls bd create via API.
 */
export function QuickTaskInput({
  onTaskCreated,
  onError,
  placeholder = "Add a task...",
  disabled = false,
  className,
}: QuickTaskInputProps) {
  const [title, setTitle] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = useCallback(
    async (e?: FormEvent) => {
      e?.preventDefault()

      const trimmedTitle = title.trim()
      if (!trimmedTitle || disabled || isSubmitting) return

      setIsSubmitting(true)

      try {
        const response = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: trimmedTitle }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Failed to create task")
        }

        setTitle("")
        onTaskCreated?.(data.issue)
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to create task"
        onError?.(message)
      } finally {
        setIsSubmitting(false)
      }
    },
    [title, disabled, isSubmitting, onTaskCreated, onError],
  )

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        handleSubmit()
      }
    },
    [handleSubmit],
  )

  const isDisabled = disabled || isSubmitting

  return (
    <form onSubmit={handleSubmit} className={cn("flex gap-2", className)}>
      <input
        type="text"
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={isDisabled}
        className={cn(
          "border-input bg-background ring-offset-background placeholder:text-muted-foreground",
          "focus-visible:ring-ring flex-1 rounded-md border px-3 py-2 text-sm",
          "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
          "disabled:cursor-not-allowed disabled:opacity-50",
        )}
        aria-label="New task title"
      />
      <button
        type="submit"
        disabled={isDisabled || !title.trim()}
        className={cn(
          "bg-primary text-primary-foreground hover:bg-primary/90",
          "inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium",
          "ring-offset-background focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
          "disabled:pointer-events-none disabled:opacity-50",
          "transition-colors",
        )}
        aria-label={isSubmitting ? "Creating task..." : "Add task"}
      >
        {isSubmitting ?
          <Loader2 size={16} className="animate-spin" aria-hidden="true" />
        : <Plus size={16} aria-hidden="true" />}
      </button>
    </form>
  )
}
