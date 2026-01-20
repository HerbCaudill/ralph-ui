import { useState, useCallback, useEffect } from "react"
import {
  IconCircle,
  IconCircleDot,
  IconCircleCheck,
  IconBan,
  IconClock,
  type TablerIcon,
} from "@tabler/icons-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useAppStore } from "@/store"
import type { TaskCardTask, TaskStatus } from "./TaskCard"

// Types

export interface TaskDetailsDialogProps {
  /** The task to display/edit, or null if dialog should be closed */
  task: TaskCardTask | null
  /** Whether the dialog is open */
  open: boolean
  /** Callback when the dialog should close */
  onClose: () => void
  /** Callback when the task is saved */
  onSave?: (id: string, updates: TaskUpdateData) => void | Promise<void>
  /** Whether the dialog is in read-only mode (default: false) */
  readOnly?: boolean
}

export interface TaskUpdateData {
  title?: string
  description?: string
  status?: TaskStatus
  priority?: number
}

// Status Configuration

interface StatusConfig {
  icon: TablerIcon
  label: string
  color: string
}

const statusConfig: Record<TaskStatus, StatusConfig> = {
  open: {
    icon: IconCircle,
    label: "Open",
    color: "text-gray-500",
  },
  in_progress: {
    icon: IconCircleDot,
    label: "In Progress",
    color: "text-blue-500",
  },
  blocked: {
    icon: IconBan,
    label: "Blocked",
    color: "text-red-500",
  },
  deferred: {
    icon: IconClock,
    label: "Deferred",
    color: "text-amber-500",
  },
  closed: {
    icon: IconCircleCheck,
    label: "Closed",
    color: "text-green-500",
  },
}

const statusOptions: TaskStatus[] = ["open", "in_progress", "blocked", "deferred", "closed"]

const priorityOptions = [
  { value: 0, label: "P0 - Critical" },
  { value: 1, label: "P1 - High" },
  { value: 2, label: "P2 - Medium" },
  { value: 3, label: "P3 - Low" },
  { value: 4, label: "P4 - Lowest" },
]

// TaskDetailsDialog Component

/**
 * Dialog for viewing and editing task details.
 * Displays task title, description, status, and priority with editable fields.
 */
/**
 * Save an event log and add a closing comment to the task.
 * Returns the event log ID if successful, null otherwise.
 */
async function saveEventLogAndAddComment(
  taskId: string,
  taskTitle: string,
  events: Array<{ type: string; timestamp: number; [key: string]: unknown }>,
  workspacePath: string | null,
): Promise<string | null> {
  // Only save if there are events
  if (events.length === 0) {
    return null
  }

  try {
    // Save the event log
    const response = await fetch("/api/eventlogs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        events,
        metadata: {
          taskId,
          title: taskTitle,
          source: "task-close",
          workspacePath: workspacePath ?? undefined,
        },
      }),
    })

    if (!response.ok) {
      console.error("Failed to save event log:", await response.text())
      return null
    }

    const result = (await response.json()) as { ok: boolean; eventlog?: { id: string } }
    if (!result.ok || !result.eventlog?.id) {
      return null
    }

    const eventLogId = result.eventlog.id

    // Add closing comment with event log link
    const commentResponse = await fetch(`/api/tasks/${taskId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        comment: `Closed. Event log: #eventlog=${eventLogId}`,
        author: "Ralph",
      }),
    })

    if (!commentResponse.ok) {
      console.error("Failed to add closing comment:", await commentResponse.text())
      // Still return the event log ID even if comment failed
    }

    return eventLogId
  } catch (err) {
    console.error("Error saving event log:", err)
    return null
  }
}

export function TaskDetailsDialog({
  task,
  open,
  onClose,
  onSave,
  readOnly = false,
}: TaskDetailsDialogProps) {
  // Get events and workspace from store for event log capture
  const events = useAppStore(state => state.events)
  const workspace = useAppStore(state => state.workspace)

  // Local state for editable fields
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState<TaskStatus>("open")
  const [priority, setPriority] = useState<number>(2)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Reset local state when task changes
  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description ?? "")
      setStatus(task.status)
      setPriority(task.priority ?? 2)
      setHasChanges(false)
    }
  }, [task])

  // Track changes
  useEffect(() => {
    if (!task) return
    const changed =
      title !== task.title ||
      description !== (task.description ?? "") ||
      status !== task.status ||
      priority !== (task.priority ?? 2)
    setHasChanges(changed)
  }, [task, title, description, status, priority])

  const handleSave = useCallback(async () => {
    if (!task || !onSave || readOnly) return

    const updates: TaskUpdateData = {}
    if (title !== task.title) updates.title = title
    if (description !== (task.description ?? "")) updates.description = description
    if (status !== task.status) updates.status = status
    if (priority !== (task.priority ?? 2)) updates.priority = priority

    if (Object.keys(updates).length === 0) {
      onClose()
      return
    }

    setIsSaving(true)
    try {
      // If closing the task (status changed to closed), save event log first
      const isClosing = status === "closed" && task.status !== "closed"
      if (isClosing) {
        await saveEventLogAndAddComment(task.id, task.title, events, workspace)
      }

      await onSave(task.id, updates)
      onClose()
    } catch (error) {
      console.error("Failed to save task:", error)
    } finally {
      setIsSaving(false)
    }
  }, [task, onSave, readOnly, title, description, status, priority, onClose, events, workspace])

  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

  // Handle Cmd+Enter / Ctrl+Enter to save
  useEffect(() => {
    if (!open || readOnly) return

    const handleKeyDown = (event: KeyboardEvent) => {
      const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform)
      const modifierPressed = isMac ? event.metaKey : event.ctrlKey

      if (modifierPressed && event.key === "Enter" && hasChanges && !isSaving) {
        event.preventDefault()
        handleSave()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open, readOnly, hasChanges, isSaving, handleSave])

  if (!task) return null

  const StatusIcon = statusConfig[status].icon

  return (
    <Dialog open={open} onOpenChange={isOpen => !isOpen && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <StatusIcon className={cn("h-5 w-5", statusConfig[status].color)} />
            <span className="text-muted-foreground font-mono text-sm">{task.id}</span>
          </DialogTitle>
          <DialogDescription className="sr-only">Edit task details</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Title */}
          <div className="grid gap-2">
            <Label htmlFor="task-title">Title</Label>
            {readOnly ?
              <p className="text-sm">{title}</p>
            : <Input
                id="task-title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Task title"
              />
            }
          </div>

          {/* Description */}
          <div className="grid gap-2">
            <Label htmlFor="task-description">Description</Label>
            {readOnly ?
              <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                {description || "No description"}
              </p>
            : <Textarea
                id="task-description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Task description (optional)"
                rows={4}
              />
            }
          </div>

          {/* Status and Priority row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Status */}
            <div className="grid gap-2">
              <Label htmlFor="task-status">Status</Label>
              {readOnly ?
                <div className="flex items-center gap-2">
                  <StatusIcon className={cn("h-4 w-4", statusConfig[status].color)} />
                  <span className="text-sm">{statusConfig[status].label}</span>
                </div>
              : <Select value={status} onValueChange={value => setStatus(value as TaskStatus)}>
                  <SelectTrigger id="task-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(s => {
                      const config = statusConfig[s]
                      const Icon = config.icon
                      return (
                        <SelectItem key={s} value={s}>
                          <div className="flex items-center gap-2">
                            <Icon className={cn("h-4 w-4", config.color)} />
                            <span>{config.label}</span>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              }
            </div>

            {/* Priority */}
            <div className="grid gap-2">
              <Label htmlFor="task-priority">Priority</Label>
              {readOnly ?
                <span className="text-sm">
                  {priorityOptions.find(p => p.value === priority)?.label ?? `P${priority}`}
                </span>
              : <Select
                  value={String(priority)}
                  onValueChange={value => setPriority(Number(value))}
                >
                  <SelectTrigger id="task-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorityOptions.map(p => (
                      <SelectItem key={p.value} value={String(p.value)}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              }
            </div>
          </div>

          {/* Metadata (read-only) */}
          {(task.issue_type || task.parent) && (
            <div className="border-border text-muted-foreground border-t pt-4 text-xs">
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {task.issue_type && (
                  <span>
                    Type: <span className="text-foreground capitalize">{task.issue_type}</span>
                  </span>
                )}
                {task.parent && (
                  <span>
                    Parent: <span className="text-foreground font-mono">{task.parent}</span>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {!readOnly && (
          <DialogFooter>
            <Button variant="outline" onClick={handleClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !hasChanges}>
              {isSaving ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
