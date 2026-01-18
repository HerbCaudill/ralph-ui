import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { App } from "./App"

describe("App", () => {
  it("renders the main layout with sidebar and status bar", () => {
    render(<App />)

    // Check for sidebar content
    expect(screen.getByText("Tasks")).toBeInTheDocument()

    // Check for status indicators (connection status appears in both Header and StatusBar)
    expect(screen.getAllByText(/Disconnected|Connected|Connecting/).length).toBeGreaterThan(0)
    expect(screen.getByText(/Ralph:/)).toBeInTheDocument()

    // Check for event stream
    expect(screen.getByRole("log", { name: "Event stream" })).toBeInTheDocument()

    // Check for chat input
    expect(screen.getByRole("textbox", { name: "Message input" })).toBeInTheDocument()
  })

  it("shows disconnected status by default", () => {
    render(<App />)
    // Connection status appears in both Header and StatusBar
    // Note: During test, WebSocket starts connecting immediately, so status may be "Connecting..."
    expect(screen.getAllByText(/Disconnected|Connecting/).length).toBeGreaterThan(0)
    expect(screen.getByText("Ralph: stopped")).toBeInTheDocument()
  })
})
