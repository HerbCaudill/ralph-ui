import { cn } from "@/lib/utils"
import { forwardRef, useImperativeHandle, useRef, useCallback, useState, useEffect } from "react"
import { Header } from "./Header"
import { useAppStore, selectSidebarOpen, selectSidebarWidth } from "@/store"

// Constants for sidebar width constraints
const MIN_SIDEBAR_WIDTH = 200
const MAX_SIDEBAR_WIDTH = 600

// Types

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

// MainLayout Component

/**
 * Main application layout with header, sidebar, main content area, and status bar.
 * Responsive design: sidebar collapses on mobile.
 */
export const MainLayout = forwardRef<MainLayoutHandle, MainLayoutProps>(function MainLayout(
  { sidebar, main, statusBar, header, showHeader = true, className },
  ref,
) {
  const sidebarOpen = useAppStore(selectSidebarOpen)
  const sidebarWidth = useAppStore(selectSidebarWidth)
  const toggleSidebar = useAppStore(state => state.toggleSidebar)
  const setSidebarWidth = useAppStore(state => state.setSidebarWidth)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const mainRef = useRef<HTMLDivElement>(null)

  // Drag state for resizing
  const [isResizing, setIsResizing] = useState(false)

  // Handle mouse move during resize
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return
      const newWidth = Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, e.clientX))
      setSidebarWidth(newWidth)
    },
    [isResizing, setSidebarWidth],
  )

  // Handle mouse up to stop resizing
  const handleMouseUp = useCallback(() => {
    setIsResizing(false)
  }, [])

  // Add/remove global mouse event listeners during resize
  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      // Prevent text selection during resize
      document.body.style.userSelect = "none"
      document.body.style.cursor = "col-resize"
    } else {
      document.body.style.userSelect = ""
      document.body.style.cursor = ""
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      document.body.style.userSelect = ""
      document.body.style.cursor = ""
    }
  }, [isResizing, handleMouseMove, handleMouseUp])

  // Start resizing on mouse down
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }, [])

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
            "border-sidebar-border bg-sidebar relative flex flex-col border-r",
            !isResizing && "transition-all duration-200",
          )}
          style={{ width: sidebarOpen ? sidebarWidth : 0 }}
        >
          {sidebarOpen && (
            <div className="flex h-full flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto">{sidebar}</div>
            </div>
          )}

          {/* Resize handle */}
          {sidebarOpen && (
            <div
              className={cn(
                "absolute top-0 right-0 z-10 h-full w-1 cursor-col-resize transition-colors",
                "hover:bg-primary/20",
                isResizing && "bg-primary/30",
              )}
              onMouseDown={handleResizeStart}
              role="separator"
              aria-orientation="vertical"
              aria-label="Resize sidebar"
              aria-valuenow={sidebarWidth}
              aria-valuemin={MIN_SIDEBAR_WIDTH}
              aria-valuemax={MAX_SIDEBAR_WIDTH}
            />
          )}
        </aside>

        {/* Toggle button */}
        <button
          onClick={toggleSidebar}
          className={cn(
            "bg-sidebar-accent text-sidebar-accent-foreground absolute top-1/2 z-10 -translate-y-1/2 rounded-r-md p-1 opacity-50 transition-opacity hover:opacity-100",
            !isResizing && "transition-[left] duration-200",
          )}
          style={{ left: sidebarOpen ? sidebarWidth : 0 }}
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
