import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, beforeEach } from "vitest"
import { Header } from "./Header"
import { useAppStore } from "@/store"

describe("Header", () => {
  beforeEach(() => {
    // Reset store state before each test
    useAppStore.getState().reset()
  })

  it("renders the logo", () => {
    render(<Header />)
    expect(screen.getByText("Ralph")).toBeInTheDocument()
  })

  it("shows 'No workspace' when workspace is null", () => {
    render(<Header />)
    expect(screen.getByText("No workspace")).toBeInTheDocument()
  })

  it("shows workspace name when workspace is set", () => {
    useAppStore.getState().setWorkspace("/path/to/my-project")
    render(<Header />)
    expect(screen.getByText("my-project")).toBeInTheDocument()
  })

  it("shows 'Disconnected' status when disconnected", () => {
    render(<Header />)
    expect(screen.getByText("Disconnected")).toBeInTheDocument()
  })

  it("shows 'Connected' status when connected", () => {
    useAppStore.getState().setConnectionStatus("connected")
    render(<Header />)
    expect(screen.getByText("Connected")).toBeInTheDocument()
  })

  it("shows 'Connecting...' status when connecting", () => {
    useAppStore.getState().setConnectionStatus("connecting")
    render(<Header />)
    expect(screen.getByText("Connecting...")).toBeInTheDocument()
  })

  it("toggles workspace dropdown when clicked", () => {
    useAppStore.getState().setWorkspace("/path/to/my-project")
    render(<Header />)

    // Dropdown should be closed initially
    expect(screen.queryByText("Open workspace...")).not.toBeInTheDocument()

    // Click the workspace picker button
    const workspaceButton = screen.getByRole("button", { expanded: false })
    fireEvent.click(workspaceButton)

    // Dropdown should be open
    expect(screen.getByText("Open workspace...")).toBeInTheDocument()
  })

  it("closes dropdown when clicking outside", () => {
    useAppStore.getState().setWorkspace("/path/to/my-project")
    render(<Header />)

    // Open the dropdown
    const workspaceButton = screen.getByRole("button", { expanded: false })
    fireEvent.click(workspaceButton)

    // Dropdown should be open
    expect(screen.getByText("Open workspace...")).toBeInTheDocument()

    // Click outside (on the document)
    fireEvent.mouseDown(document.body)

    // Dropdown should be closed
    expect(screen.queryByText("Open workspace...")).not.toBeInTheDocument()
  })

  it("applies custom className", () => {
    const { container } = render(<Header className="custom-class" />)
    expect(container.firstChild).toHaveClass("custom-class")
  })
})
