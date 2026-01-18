import { test, expect } from "@playwright/test"

test("displays main layout with sidebar and content", async ({ page }) => {
  await page.goto("/")

  // Check for main heading
  await expect(page.getByRole("heading", { name: "Ralph UI" })).toBeVisible()

  // Check for sidebar heading
  await expect(page.getByRole("heading", { name: "Tasks" })).toBeVisible()

  // Check for status bar
  await expect(page.getByText("Disconnected")).toBeVisible()
})

test("can toggle sidebar", async ({ page }) => {
  await page.goto("/")

  // Sidebar should be visible initially
  await expect(page.getByRole("heading", { name: "Tasks" })).toBeVisible()

  // Click the collapse button
  await page.getByRole("button", { name: /collapse sidebar/i }).click()

  // Sidebar content should be hidden
  await expect(page.getByRole("heading", { name: "Tasks" })).not.toBeVisible()

  // Click again to expand
  await page.getByRole("button", { name: /expand sidebar/i }).click()

  // Sidebar should be visible again
  await expect(page.getByRole("heading", { name: "Tasks" })).toBeVisible()
})
