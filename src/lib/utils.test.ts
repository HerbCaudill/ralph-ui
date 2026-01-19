import { describe, it, expect } from "vitest"
import { cn, getContrastingColor, toRelativePath } from "./utils"

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar")
  })

  it("handles conditional classes", () => {
    expect(cn("foo", false && "bar", "baz")).toBe("foo baz")
  })

  it("merges tailwind classes correctly", () => {
    expect(cn("p-2", "p-4")).toBe("p-4")
  })
})

describe("getContrastingColor", () => {
  it("returns white for dark backgrounds", () => {
    expect(getContrastingColor("#000000")).toBe("#ffffff")
    expect(getContrastingColor("#1a1a1a")).toBe("#ffffff")
    expect(getContrastingColor("#333333")).toBe("#ffffff")
    expect(getContrastingColor("#4d9697")).toBe("#ffffff") // Teal peacock color
  })

  it("returns black for light backgrounds", () => {
    expect(getContrastingColor("#ffffff")).toBe("#000000")
    expect(getContrastingColor("#f0f0f0")).toBe("#000000")
    expect(getContrastingColor("#cccccc")).toBe("#000000")
    expect(getContrastingColor("#ffcc00")).toBe("#000000") // Yellow
  })

  it("handles colors without hash prefix", () => {
    expect(getContrastingColor("000000")).toBe("#ffffff")
    expect(getContrastingColor("ffffff")).toBe("#000000")
  })

  it("handles various accent colors correctly", () => {
    // Blue (VS Code default) - dark enough for white text
    expect(getContrastingColor("#007ACC")).toBe("#ffffff")
    // Green (Vue) - bright enough for white text (luminance ~0.36)
    expect(getContrastingColor("#42B883")).toBe("#ffffff")
    // Purple - dark enough for white text
    expect(getContrastingColor("#9B59B6")).toBe("#ffffff")
    // Orange - light enough for black text
    expect(getContrastingColor("#FFA500")).toBe("#000000")
    // Red - medium, but dark enough for white text
    expect(getContrastingColor("#FF0000")).toBe("#ffffff")
  })
})

describe("toRelativePath", () => {
  it("returns relative path when file is in workspace", () => {
    const workspace = "/Users/herbcaudill/Code/HerbCaudill/ralph-ui"
    const filePath = "/Users/herbcaudill/Code/HerbCaudill/ralph-ui/src/components/ui/dialog.tsx"
    expect(toRelativePath(filePath, workspace)).toBe("src/components/ui/dialog.tsx")
  })

  it("returns original path when workspace is null", () => {
    const filePath = "/Users/herbcaudill/Code/HerbCaudill/ralph-ui/src/components/ui/dialog.tsx"
    expect(toRelativePath(filePath, null)).toBe(filePath)
  })

  it("returns original path when file is not in workspace", () => {
    const workspace = "/Users/herbcaudill/Code/HerbCaudill/ralph-ui"
    const filePath = "/Users/herbcaudill/Code/HerbCaudill/other-project/src/index.ts"
    expect(toRelativePath(filePath, workspace)).toBe(filePath)
  })

  it("handles workspace path with trailing slash", () => {
    const workspace = "/Users/herbcaudill/Code/HerbCaudill/ralph-ui/"
    const filePath = "/Users/herbcaudill/Code/HerbCaudill/ralph-ui/src/App.tsx"
    expect(toRelativePath(filePath, workspace)).toBe("src/App.tsx")
  })

  it("handles nested file paths correctly", () => {
    const workspace = "/Users/herbcaudill/Code/HerbCaudill/ralph-ui"
    const filePath =
      "/Users/herbcaudill/Code/HerbCaudill/ralph-ui/src/components/events/EventStream.tsx"
    expect(toRelativePath(filePath, workspace)).toBe("src/components/events/EventStream.tsx")
  })

  it("handles root-level files in workspace", () => {
    const workspace = "/Users/herbcaudill/Code/HerbCaudill/ralph-ui"
    const filePath = "/Users/herbcaudill/Code/HerbCaudill/ralph-ui/package.json"
    expect(toRelativePath(filePath, workspace)).toBe("package.json")
  })

  it("does not strip partial path matches", () => {
    const workspace = "/Users/test/project"
    const filePath = "/Users/test/project-backup/src/index.ts"
    expect(toRelativePath(filePath, workspace)).toBe(filePath)
  })
})
