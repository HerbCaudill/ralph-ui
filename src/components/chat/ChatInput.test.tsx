import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { ChatInput } from "./ChatInput"

describe("ChatInput", () => {
  describe("rendering", () => {
    it("renders input with default placeholder", () => {
      render(<ChatInput />)
      expect(screen.getByPlaceholderText("Type a message...")).toBeInTheDocument()
    })

    it("renders input with custom placeholder", () => {
      render(<ChatInput placeholder="Send a command..." />)
      expect(screen.getByPlaceholderText("Send a command...")).toBeInTheDocument()
    })

    it("renders send button", () => {
      render(<ChatInput />)
      expect(screen.getByRole("button", { name: "Send message" })).toBeInTheDocument()
    })

    it("applies custom className", () => {
      const { container } = render(<ChatInput className="custom-class" />)
      expect(container.firstChild).toHaveClass("custom-class")
    })
  })

  describe("input behavior", () => {
    it("updates value on change", () => {
      render(<ChatInput />)
      const input = screen.getByRole("textbox")

      fireEvent.change(input, { target: { value: "Hello world" } })

      expect(input).toHaveValue("Hello world")
    })

    it("clears input after submit", () => {
      const handleSubmit = vi.fn()
      render(<ChatInput onSubmit={handleSubmit} />)
      const input = screen.getByRole("textbox")

      fireEvent.change(input, { target: { value: "Hello world" } })
      fireEvent.submit(input.closest("form")!)

      expect(input).toHaveValue("")
    })

    it("has correct ARIA label", () => {
      render(<ChatInput />)
      expect(screen.getByLabelText("Message input")).toBeInTheDocument()
    })
  })

  describe("submit behavior", () => {
    it("calls onSubmit with trimmed message on form submit", () => {
      const handleSubmit = vi.fn()
      render(<ChatInput onSubmit={handleSubmit} />)
      const input = screen.getByRole("textbox")

      fireEvent.change(input, { target: { value: "  Hello world  " } })
      fireEvent.submit(input.closest("form")!)

      expect(handleSubmit).toHaveBeenCalledWith("Hello world")
    })

    it("calls onSubmit when Enter is pressed", () => {
      const handleSubmit = vi.fn()
      render(<ChatInput onSubmit={handleSubmit} />)
      const input = screen.getByRole("textbox")

      fireEvent.change(input, { target: { value: "Hello world" } })
      fireEvent.keyDown(input, { key: "Enter" })

      expect(handleSubmit).toHaveBeenCalledWith("Hello world")
    })

    it("does not submit when Shift+Enter is pressed", () => {
      const handleSubmit = vi.fn()
      render(<ChatInput onSubmit={handleSubmit} />)
      const input = screen.getByRole("textbox")

      fireEvent.change(input, { target: { value: "Hello world" } })
      fireEvent.keyDown(input, { key: "Enter", shiftKey: true })

      expect(handleSubmit).not.toHaveBeenCalled()
    })

    it("does not submit empty message", () => {
      const handleSubmit = vi.fn()
      render(<ChatInput onSubmit={handleSubmit} />)

      fireEvent.submit(screen.getByRole("textbox").closest("form")!)

      expect(handleSubmit).not.toHaveBeenCalled()
    })

    it("does not submit whitespace-only message", () => {
      const handleSubmit = vi.fn()
      render(<ChatInput onSubmit={handleSubmit} />)
      const input = screen.getByRole("textbox")

      fireEvent.change(input, { target: { value: "   " } })
      fireEvent.submit(input.closest("form")!)

      expect(handleSubmit).not.toHaveBeenCalled()
    })

    it("calls onSubmit when button is clicked", () => {
      const handleSubmit = vi.fn()
      render(<ChatInput onSubmit={handleSubmit} />)
      const input = screen.getByRole("textbox")
      const button = screen.getByRole("button", { name: "Send message" })

      fireEvent.change(input, { target: { value: "Hello world" } })
      fireEvent.click(button)

      expect(handleSubmit).toHaveBeenCalledWith("Hello world")
    })
  })

  describe("disabled state", () => {
    it("disables input when disabled prop is true", () => {
      render(<ChatInput disabled />)
      expect(screen.getByRole("textbox")).toBeDisabled()
    })

    it("disables button when disabled prop is true", () => {
      render(<ChatInput disabled />)
      expect(screen.getByRole("button", { name: "Send message" })).toBeDisabled()
    })

    it("disables button when input is empty", () => {
      render(<ChatInput />)
      expect(screen.getByRole("button", { name: "Send message" })).toBeDisabled()
    })

    it("enables button when input has content", () => {
      render(<ChatInput />)
      const input = screen.getByRole("textbox")

      fireEvent.change(input, { target: { value: "Hello" } })

      expect(screen.getByRole("button", { name: "Send message" })).not.toBeDisabled()
    })

    it("does not submit when disabled even with content", () => {
      const handleSubmit = vi.fn()
      render(<ChatInput onSubmit={handleSubmit} disabled />)
      const input = screen.getByRole("textbox")

      fireEvent.change(input, { target: { value: "Hello world" } })
      fireEvent.keyDown(input, { key: "Enter" })

      expect(handleSubmit).not.toHaveBeenCalled()
    })
  })

  describe("styling", () => {
    it("input has correct base classes", () => {
      render(<ChatInput />)
      const input = screen.getByRole("textbox")
      expect(input).toHaveClass("border-input", "bg-background", "rounded-md")
    })

    it("button has correct base classes", () => {
      render(<ChatInput />)
      const button = screen.getByRole("button", { name: "Send message" })
      expect(button).toHaveClass("bg-primary", "text-primary-foreground", "rounded-md")
    })
  })
})
