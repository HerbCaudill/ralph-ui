import type { Meta, StoryObj } from "@storybook/react"
import { TaskList } from "./TaskList"
import type { TaskCardTask } from "./TaskCard"
import { fn } from "@storybook/test"

const meta: Meta<typeof TaskList> = {
  title: "Tasks/TaskList",
  component: TaskList,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  decorators: [
    Story => (
      <div className="border-border h-[500px] max-w-md overflow-hidden rounded-md border">
        <Story />
      </div>
    ),
  ],
  args: {
    onStatusChange: fn(),
    onTaskClick: fn(),
    persistCollapsedState: false, // Disable persistence in stories
  },
}

export default meta
type Story = StoryObj<typeof meta>

const mixedTasks: TaskCardTask[] = [
  { id: "rui-001", title: "Implement login page", status: "in_progress", priority: 1 },
  { id: "rui-002", title: "Add unit tests for auth", status: "open", priority: 2 },
  { id: "rui-003", title: "Fix navigation bug", status: "blocked", priority: 0 },
  { id: "rui-004", title: "Update API documentation", status: "open", priority: 3 },
  { id: "rui-005", title: "Refactor API client", status: "closed", priority: 2 },
  { id: "rui-006", title: "Setup CI/CD pipeline", status: "open", priority: 1 },
  { id: "rui-007", title: "Database schema migration", status: "deferred", priority: 2 },
  { id: "rui-008", title: "Performance optimization", status: "blocked", priority: 1 },
]

export const Default: Story = {
  args: {
    tasks: mixedTasks,
  },
}

export const AllGroupsExpanded: Story = {
  args: {
    tasks: mixedTasks,
    defaultCollapsed: {
      ready: false,
      in_progress: false,
      blocked: false,
      other: false,
    },
  },
}

export const AllGroupsCollapsed: Story = {
  args: {
    tasks: mixedTasks,
    defaultCollapsed: {
      ready: true,
      in_progress: true,
      blocked: true,
      other: true,
    },
  },
}

export const OnlyOpenTasks: Story = {
  args: {
    tasks: mixedTasks.filter(t => t.status === "open"),
  },
}

export const OnlyInProgress: Story = {
  args: {
    tasks: mixedTasks.filter(t => t.status === "in_progress"),
  },
}

export const OnlyBlocked: Story = {
  args: {
    tasks: mixedTasks.filter(t => t.status === "blocked"),
  },
}

export const OnlyClosed: Story = {
  args: {
    tasks: mixedTasks.filter(t => t.status === "closed"),
  },
}

export const Empty: Story = {
  args: {
    tasks: [],
  },
}

export const ShowEmptyGroups: Story = {
  args: {
    tasks: [
      { id: "rui-001", title: "Single in progress task", status: "in_progress", priority: 1 },
    ],
    showEmptyGroups: true,
    defaultCollapsed: {
      ready: false,
      in_progress: false,
      blocked: false,
      other: false,
    },
  },
}

export const ManyTasks: Story = {
  args: {
    tasks: Array.from({ length: 20 }, (_, i) => ({
      id: `rui-${String(i).padStart(3, "0")}`,
      title: `Task ${i + 1}: ${["Implement feature", "Fix bug", "Write tests", "Update docs", "Refactor code"][i % 5]}`,
      status: (["open", "in_progress", "blocked", "closed", "deferred"] as const)[i % 5],
      priority: (i % 5) as 0 | 1 | 2 | 3 | 4,
    })),
  },
}

export const WithDescriptions: Story = {
  args: {
    tasks: [
      {
        id: "rui-001",
        title: "Setup authentication",
        status: "in_progress",
        priority: 1,
        description: "Configure OAuth2 with Google and GitHub providers",
        issue_type: "epic",
      },
      {
        id: "rui-002",
        title: "Add login form",
        status: "open",
        priority: 2,
        description: "Create responsive login form with validation",
        parent: "rui-001",
        issue_type: "task",
      },
      {
        id: "rui-003",
        title: "Waiting for API docs",
        status: "blocked",
        priority: 1,
        description: "Cannot proceed until backend team provides API documentation",
        issue_type: "task",
      },
    ],
  },
}

export const PrioritySorting: Story = {
  args: {
    tasks: [
      { id: "rui-004", title: "P4 Low priority task", status: "open", priority: 4 },
      { id: "rui-001", title: "P1 High priority task", status: "open", priority: 1 },
      { id: "rui-000", title: "P0 Critical task", status: "open", priority: 0 },
      { id: "rui-002", title: "P2 Medium priority task", status: "open", priority: 2 },
      { id: "rui-003", title: "P3 Normal priority task", status: "open", priority: 3 },
    ],
    defaultCollapsed: {
      ready: false,
    },
  },
}

export const WithoutStatusHandler: Story = {
  args: {
    tasks: mixedTasks.slice(0, 3),
    onStatusChange: undefined,
  },
}
