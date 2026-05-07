import { expect, test } from "@playwright/test";

import { devLogin } from "./helpers";

/**
 * The bubble's chat call routes through the Spring Boot API to whichever
 * LLM is configured. CI runs without `AGENT_KEY`, so the API falls back
 * to Ollama, which isn't running — the AssistantService catches the
 * `LlmException` and returns a friendly error reply. We test that the
 * bubble surfaces *some* assistant response (either a real one or the
 * configured-error one), and that the launcher / clear / Cmd-K wiring
 * all work.
 */
test.describe("assistant bubble", () => {
  test.beforeEach(async ({ page }) => {
    await devLogin(page);
  });

  test("Cmd/Ctrl-K opens and closes the bubble", async ({ page }) => {
    await page.keyboard.press("ControlOrMeta+K");
    await expect(page.getByRole("dialog", { name: /Chronos assistant/i })).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: /Chronos assistant/i })).toBeHidden();
  });

  test("clicking the floating launcher opens the bubble", async ({ page }) => {
    await page.getByLabel("Open assistant").click();
    await expect(page.getByRole("dialog", { name: /Chronos assistant/i })).toBeVisible();

    await page.getByLabel("Close assistant").click();
    await expect(page.getByRole("dialog", { name: /Chronos assistant/i })).toBeHidden();
  });

  test("sending a message produces an assistant turn (real or system error)", async ({ page }) => {
    await page.getByLabel("Open assistant").click();
    const textarea = page.getByPlaceholder(/Ask the assistant/);
    await textarea.fill("ping");
    await textarea.press("Enter");

    // The user turn shows the message; the assistant turn shows up under
    // a backend label (anthropic / gemini / ollama / system).
    await expect(page.getByText("ping").first()).toBeVisible();
    // Wait for any second list item (the assistant reply) — generous
    // timeout because real LLM calls take a few seconds.
    await expect(
      page.locator('[role="dialog"][aria-label*="assistant"] li').nth(1),
    ).toBeVisible({ timeout: 30_000 });
  });

  test("Clear conversation resets the bubble's message list", async ({ page }) => {
    await page.getByLabel("Open assistant").click();
    const textarea = page.getByPlaceholder(/Ask the assistant/);
    await textarea.fill("ping for clear test");
    await textarea.press("Enter");
    await expect(page.getByText("ping for clear test")).toBeVisible();

    await page.getByLabel("Clear conversation").click();
    // After clear, the suggestion list reappears (no messages).
    await expect(page.getByText("ping for clear test")).toBeHidden();
  });
});
