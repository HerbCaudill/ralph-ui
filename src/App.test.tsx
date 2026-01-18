import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { App } from "./App"

describe("App", () => {
  it("renders the main layout with sidebar and status bar", () => {
    render(<App />)

    // Check for main heading
    expect(screen.getByText("Ralph UI")).toBeInTheDocument()

    // Check for sidebar content
    expect(screen.getByText("Tasks")).toBeInTheDocument()

    // Check for status indicators
    expect(screen.getByText(/Disconnected|Connected|Connecting/)).toBeInTheDocument()
    expect(screen.getByText(/Ralph:/)).toBeInTheDocument()
  })

  it("shows disconnected status by default", () => {
    render(<App />)
    expect(screen.getByText("Disconnected")).toBeInTheDocument()
    expect(screen.getByText("Ralph: stopped")).toBeInTheDocument()
  })
})
