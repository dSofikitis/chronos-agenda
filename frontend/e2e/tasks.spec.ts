import { expect, test } from "@playwright/test";

import { devLogin, quickAddTask } from "./helpers";

test.describe("tasks", () => {
  test.beforeEach(async ({ page }) => {
    await devLogin(page);
    await page.goto("/tasks");
  });

  test("quick-add creates a task in the Open section", async ({ page }) => {
    const title = await quickAddTask(page);
    const openSection = page.locator("section").filter({ hasText: /^Open / });
    await expect(openSection.getByText(title)).toBeVisible();
  });

  test("toggle moves the task between Open and Done", async ({ page }) => {
    const title = await quickAddTask(page);
    const row = page.locator("li").filter({ hasText: title }).first();

    await row.getByRole("button", { name: /Mark task done/ }).click();
    const doneSection = page.locator("section").filter({ hasText: /^Done / });
    await expect(doneSection.getByText(title)).toBeVisible();

    // Toggle back.
    await row.getByRole("button", { name: /Mark task open/ }).click();
    const openSection = page.locator("section").filter({ hasText: /^Open / });
    await expect(openSection.getByText(title)).toBeVisible();
  });

  test("delete removes the task from both sections", async ({ page }) => {
    const title = await quickAddTask(page, "E2E delete");
    const row = page.locator("li").filter({ hasText: title }).first();

    await row.getByRole("button", { name: "Delete task" }).click();
    await expect(page.getByText(title)).toHaveCount(0);
  });

  test("double-click row opens the task edit dialog", async ({ page }) => {
    const title = await quickAddTask(page, "E2E edit");
    const titleEl = page.locator("li").filter({ hasText: title }).getByText(title).first();

    await titleEl.dblclick();
    await expect(page.getByText("Edit task")).toBeVisible();
    await page.keyboard.press("Escape");
  });
});
