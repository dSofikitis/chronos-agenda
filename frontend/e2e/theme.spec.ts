import { expect, test } from "@playwright/test";

import { devLogin } from "./helpers";

test.describe("theme + accent", () => {
  test.beforeEach(async ({ page }) => {
    await devLogin(page);
  });

  test("theme toggle flips the html.dark class", async ({ page }) => {
    await page.getByLabel("Theme").click();
    await page.getByRole("menuitemradio", { name: "Light" }).click();
    await expect(page.locator("html")).not.toHaveClass(/(^|\s)dark(\s|$)/);

    await page.getByLabel("Theme").click();
    await page.getByRole("menuitemradio", { name: "Dark" }).click();
    await expect(page.locator("html")).toHaveClass(/(^|\s)dark(\s|$)/);
  });

  test("accent picker rewrites --c-brand-light", async ({ page }) => {
    await page.goto("/settings");

    // Read the inline style value before, click a different accent, then
    // confirm the var changed. The accent picker uses radio buttons by
    // label.
    const before = await page.locator("html").evaluate((el) => el.style.getPropertyValue("--c-brand-light"));
    await page.getByRole("radio", { name: "Emerald" }).click();
    await expect(page.locator("html")).toHaveAttribute("style", /--c-brand-light: 16 185 129/);
    expect(before).not.toContain("16 185 129");
  });

  test("preferences persist across reloads (localStorage hydration)", async ({ page }) => {
    await page.goto("/settings");
    await page.getByRole("radio", { name: "Violet" }).click();
    await expect(page.locator("html")).toHaveAttribute("style", /--c-brand-light: 139 92 246/);

    await page.reload();
    // The no-flash inline script applies the accent before React mounts.
    await expect(page.locator("html")).toHaveAttribute("style", /--c-brand-light: 139 92 246/);
  });
});
