import { cn, getContrastingColor } from "@/lib/utils"
import { useAppStore, selectAccentColor } from "@/store"
import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react"

// Constants

/** Default accent color (black) when peacock color is not set */
const DEFAULT_ACCENT_COLOR = "#000000"

// Types

export interface ChatInputProps {
  /**
   * Callback when a message is submitted.
   */
  onSubmit?: (message: string) => void

  /**
   * Placeholder text for the input.
   * @default "Type a message..."
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

export interface ChatInputHandle {
  focus: () => void
}

// ChatInput Component

/**
 * Text input for sending messages to a running agent.
 * Submits on Enter key, clears after send.
 */
export const ChatInput = forwardRef<ChatInputHandle, ChatInputProps>(function ChatInput(
  { onSubmit, placeholder = "Type a message...", disabled = false, className },
  ref,
) {
  const accentColor = useAppStore(selectAccentColor)
  const buttonBgColor = accentColor ?? DEFAULT_ACCENT_COLOR
  const buttonTextColor = getContrastingColor(buttonBgColor)

  const [message, setMessage] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus()
    },
  }))

  const handleSubmit = useCallback(
    (e?: FormEvent) => {
      e?.preventDefault()

      const trimmedMessage = message.trim()
      if (!trimmedMessage || disabled) return

      onSubmit?.(trimmedMessage)
      setMessage("")
    },
    [message, disabled, onSubmit],
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

  return (
    <form onSubmit={handleSubmit} className={cn("flex gap-2", className)}>
      <input
        ref={inputRef}
        type="text"
        value={message}
        onChange={e => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "border-input bg-background ring-offset-background placeholder:text-muted-foreground",
          "focus-visible:ring-ring flex-1 rounded-md border px-3 py-2 text-sm",
          "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
          "disabled:cursor-not-allowed disabled:opacity-50",
        )}
        aria-label="Message input"
      />
      <button
        type="submit"
        disabled={disabled || !message.trim()}
        className={cn(
          "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium",
          "ring-offset-background focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
          "disabled:pointer-events-none disabled:opacity-50",
          "transition-opacity",
        )}
        style={{
          backgroundColor: buttonBgColor,
          color: buttonTextColor,
        }}
        aria-label="Send message"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m5 12 7-7 7 7" />
          <path d="M12 19V5" />
        </svg>
      </button>
    </form>
  )
})
