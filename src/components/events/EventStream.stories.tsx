import type { Meta, StoryObj } from "@storybook/react"
import { EventStream } from "./EventStream"
import { useAppStore } from "@/store"
import { useEffect } from "react"

const meta: Meta<typeof EventStream> = {
  title: "Events/EventStream",
  component: EventStream,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  decorators: [
    Story => (
      <div className="border-border h-96 overflow-hidden rounded-md border">
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof meta>

// Helper to add events to the store
function EventLoader({
  events,
}: {
  events: Array<{ type: string; timestamp: number; [key: string]: unknown }>
}) {
  useEffect(() => {
    const store = useAppStore.getState()
    // Clear existing events first
    store.clearEvents()
    // Add new events
    events.forEach(event => store.addEvent(event))
  }, [events])
  return null
}

const sampleEvents = [
  { type: "session_start", timestamp: Date.now() - 10000 },
  {
    type: "user_message",
    timestamp: Date.now() - 9000,
    message: "Can you help me fix the login bug?",
  },
  { type: "text", timestamp: Date.now() - 8000, content: "Of course! Let me analyze the issue." },
  { type: "tool_use", timestamp: Date.now() - 7000, tool: "Read", file: "/src/auth/login.ts" },
  { type: "tool_result", timestamp: Date.now() - 6500, tool: "Read", status: "success" },
  {
    type: "text",
    timestamp: Date.now() - 6000,
    content: "I found the issue. The token validation is incorrect.",
  },
  { type: "tool_use", timestamp: Date.now() - 5000, tool: "Edit", file: "/src/auth/login.ts" },
  { type: "tool_result", timestamp: Date.now() - 4500, tool: "Edit", status: "success" },
  { type: "text", timestamp: Date.now() - 4000, content: "Fixed! Running tests now..." },
  { type: "tool_use", timestamp: Date.now() - 3000, tool: "Bash", command: "npm test" },
  { type: "output", timestamp: Date.now() - 2500, line: "Running tests..." },
  { type: "output", timestamp: Date.now() - 2000, line: "All tests passed!" },
  { type: "tool_result", timestamp: Date.now() - 1500, tool: "Bash", status: "success" },
  {
    type: "text",
    timestamp: Date.now() - 1000,
    content: "All done! The login bug has been fixed.",
  },
]

export const Default: Story = {
  render: args => (
    <>
      <EventLoader events={sampleEvents} />
      <EventStream {...args} />
    </>
  ),
}

export const Empty: Story = {
  render: args => (
    <>
      <EventLoader events={[]} />
      <EventStream {...args} />
    </>
  ),
}

export const WithUserMessage: Story = {
  render: args => (
    <>
      <EventLoader
        events={[
          { type: "user_message", timestamp: Date.now(), message: "Hello, can you help me?" },
        ]}
      />
      <EventStream {...args} />
    </>
  ),
}

export const WithError: Story = {
  render: args => (
    <>
      <EventLoader
        events={[
          { type: "session_start", timestamp: Date.now() - 5000 },
          { type: "tool_use", timestamp: Date.now() - 4000, tool: "Bash", command: "npm build" },
          { type: "error", timestamp: Date.now() - 3000, error: "Build failed: Module not found" },
          {
            type: "text",
            timestamp: Date.now() - 2000,
            content: "There was an error during the build. Let me investigate.",
          },
        ]}
      />
      <EventStream {...args} />
    </>
  ),
}

export const ManyEvents: Story = {
  render: args => {
    const manyEvents = Array.from({ length: 50 }, (_, i) => ({
      type:
        i % 3 === 0 ? "user_message"
        : i % 3 === 1 ? "text"
        : "output",
      timestamp: Date.now() - (50 - i) * 1000,
      ...(i % 3 === 0 ? { message: `User message ${i}` }
      : i % 3 === 1 ? { content: `Claude response ${i}` }
      : { line: `Output line ${i}` }),
    }))
    return (
      <>
        <EventLoader events={manyEvents} />
        <EventStream {...args} />
      </>
    )
  },
}

export const LimitedEvents: Story = {
  args: {
    maxEvents: 5,
  },
  render: args => {
    const events = Array.from({ length: 10 }, (_, i) => ({
      type: "output",
      timestamp: Date.now() - (10 - i) * 1000,
      line: `Event ${i + 1} of 10`,
    }))
    return (
      <>
        <EventLoader events={events} />
        <EventStream {...args} />
      </>
    )
  },
}

export const RealTimeSimulation: Story = {
  render: args => {
    // Component that adds events over time
    function RealTimeEvents() {
      useEffect(() => {
        const store = useAppStore.getState()
        store.clearEvents()

        const events = [
          { type: "session_start", delay: 0 },
          { type: "user_message", message: "Start the task", delay: 500 },
          { type: "text", content: "Starting...", delay: 1000 },
          { type: "tool_use", tool: "Read", file: "/package.json", delay: 1500 },
          { type: "output", line: "Reading file...", delay: 2000 },
          { type: "text", content: "Found the file.", delay: 2500 },
        ]

        const timeouts: ReturnType<typeof setTimeout>[] = []
        events.forEach(event => {
          const timeout = setTimeout(() => {
            const { delay, ...eventData } = event
            store.addEvent({ ...eventData, timestamp: Date.now() })
          }, event.delay)
          timeouts.push(timeout)
        })

        return () => timeouts.forEach(clearTimeout)
      }, [])
      return null
    }

    return (
      <>
        <RealTimeEvents />
        <EventStream {...args} />
      </>
    )
  },
}
