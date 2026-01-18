import { cn } from "@/lib/utils"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

export interface AssistantTextEvent {
  type: "assistant_text" | "text"
  timestamp: number
  content: string
}

export function AssistantText({ event, className }: Props) {
  return (
    <div className={cn("py-1.5 pr-4 pl-4", className)}>
      {/* Content */}
      <div
        className={cn(
          "prose prose-sm dark:prose-invert max-w-none flex-1 text-sm",
          "prose-p:my-1 prose-p:leading-relaxed",
          "prose-strong:font-semibold",
          "prose-a:text-cyan-600 dark:prose-a:text-cyan-400 prose-a:no-underline hover:prose-a:underline",
          "prose-code:text-muted-foreground prose-code:text-xs prose-code:font-normal prose-code:font-mono",
          "prose-code:before:content-none prose-code:after:content-none",
          "prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:rounded-md prose-pre:my-2 prose-pre:text-[10px]",
          "prose-ul:my-1 prose-ol:my-1 prose-li:my-0",
        )}
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{event.content}</ReactMarkdown>
      </div>
    </div>
  )
}

type Props = {
  event: AssistantTextEvent
  className?: string
}
