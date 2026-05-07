import { expect, type Page } from "@playwright/test";

/** Random suffix so concurrent runs / re-runs don't collide on event titles. */
export function uniq(prefix: string): string {
  return `${prefix} ${Math.random().toString(36).slice(2, 8)}`;
}

/** Use the dev-login button. Lands the page on /agenda. */
export async function devLogin(page: Page): Promise<void> {
  await page.goto("/login");
  await page.getByRole("button", { name: /Use the local dev account/i }).click();
  await page.waitForURL(/\/agenda(\?|$)/, { timeout: 10_000 });
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
}

/** Create an event via the Quick add form. Returns the title used. */
export async function quickAddEvent(page: Page, base = "E2E event"): Promise<string> {
  const title = uniq(base);
  await page.getByPlaceholder("Event title").fill(title);
  await page.getByRole("button", { name: "Add", exact: true }).first().click();
  // Wait for a re-render that includes our title somewhere on the page.
  await expect(page.getByText(title).first()).toBeVisible();
  return title;
}

/** Create a task via the /tasks page. Caller must already be on /tasks. */
export async function quickAddTask(page: Page, base = "E2E task"): Promise<string> {
  const title = uniq(base);
  await page.getByPlaceholder("What needs doing?").fill(title);
  await page.getByRole("button", { name: "Add", exact: true }).first().click();
  await expect(page.getByText(title).first()).toBeVisible();
  return title;
}
