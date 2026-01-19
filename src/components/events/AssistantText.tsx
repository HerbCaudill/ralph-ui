import { cn } from "@/lib/utils"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { CodeBlock } from "@/components/ui/code-block"
import { useTheme } from "@/hooks/useTheme"
import type { Components } from "react-markdown"

export interface AssistantTextEvent {
  type: "assistant_text" | "text"
  timestamp: number
  content: string
}

export function AssistantText({ event, className }: Props) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  const components: Components = {
    code(props) {
      const { children, className: codeClassName, ...rest } = props
      // Check if this is a code block (inside a pre) by looking at the className
      // react-markdown adds language-xxx class for fenced code blocks
      const match = /language-(\w+)/.exec(codeClassName || "")

      // If it has a language class, it's a fenced code block
      if (match) {
        const language = match[1]
        const code = String(children).replace(/\n$/, "")
        return <CodeBlock code={code} language={language} isDark={isDark} />
      }

      // Otherwise it's inline code
      return (
        <code className={codeClassName} {...rest}>
          {children}
        </code>
      )
    },
    pre(props) {
      const { children } = props
      // If the child is already a CodeBlock, just render it directly
      // Otherwise wrap in pre as normal
      return <>{children}</>
    },
  }

  return (
    <div className={cn("py-1.5 pr-4 pl-4", className)}>
      {/* Content */}
      <div
        className={cn(
          "prose prose-sm dark:prose-invert max-w-none flex-1 font-serif text-sm",
          "prose-p:my-1 prose-p:leading-snug",
          "prose-strong:font-medium",
          "prose-a:text-cyan-600 dark:prose-a:text-cyan-400 prose-a:no-underline hover:prose-a:underline",
          "prose-code:text-muted-foreground prose-code:text-xs prose-code:font-normal prose-code:font-mono",
          "prose-code:before:content-none prose-code:after:content-none",
          "prose-pre:bg-transparent prose-pre:border-0 prose-pre:p-0 prose-pre:my-2",
          "prose-ul:my-1 prose-ol:my-1 prose-li:my-0",
        )}
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
          {event.content}
        </ReactMarkdown>
      </div>
    </div>
  )
}

type Props = {
  event: AssistantTextEvent
  className?: string
}
