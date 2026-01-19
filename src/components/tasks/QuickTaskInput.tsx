import { cn } from "@/lib/utils"
import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react"
import { Plus, Loader2 } from "lucide-react"

// Types

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

export interface QuickTaskInputHandle {
  focus: () => void
}

// QuickTaskInput Component

/**
 * Text input for quickly adding tasks.
 * Submits on Enter key, calls bd create via API.
 */
export const QuickTaskInput = forwardRef<QuickTaskInputHandle, QuickTaskInputProps>(
  function QuickTaskInput(
    { onTaskCreated, onError, placeholder = "Add a task...", disabled = false, className },
    ref,
  ) {
    const [title, setTitle] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    useImperativeHandle(ref, () => ({
      focus: () => {
        inputRef.current?.focus()
      },
    }))

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
          // Keep input focused after submission
          inputRef.current?.focus()
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
      <form onSubmit={handleSubmit} className={cn("flex items-center", className)}>
        <div className="flex flex-1 items-center">
          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isDisabled}
            className={cn(
              "placeholder:text-muted-foreground bg-transparent",
              "flex-1 border-0 px-0 py-1 text-sm",
              "focus:ring-0 focus:outline-none",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
            aria-label="New task title"
          />
          <button
            type="submit"
            disabled={isDisabled || !title.trim()}
            className={cn(
              "text-muted-foreground hover:text-foreground",
              "inline-flex shrink-0 items-center justify-center p-1",
              "focus-visible:text-foreground focus:outline-none",
              "disabled:pointer-events-none disabled:opacity-50",
              "transition-colors",
            )}
            aria-label={isSubmitting ? "Creating task..." : "Add task"}
          >
            {isSubmitting ?
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
            : <Plus size={16} aria-hidden="true" />}
          </button>
        </div>
      </form>
    )
  },
)
