import { cn } from "@/lib/utils"
import { forwardRef, useImperativeHandle, useRef } from "react"
import { Header } from "./Header"
import { useAppStore, selectSidebarOpen } from "@/store"

// =============================================================================
// Types
// =============================================================================

export interface MainLayoutProps {
  sidebar?: React.ReactNode
  main?: React.ReactNode
  statusBar?: React.ReactNode
  header?: React.ReactNode
  showHeader?: boolean
  className?: string
}

export interface MainLayoutHandle {
  focusSidebar: () => void
  focusMain: () => void
}

// =============================================================================
// MainLayout Component
// =============================================================================

/**
 * Main application layout with header, sidebar, main content area, and status bar.
 * Responsive design: sidebar collapses on mobile.
 */
export const MainLayout = forwardRef<MainLayoutHandle, MainLayoutProps>(function MainLayout(
  { sidebar, main, statusBar, header, showHeader = true, className },
  ref,
) {
  const sidebarOpen = useAppStore(selectSidebarOpen)
  const toggleSidebar = useAppStore(state => state.toggleSidebar)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const mainRef = useRef<HTMLDivElement>(null)

  // Expose focus methods via ref
  useImperativeHandle(ref, () => ({
    focusSidebar: () => {
      if (sidebarRef.current) {
        // Find the first focusable element in the sidebar
        const focusable = sidebarRef.current.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        )
        focusable?.focus()
      }
    },
    focusMain: () => {
      if (mainRef.current) {
        // Find the first focusable element in main
        const focusable = mainRef.current.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        )
        focusable?.focus()
      }
    },
  }))

  return (
    <div className={cn("bg-background flex h-screen flex-col overflow-hidden", className)}>
      {/* Header */}
      {showHeader && (header ?? <Header />)}

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          ref={sidebarRef}
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
          onClick={toggleSidebar}
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
        <main ref={mainRef} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 md:p-6">{main}</div>
        </main>
      </div>

      {/* Status bar */}
      {statusBar && (
        <footer className="border-border bg-muted/50 border-t px-4 py-2">{statusBar}</footer>
      )}
    </div>
  )
})
