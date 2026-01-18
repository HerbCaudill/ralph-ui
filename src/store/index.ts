import { create } from "zustand"
import type { ConnectionStatus } from "../hooks/useWebSocket"

// Types

export type RalphStatus = "stopped" | "starting" | "running" | "stopping"
export type Theme = "system" | "light" | "dark"

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

export interface TokenUsage {
  input: number
  output: number
}

export interface IterationInfo {
  current: number
  total: number
}

// Store State

export interface AppState {
  // Ralph process status
  ralphStatus: RalphStatus

  // Event stream from ralph
  events: RalphEvent[]

  // Tasks from ralph
  tasks: Task[]

  // Current workspace path
  workspace: string | null

  // Git branch name
  branch: string | null

  // Token usage
  tokenUsage: TokenUsage

  // Iteration progress
  iteration: IterationInfo

  // WebSocket connection status
  connectionStatus: ConnectionStatus

  // Accent color from peacock settings (null means use default/black)
  accentColor: string | null

  // UI State
  sidebarOpen: boolean
  sidebarWidth: number

  // Theme
  theme: Theme
}

// Store Actions

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

  // Accent color
  setAccentColor: (color: string | null) => void

  // Branch
  setBranch: (branch: string | null) => void

  // Token usage
  setTokenUsage: (usage: TokenUsage) => void
  addTokenUsage: (usage: TokenUsage) => void

  // Iteration
  setIteration: (iteration: IterationInfo) => void

  // Connection
  setConnectionStatus: (status: ConnectionStatus) => void

  // UI State
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  setSidebarWidth: (width: number) => void

  // Theme
  setTheme: (theme: Theme) => void

  // Reset
  reset: () => void
}

// Initial State

const initialState: AppState = {
  ralphStatus: "stopped",
  events: [],
  tasks: [],
  workspace: null,
  branch: null,
  tokenUsage: { input: 0, output: 0 },
  iteration: { current: 0, total: 0 },
  connectionStatus: "disconnected",
  accentColor: null,
  sidebarOpen: true,
  sidebarWidth: 320,
  theme: "system",
}

// Store

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

  // Accent color
  setAccentColor: color => set({ accentColor: color }),

  // Branch
  setBranch: branch => set({ branch }),

  // Token usage
  setTokenUsage: usage => set({ tokenUsage: usage }),
  addTokenUsage: usage =>
    set(state => ({
      tokenUsage: {
        input: state.tokenUsage.input + usage.input,
        output: state.tokenUsage.output + usage.output,
      },
    })),

  // Iteration
  setIteration: iteration => set({ iteration }),

  // Connection
  setConnectionStatus: status => set({ connectionStatus: status }),

  // UI State
  setSidebarOpen: open => set({ sidebarOpen: open }),
  toggleSidebar: () => set(state => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarWidth: width => set({ sidebarWidth: width }),

  // Theme
  setTheme: theme => set({ theme }),

  // Reset
  reset: () => set(initialState),
}))

// Selectors

export const selectRalphStatus = (state: AppState) => state.ralphStatus
export const selectEvents = (state: AppState) => state.events
export const selectTasks = (state: AppState) => state.tasks
export const selectWorkspace = (state: AppState) => state.workspace
export const selectBranch = (state: AppState) => state.branch
export const selectTokenUsage = (state: AppState) => state.tokenUsage
export const selectIteration = (state: AppState) => state.iteration
export const selectConnectionStatus = (state: AppState) => state.connectionStatus
export const selectIsConnected = (state: AppState) => state.connectionStatus === "connected"
export const selectIsRalphRunning = (state: AppState) => state.ralphStatus === "running"
export const selectAccentColor = (state: AppState) => state.accentColor
export const selectSidebarOpen = (state: AppState) => state.sidebarOpen
export const selectSidebarWidth = (state: AppState) => state.sidebarWidth
export const selectTheme = (state: AppState) => state.theme
