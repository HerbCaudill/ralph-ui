import { useEffect, useState, useMemo } from "react"
import { codeToHtml, createHighlighter, type Highlighter } from "shiki"
import { cn } from "@/lib/utils"

// Shared highlighter instance for performance
let highlighterPromise: Promise<Highlighter> | null = null

const LIGHT_THEME = "github-light"
const DARK_THEME = "github-dark"

function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: [LIGHT_THEME, DARK_THEME],
      langs: [
        "typescript",
        "javascript",
        "tsx",
        "jsx",
        "json",
        "html",
        "css",
        "bash",
        "shell",
        "python",
        "rust",
        "go",
        "markdown",
        "yaml",
        "toml",
        "sql",
        "graphql",
        "diff",
      ],
    })
  }
  return highlighterPromise
}

export interface CodeBlockProps {
  /** The code to highlight */
  code: string
  /** The language for syntax highlighting */
  language?: string
  /** Whether to show line numbers */
  showLineNumbers?: boolean
  /** Whether to use dark theme */
  isDark?: boolean
  /** Additional class names */
  className?: string
}

export function CodeBlock({
  code,
  language = "text",
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  showLineNumbers: _showLineNumbers = false, // Reserved for future use
  isDark = true,
  className,
}: CodeBlockProps) {
  const [html, setHtml] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)

  // Normalize language aliases
  const normalizedLang = useMemo(() => {
    const langMap: Record<string, string> = {
      ts: "typescript",
      js: "javascript",
      sh: "bash",
      zsh: "bash",
      yml: "yaml",
      py: "python",
      rb: "ruby",
      md: "markdown",
    }
    return langMap[language.toLowerCase()] || language.toLowerCase()
  }, [language])

  useEffect(() => {
    let cancelled = false

    async function highlight() {
      try {
        const highlighter = await getHighlighter()
        const theme = isDark ? DARK_THEME : LIGHT_THEME

        // Check if language is loaded, if not fall back to text
        const loadedLangs = highlighter.getLoadedLanguages()
        const langToUse = loadedLangs.includes(normalizedLang) ? normalizedLang : "text"

        const result = await codeToHtml(code, {
          lang: langToUse,
          theme,
        })

        if (!cancelled) {
          setHtml(result)
          setIsLoading(false)
        }
      } catch {
        // Fallback to plain text on error
        if (!cancelled) {
          setHtml(`<pre><code>${escapeHtml(code)}</code></pre>`)
          setIsLoading(false)
        }
      }
    }

    highlight()

    return () => {
      cancelled = true
    }
  }, [code, normalizedLang, isDark])

  if (isLoading) {
    return (
      <pre
        className={cn(
          "border-border bg-muted overflow-x-auto rounded-md border p-3 font-mono text-xs",
          className,
        )}
      >
        <code>{code}</code>
      </pre>
    )
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-md [&_code]:text-xs [&_pre]:!m-0 [&_pre]:overflow-x-auto [&_pre]:!p-3 [&_pre]:text-xs",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}
