import type { Meta, StoryObj } from "@storybook/react"
import { Header } from "./Header"
import { withStoreState } from "../../../.storybook/decorators"

const meta: Meta<typeof Header> = {
  title: "Layout/Header",
  component: Header,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof meta>

export const Connected: Story = {
  decorators: [
    withStoreState({
      connectionStatus: "connected",
      workspace: "/Users/dev/projects/my-app",
      accentColor: "#007ACC",
    }),
  ],
}

export const Connecting: Story = {
  decorators: [
    withStoreState({
      connectionStatus: "connecting",
      workspace: null,
      accentColor: "#FFA500",
    }),
  ],
}

export const Disconnected: Story = {
  decorators: [
    withStoreState({
      connectionStatus: "disconnected",
      workspace: null,
      accentColor: "#DC3545",
    }),
  ],
}

export const WithPeacockColor: Story = {
  decorators: [
    withStoreState({
      connectionStatus: "connected",
      workspace: "/Users/dev/projects/feature-branch",
      accentColor: "#42B883",
    }),
  ],
}

export const DefaultAccentColor: Story = {
  decorators: [
    withStoreState({
      connectionStatus: "connected",
      workspace: "/Users/dev/projects/my-app",
      accentColor: null,
    }),
  ],
}

export const LongWorkspacePath: Story = {
  decorators: [
    withStoreState({
      connectionStatus: "connected",
      workspace:
        "/Users/developer/Documents/Projects/enterprise/very-long-project-name-that-might-overflow",
      accentColor: "#9B59B6",
    }),
  ],
}
