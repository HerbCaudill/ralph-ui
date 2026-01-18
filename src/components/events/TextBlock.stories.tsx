import type { Meta, StoryObj } from "@storybook/react"
import { TextBlock, type TextEvent } from "./TextBlock"

const meta: Meta<typeof TextBlock> = {
  title: "Events/TextBlock",
  component: TextBlock,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  decorators: [
    Story => (
      <div className="border-border max-w-2xl overflow-hidden rounded-md border">
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof meta>

const baseEvent: TextEvent = {
  type: "text",
  timestamp: Date.now(),
  content: "Hello! I can help you with that task.",
}

export const Assistant: Story = {
  args: {
    event: {
      ...baseEvent,
      role: "assistant",
    },
  },
}

export const User: Story = {
  args: {
    event: {
      ...baseEvent,
      role: "user",
      content: "Can you help me fix this bug?",
    },
  },
}

export const System: Story = {
  args: {
    event: {
      ...baseEvent,
      role: "system",
      content: "Session started. Connected to workspace.",
    },
  },
}

export const WithMarkdown: Story = {
  args: {
    event: {
      ...baseEvent,
      role: "assistant",
      content: `Here's a summary of what I found:

## Key Points

1. The authentication flow needs updating
2. Tests are failing due to **missing mocks**
3. Consider using \`async/await\` instead of callbacks

### Code Example

\`\`\`typescript
async function fetchData() {
  const response = await fetch('/api/data');
  return response.json();
}
\`\`\`

Let me know if you'd like me to make these changes.`,
    },
  },
}

export const WithCodeBlock: Story = {
  args: {
    event: {
      ...baseEvent,
      role: "assistant",
      content: `I'll update the configuration file:

\`\`\`json
{
  "name": "my-app",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.2.0"
  }
}
\`\`\``,
    },
  },
}

export const WithTable: Story = {
  args: {
    event: {
      ...baseEvent,
      role: "assistant",
      content: `Here's a comparison of the options:

| Feature | Option A | Option B |
|---------|----------|----------|
| Speed | Fast | Medium |
| Memory | Low | High |
| Complexity | Simple | Complex |`,
    },
  },
}

export const WithLinks: Story = {
  args: {
    event: {
      ...baseEvent,
      role: "assistant",
      content: `Check out the [documentation](https://docs.example.com) for more details. You can also visit the [GitHub repo](https://github.com/example/repo).`,
    },
  },
}

export const WithLists: Story = {
  args: {
    event: {
      ...baseEvent,
      role: "assistant",
      content: `Here's what I'll do:

- Review the existing code
- Identify potential issues
- Make necessary fixes
- Run the test suite

After that:
1. Commit the changes
2. Create a pull request
3. Request review`,
    },
  },
}

export const LongContent: Story = {
  args: {
    event: {
      ...baseEvent,
      role: "assistant",
      content: `I've analyzed the codebase and found several areas that need attention.

## Authentication Module

The current implementation has some security concerns:

\`\`\`typescript
// Current problematic code
function validateToken(token: string) {
  return token.length > 0; // Too simple!
}
\`\`\`

This should be replaced with proper JWT validation:

\`\`\`typescript
import jwt from 'jsonwebtoken';

function validateToken(token: string): boolean {
  try {
    jwt.verify(token, process.env.JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}
\`\`\`

## Performance Issues

The main performance bottleneck is in the data fetching layer. Consider:

1. **Caching** - Add Redis caching for frequently accessed data
2. **Pagination** - Implement cursor-based pagination
3. **Lazy Loading** - Only load data when needed

## Recommendations

| Priority | Task | Effort |
|----------|------|--------|
| High | Fix auth validation | 2 hours |
| Medium | Add caching | 1 day |
| Low | Refactor pagination | 3 days |

Let me know which area you'd like me to tackle first!`,
    },
  },
}

export const AllRoles: Story = {
  render: () => (
    <div className="space-y-0">
      <TextBlock
        event={{
          type: "text",
          timestamp: Date.now() - 3000,
          role: "system",
          content: "Session started",
        }}
      />
      <TextBlock
        event={{
          type: "text",
          timestamp: Date.now() - 2000,
          role: "user",
          content: "Can you help me with this task?",
        }}
      />
      <TextBlock
        event={{
          type: "text",
          timestamp: Date.now() - 1000,
          role: "assistant",
          content: "Of course! I'd be happy to help. What do you need?",
        }}
      />
    </div>
  ),
  decorators: [
    Story => (
      <div className="border-border max-w-2xl overflow-hidden rounded-md border">
        <Story />
      </div>
    ),
  ],
}
