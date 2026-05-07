import { expect, test } from "@playwright/test";

import { devLogin } from "./helpers";

test.describe("auth", () => {
  test("/ redirects to /login when not authenticated", async ({ page }) => {
    await page.goto("/");
    await page.waitForURL(/\/login/);
    await expect(page.getByRole("heading", { name: "Chronos" })).toBeVisible();
  });

  test("dev-login lands on /agenda and shows the greeting", async ({ page }) => {
    await devLogin(page);
    // Greeting shows the dev user's first name in either position
    // (current week → big heading, other week → gray overline).
    await expect(page.getByText(/Hi, Local/i).first()).toBeVisible();
  });

  test("the floating assistant launcher is rendered everywhere", async ({ page }) => {
    await devLogin(page);
    await expect(page.getByLabel("Open assistant")).toBeVisible();

    await page.goto("/tasks");
    await expect(page.getByLabel("Open assistant")).toBeVisible();

    await page.goto("/settings");
    await expect(page.getByLabel("Open assistant")).toBeVisible();
  });
});
