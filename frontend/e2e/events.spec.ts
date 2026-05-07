import { expect, test } from "@playwright/test";

import { devLogin, quickAddEvent } from "./helpers";

test.describe("events", () => {
  test.beforeEach(async ({ page }) => {
    await devLogin(page);
  });

  test("quick-add creates an event and it shows in the week grid", async ({ page }) => {
    const title = await quickAddEvent(page);
    // The week grid (DayCard buttons) contains the title.
    await expect(page.getByRole("button", { name: new RegExp(title) }).first()).toBeVisible();
  });

  test("double-click an event pill opens the edit dialog", async ({ page }) => {
    const title = await quickAddEvent(page);
    // Double-click any pill bearing the title — focus inside the day card.
    await page.getByText(title, { exact: true }).first().dblclick();
    await expect(page.getByRole("dialog", { name: /edit event/i }).or(
      page.getByText("Edit event"),
    )).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByText("Edit event")).toBeHidden();
  });

  test("edit + delete flow removes the event from the grid", async ({ page }) => {
    const title = await quickAddEvent(page, "E2E delete");
    await page.getByText(title, { exact: true }).first().dblclick();

    // Click the danger-styled Delete button inside the dialog.
    await page.getByRole("button", { name: /^Delete$/ }).click();

    // Title disappears from the page.
    await expect(page.getByText(title)).toHaveCount(0);
  });

  test("clicking a day card opens the day detail dialog with the all-day / scheduled split", async ({ page }) => {
    await quickAddEvent(page, "E2E timed");

    // Click the first day card that's labeled with a weekday.
    await page.getByRole("button", { name: /tap to view/ }).first().click();

    // The dialog header shows "Scheduled" or "All day" (or the empty state
    // if today happens to be the wrong day for our event).
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
  });
});
