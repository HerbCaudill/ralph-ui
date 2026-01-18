import { create } from "zustand"
import type { ConnectionStatus } from "../hooks/useWebSocket"

// =============================================================================
// Types
// =============================================================================

export type RalphStatus = "stopped" | "starting" | "running" | "stopping"

export interface RalphEvent {
  type: string
  timestamp: number
  [key: string]: unknown
}

export interface Task {
  id: string
  content: string
  status: "pending" | "in_progress" | "completed"
}

// =============================================================================
// Store State
// =============================================================================

export interface AppState {
  // Ralph process status
  ralphStatus: RalphStatus

  // Event stream from ralph
  events: RalphEvent[]

  // Tasks from ralph
  tasks: Task[]

  // Current workspace path
  workspace: string | null

  // WebSocket connection status
  connectionStatus: ConnectionStatus
}

// =============================================================================
// Store Actions
// =============================================================================

export interface AppActions {
  // Ralph status
  setRalphStatus: (status: RalphStatus) => void

  // Events
  addEvent: (event: RalphEvent) => void
  clearEvents: () => void

  // Tasks
  setTasks: (tasks: Task[]) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  clearTasks: () => void

  // Workspace
  setWorkspace: (workspace: string | null) => void

  // Connection
  setConnectionStatus: (status: ConnectionStatus) => void

  // Reset
  reset: () => void
}

// =============================================================================
// Initial State
// =============================================================================

const initialState: AppState = {
  ralphStatus: "stopped",
  events: [],
  tasks: [],
  workspace: null,
  connectionStatus: "disconnected",
}

// =============================================================================
// Store
// =============================================================================

export const useAppStore = create<AppState & AppActions>(set => ({
  ...initialState,

  // Ralph status
  setRalphStatus: status => set({ ralphStatus: status }),

  // Events
  addEvent: event =>
    set(state => ({
      events: [...state.events, event],
    })),

  clearEvents: () => set({ events: [] }),

  // Tasks
  setTasks: tasks => set({ tasks }),

  updateTask: (id, updates) =>
    set(state => ({
      tasks: state.tasks.map(task => (task.id === id ? { ...task, ...updates } : task)),
    })),

  clearTasks: () => set({ tasks: [] }),

  // Workspace
  setWorkspace: workspace => set({ workspace }),

  // Connection
  setConnectionStatus: status => set({ connectionStatus: status }),

  // Reset
  reset: () => set(initialState),
}))

// =============================================================================
// Selectors
// =============================================================================

export const selectRalphStatus = (state: AppState) => state.ralphStatus
export const selectEvents = (state: AppState) => state.events
export const selectTasks = (state: AppState) => state.tasks
export const selectWorkspace = (state: AppState) => state.workspace
export const selectConnectionStatus = (state: AppState) => state.connectionStatus
export const selectIsConnected = (state: AppState) => state.connectionStatus === "connected"
export const selectIsRalphRunning = (state: AppState) => state.ralphStatus === "running"
