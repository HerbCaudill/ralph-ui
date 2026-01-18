import type { Preview } from "@storybook/react"
import React from "react"
import "../src/index.css"

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      disable: true, // Use our own theming instead
    },
  },
  decorators: [
    Story => {
      return React.createElement(
        "div",
        { className: "dark bg-background text-foreground min-h-screen p-4" },
        React.createElement(Story),
      )
    },
  ],
}

export default preview
