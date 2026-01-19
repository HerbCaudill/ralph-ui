import { cn } from "@/lib/utils"
import { useAppStore, selectAccentColor } from "@/store"
import { useTheme } from "@/hooks"
import { WorkspacePicker } from "./WorkspacePicker"
import { Button } from "@/components/ui/button"
import { Sun, Moon, Monitor } from "lucide-react"

// Constants

/** Default accent color (black) when peacock color is not set */
const DEFAULT_ACCENT_COLOR = "#000000"

// Types

export interface HeaderProps {
  className?: string
}

// ThemeToggle Component

function ThemeToggle() {
  const { theme, cycleTheme } = useTheme()

  const iconConfig = {
    system: { Icon: Monitor, label: "System theme" },
    light: { Icon: Sun, label: "Light theme" },
    dark: { Icon: Moon, label: "Dark theme" },
  }

  const { Icon, label } = iconConfig[theme]

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={cycleTheme}
      title={`${label} (click to cycle)`}
      aria-label={label}
      data-testid="theme-toggle"
    >
      <Icon className="size-4" />
    </Button>
  )
}

// Logo Component

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-primary"
      >
        <path d="M12 8V4H8" />
        <rect width="16" height="12" x="4" y="8" rx="2" />
        <path d="M2 14h2" />
        <path d="M20 14h2" />
        <path d="M15 13v2" />
        <path d="M9 13v2" />
      </svg>
      <span className="text-lg font-semibold">Ralph</span>
    </div>
  )
}

// Header Component

/**
 * Application header with logo, workspace picker, and theme toggle.
 * Features an accent color bar at the top from peacock settings.
 */
export function Header({ className }: HeaderProps) {
  const accentColor = useAppStore(selectAccentColor)
  const barColor = accentColor ?? DEFAULT_ACCENT_COLOR

  return (
    <header className={cn("flex shrink-0 flex-col", className)} data-testid="header">
      {/* Accent color bar */}
      <div
        className="h-1 w-full shrink-0"
        style={{ backgroundColor: barColor }}
        data-testid="accent-bar"
        aria-hidden="true"
      />
      {/* Main header content */}
      <div
        className={cn(
          "bg-background border-border flex h-[calc(3.5rem-4px)] items-center justify-between border-b px-4",
        )}
      >
        <div className="flex items-center gap-4">
          <Logo />
          <WorkspacePicker />
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
