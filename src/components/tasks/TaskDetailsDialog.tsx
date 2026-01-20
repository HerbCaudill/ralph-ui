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
import { cn, stripTaskPrefix } from "@/lib/utils"
import { useAppStore, selectIssuePrefix, selectTasks } from "@/store"
import type { TaskCardTask, TaskStatus } from "./TaskCard"
import { IconBug, IconSparkles, IconStack2, IconCheckbox } from "@tabler/icons-react"

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
  issue_type?: string
  parent?: string | null
}

// Issue Type Options
export type IssueType = "task" | "bug" | "feature" | "epic"

const issueTypeOptions: {
  value: IssueType
  label: string
  icon: typeof IconCheckbox
  color: string
}[] = [
  { value: "task", label: "Task", icon: IconCheckbox, color: "text-gray-500" },
  { value: "bug", label: "Bug", icon: IconBug, color: "text-red-500" },
  { value: "feature", label: "Feature", icon: IconSparkles, color: "text-purple-500" },
  { value: "epic", label: "Epic", icon: IconStack2, color: "text-indigo-500" },
]

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
  // Get events, workspace, issue prefix, and tasks from store
  const events = useAppStore(state => state.events)
  const workspace = useAppStore(state => state.workspace)
  const issuePrefix = useAppStore(selectIssuePrefix)
  const allTasks = useAppStore(selectTasks)

  // Local state for editable fields
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState<TaskStatus>("open")
  const [priority, setPriority] = useState<number>(2)
  const [issueType, setIssueType] = useState<IssueType>("task")
  const [parent, setParent] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Reset local state when task changes
  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description ?? "")
      setStatus(task.status)
      setPriority(task.priority ?? 2)
      setIssueType((task.issue_type as IssueType) ?? "task")
      setParent(task.parent ?? null)
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
      priority !== (task.priority ?? 2) ||
      issueType !== ((task.issue_type as IssueType) ?? "task") ||
      parent !== (task.parent ?? null)
    setHasChanges(changed)
  }, [task, title, description, status, priority, issueType, parent])

  const handleSave = useCallback(async () => {
    if (!task || !onSave || readOnly) return

    const updates: TaskUpdateData = {}
    if (title !== task.title) updates.title = title
    if (description !== (task.description ?? "")) updates.description = description
    if (status !== task.status) updates.status = status
    if (priority !== (task.priority ?? 2)) updates.priority = priority
    if (issueType !== ((task.issue_type as IssueType) ?? "task")) updates.issue_type = issueType
    if (parent !== (task.parent ?? null)) updates.parent = parent

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
  }, [
    task,
    onSave,
    readOnly,
    title,
    description,
    status,
    priority,
    issueType,
    parent,
    onClose,
    events,
    workspace,
  ])

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
            <span className="text-muted-foreground font-mono text-sm">
              {stripTaskPrefix(task.id, issuePrefix)}
            </span>
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

          {/* Type and Parent row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Type */}
            <div className="grid gap-2">
              <Label htmlFor="task-type">Type</Label>
              {readOnly ?
                <div className="flex items-center gap-2">
                  {(() => {
                    const typeOption = issueTypeOptions.find(t => t.value === issueType)
                    const TypeIcon = typeOption?.icon ?? IconCheckbox
                    return (
                      <>
                        <TypeIcon className={cn("h-4 w-4", typeOption?.color ?? "text-gray-500")} />
                        <span className="text-sm capitalize">{issueType}</span>
                      </>
                    )
                  })()}
                </div>
              : <Select value={issueType} onValueChange={value => setIssueType(value as IssueType)}>
                  <SelectTrigger id="task-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {issueTypeOptions.map(t => {
                      const Icon = t.icon
                      return (
                        <SelectItem key={t.value} value={t.value}>
                          <div className="flex items-center gap-2">
                            <Icon className={cn("h-4 w-4", t.color)} />
                            <span>{t.label}</span>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              }
            </div>

            {/* Parent */}
            <div className="grid gap-2">
              <Label htmlFor="task-parent">Parent</Label>
              {readOnly ?
                <span className="text-muted-foreground text-sm">
                  {task.parent ?
                    <span className="text-foreground font-mono">
                      {stripTaskPrefix(task.parent, issuePrefix)}
                    </span>
                  : <span>None</span>}
                </span>
              : (() => {
                  // Filter valid parent candidates (exclude self and direct children)
                  const validParents = allTasks.filter(
                    t => t.id !== task.id && t.parent !== task.id,
                  )
                  // Check if current parent is in the list of valid parents
                  const currentParentInList = parent && validParents.some(t => t.id === parent)
                  return (
                    <Select
                      value={parent ?? "__none__"}
                      onValueChange={value => setParent(value === "__none__" ? null : value)}
                    >
                      <SelectTrigger id="task-parent">
                        <SelectValue placeholder="None" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">None</SelectItem>
                        {/* If current parent isn't in list, show it as an option */}
                        {parent && !currentParentInList && (
                          <SelectItem value={parent}>
                            <span className="font-mono text-xs">
                              {stripTaskPrefix(parent, issuePrefix)}
                            </span>
                          </SelectItem>
                        )}
                        {validParents.map(t => (
                          <SelectItem key={t.id} value={t.id}>
                            <span className="font-mono text-xs">
                              {stripTaskPrefix(t.id, issuePrefix)}
                            </span>
                            <span className="ml-2 truncate">{t.title}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )
                })()
              }
            </div>
          </div>
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
