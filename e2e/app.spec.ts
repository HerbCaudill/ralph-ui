import { test, expect } from "@playwright/test"

test("displays main layout with sidebar and content", async ({ page }) => {
  await page.goto("/")

  // Check for sidebar (TaskSidebar is a pure layout component without heading)
  await expect(page.getByRole("complementary", { name: "Task sidebar" })).toBeVisible()

  // Check for event stream
  await expect(page.getByRole("log", { name: "Event stream" })).toBeVisible()

  // Check for chat input
  await expect(page.getByRole("textbox", { name: "Message input" })).toBeVisible()

  // Check for status bar (connection status)
  await expect(page.getByRole("contentinfo")).toBeVisible()
})

test("can toggle sidebar", async ({ page }) => {
  await page.goto("/")

  // Sidebar should be visible initially
  await expect(page.getByRole("complementary", { name: "Task sidebar" })).toBeVisible()

  // Click the collapse button
  await page.getByRole("button", { name: /collapse sidebar/i }).click()

  // Sidebar content should be hidden
  await expect(page.getByRole("complementary", { name: "Task sidebar" })).not.toBeVisible()

  // Click again to expand
  await page.getByRole("button", { name: /expand sidebar/i }).click()

  // Sidebar should be visible again
  await expect(page.getByRole("complementary", { name: "Task sidebar" })).toBeVisible()
})
