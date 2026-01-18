import { cn } from "@/lib/utils"
import { useState } from "react"

// =============================================================================
// Types
// =============================================================================

export interface MainLayoutProps {
  sidebar?: React.ReactNode
  main?: React.ReactNode
  statusBar?: React.ReactNode
  className?: string
}

// =============================================================================
// MainLayout Component
// =============================================================================

/**
 * Main application layout with sidebar, main content area, and status bar.
 * Responsive design: sidebar collapses on mobile.
 */
export function MainLayout({ sidebar, main, statusBar, className }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className={cn("bg-background flex h-screen flex-col overflow-hidden", className)}>
      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={cn(
            "border-sidebar-border bg-sidebar flex flex-col border-r transition-all duration-200",
            sidebarOpen ? "w-64 md:w-72 lg:w-80" : "w-0",
          )}
        >
          {sidebarOpen && (
            <div className="flex h-full flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4">{sidebar}</div>
            </div>
          )}
        </aside>

        {/* Toggle button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className={cn(
            "bg-sidebar-accent text-sidebar-accent-foreground absolute top-1/2 left-0 z-10 -translate-y-1/2 rounded-r-md p-1 opacity-50 transition-opacity hover:opacity-100",
            sidebarOpen && "left-64 md:left-72 lg:left-80",
          )}
          aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
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
            className={cn("transition-transform", sidebarOpen && "rotate-180")}
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>

        {/* Main content */}
        <main className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 md:p-6">{main}</div>
        </main>
      </div>

      {/* Status bar */}
      {statusBar && (
        <footer className="border-border bg-muted/50 border-t px-4 py-2">{statusBar}</footer>
      )}
    </div>
  )
}
