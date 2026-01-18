# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Ralph-UI is a React frontend for the Ralph CLI agent (`@herbcaudill/ralph`). It provides a web interface for controlling Ralph, viewing real-time events, and managing tasks through beads (`bd`).

## Commands

```bash
pnpm dev              # Start both frontend (5179) and backend (3000)
pnpm dev:vite         # Start only the Vite dev server
pnpm dev:server       # Start only the Express backend
pnpm build            # Build for production
pnpm test             # Run unit tests (Vitest)
pnpm test -- -t "pattern"  # Run tests matching pattern
pnpm test:pw          # Run Playwright tests
pnpm test:pw:headed   # Run Playwright tests with visible browser
pnpm test:pw:ui       # Run Playwright tests with interactive UI
pnpm test:all         # Run typecheck, unit tests, and Playwright tests
pnpm typecheck        # Type check without emitting
pnpm storybook        # Start Storybook on port 6006
pnpm format           # Format code with Prettier
```

## Architecture

**Client (React + Vite)**

- `src/store/index.ts` - Zustand store for global state (ralph status, events, tasks, UI)
- `src/hooks/useRalphConnection.ts` - WebSocket hook that connects to server, dispatches events to store
- `src/hooks/useWebSocket.ts` - Low-level WebSocket hook with reconnection
- `src/hooks/useHotkeys.ts` - Global keyboard shortcuts from `src/config/hotkeys.json`
- `src/components/events/EventStream.tsx` - Real-time event log with auto-scroll

**Server (Express + WebSocket)**

- `server/index.ts` - Express server with WebSocket, serves static files and API
- `server/RalphManager.ts` - Spawns and manages Ralph CLI process (`npx @herbcaudill/ralph --json`)
- `server/BdProxy.ts` - Proxy for beads CLI commands (task management)

**Data flow**: Ralph CLI → stdout JSON → RalphManager → WebSocket → useRalphConnection → Zustand store → React components

## Key patterns

- Path alias: `@/` maps to `src/` (e.g., `import { cn } from "@/lib/utils"`)
- Tailwind v4 with `@tailwindcss/vite` plugin
- Components use shadcn/ui patterns with `class-variance-authority`
- Unit tests use `jsdom` environment; server tests use `node` environment

## Issue tracking (beads)

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --status in_progress  # Claim work
bd close <id>         # Complete work
bd sync               # Sync with git
```

## Keyboard hotkeys

Hotkeys are configured in `src/config/hotkeys.json`. The `useHotkeys` hook handles global keyboard events.

| Hotkey      | Action                 |
| ----------- | ---------------------- |
| `Cmd+Enter` | Start Ralph            |
| `Cmd+.`     | Stop Ralph             |
| `Cmd+B`     | Toggle sidebar         |
| `Cmd+1`     | Focus sidebar          |
| `Cmd+2`     | Focus main content     |
| `Cmd+K`     | Focus quick task input |
| `Cmd+L`     | Focus chat input       |

On Windows/Linux, use `Ctrl` instead of `Cmd`.

## Session completion checklist

Before ending a session, verify:

1. Run quality gates if code changed (`pnpm test:all`)
2. Close finished beads issues
3. Push all changes:
   ```bash
   git pull --rebase
   bd sync
   git push
   ```
