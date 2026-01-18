# Ralph UI Plan

## Goal

Web UI to monitor/control ralph, manage tasks, and chat with claude agents in real-time.

## UI Mockup

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  ralph-ui                                    [workspace ▼]     ● Connected      │
├────────────────────────┬────────────────────────────────────────────────────────┤
│                        │                                                        │
│  ┌──────────────────┐  │  ┌─────────────────────────────────────────────────┐   │
│  │ Add a task...    │  │  │ Read src/components/Button.tsx                  │   │
│  └──────────────────┘  │  │    147 lines                                    │   │
│                        │  └─────────────────────────────────────────────────┘   │
│  ○ READY (3)           │                                                        │
│  ├─ TSK-12 Fix login   │  ┌─────────────────────────────────────────────────┐   │
│  ├─ TSK-14 Add tests   │  │ Edit src/components/Button.tsx                  │   │
│  └─ TSK-15 Refactor    │  │    +12 -3 lines                                 │   │
│                        │  └─────────────────────────────────────────────────┘   │
│  ◐ IN PROGRESS (1)     │                                                        │
│  └─ TSK-11 Auth flow   │  ┌─────────────────────────────────────────────────┐   │
│                        │  │ Now I'll run the tests to verify...             │   │
│  ◉ BLOCKED (2)         │  └─────────────────────────────────────────────────┘   │
│  ├─ TSK-08 Deploy      │                                                        │
│  └─ TSK-09 Docs        │  ┌─────────────────────────────────────────────────┐   │
│                        │  │ Bash pnpm test                                  │   │
│                        │  │    Running...                                   │   │
│                        │  └─────────────────────────────────────────────────┘   │
│                        │                                                        │
│                        │                                                        │
│                        ├────────────────────────────────────────────────────────┤
│                        │  [Start] [Pause] [Stop] [Stop after]                   │
│                        │  ┌─────────────────────────────────────────────────┐   │
│                        │  │ Type a message to the agent...                  │   │
│                        │  └─────────────────────────────────────────────────┘   │
├────────────────────────┴────────────────────────────────────────────────────────┤
│  ● Running   ralph-ui • main   ↓12.4k ↑3.2k            3/10 ███████░░░░░░░░░░░  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

- **Header**: Logo, workspace picker, connection status
- **Left sidebar**: Quick task input, tasks grouped by status (Ready/In Progress/Blocked)
- **Right main area**: Real-time agent event stream with tool use cards
- **Control bar**: Start/Pause/Stop buttons, message input
- **Status bar**: Run status, repo/branch, token usage (↓in ↑out), iteration progress

## Reference projects

- `../ralph` - The ralph CLI we're building a UI for
- `../beads-ui` - Similar architecture (React + Express + WebSocket + Zustand) for beads

## Architecture

```
Browser (React + Vite + Tailwind)
    ↓ WebSocket
ralph-ui server (Express + ws)
    ├─ spawns ralph with --json flag
    │   ├─ captures stdout (JSON events)
    │   └─ writes to stdin (chat messages, stop signals)
    └─ spawns bd commands for task management
```

### Ralph CLI changes needed (in ../ralph)

1. **`--json` flag** (r-y41): Output events as newline-delimited JSON to stdout
2. **Stdin commands** (r-loy): Accept `{"type": "message", "text": "..."}` for chat, `{"type": "stop"}` for graceful stop
3. **Stop-after-current** (r-zi3): Handle stop signal, finish current iteration, then exit

## Phases

### Phase 1: Server foundation

- Express server with ws
- RalphManager class: spawn, capture stdout, write stdin, kill
- WebSocket broadcast of events
- REST API: POST /start, POST /stop, POST /message

### Phase 2: React shell

- Vite + React + Tailwind + shadcn/ui
- WebSocket client with auto-reconnect
- Zustand store for state
- Layout: sidebar (tasks) + main (agent view)

### Phase 3: Agent monitoring

- EventStream component showing real-time events
- ToolUseCard for Read, Edit, Bash, etc.
- Progress bar (iteration X of Y)
- Control bar: Pause, stop, Stop-after-current buttons

### Phase 4: Agent chat

- ChatInput component
- Send messages via WebSocket → server → ralph stdin
- Show user messages inline in event stream

### Phase 5: Task management

- BdProxy: spawn bd commands, parse JSON output
- TaskList component
- Quick create dialog
- Inline editing
- WorkspacePicker (like beads-ui)

## File structure

```
server/
  index.ts           # Express + ws setup
  RalphManager.ts    # Spawn/control ralph process
  BdProxy.ts         # Run bd commands
  wsHandler.ts       # WebSocket message routing
src/
  main.tsx
  App.tsx
  components/
    AgentView.tsx
    EventStream.tsx
    ToolUseCard.tsx
    ControlBar.tsx
    ChatInput.tsx
    TaskSidebar.tsx
    TaskList.tsx
    TaskCard.tsx
    WorkspacePicker.tsx
  hooks/
    useWebSocket.ts
    useRalphState.ts
  store/
    index.ts
  lib/
    protocol.ts      # Message types
```

## Verification

1. `pnpm dev` starts server + vite
2. Click "Start" → ralph spawns, events stream to browser
3. Type message → appears in ralph's claude session
4. Click "Stop after current" → ralph finishes iteration, exits
5. Task sidebar shows bd issues
6. Can create/edit tasks

