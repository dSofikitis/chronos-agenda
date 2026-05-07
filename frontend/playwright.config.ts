import { defineConfig, devices } from "@playwright/test";

const FRONTEND_URL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

/**
 * E2E suite for Chronos. Tests assume a running Postgres + Spring Boot API +
 * Next.js dev server. CI brings them up via the workflow; locally, either
 * `make dev` works or set `E2E_REUSE=1` to point at already-running services.
 *
 * Each spec relies on the dev-login flow (POST /api/auth/dev-login) so no
 * real Google credentials are needed. Specs create uniquely-named events /
 * tasks (with a per-test random suffix) and clean up after themselves; no
 * shared mutable state across tests.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,           // single user → DB-mutating tests step on each other if parallel
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: {
    baseURL: FRONTEND_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  // Outside CI we let `npm run dev` do the lifting; CI starts the services
  // explicitly in the workflow because two processes (API + frontend) can't
  // share Playwright's single `webServer` slot.
  webServer: process.env.CI || process.env.E2E_REUSE
    ? undefined
    : {
        command:
          "cross-env CHRONOS_API_URL=http://localhost:8080 NEXT_PUBLIC_CHRONOS_API_URL=http://localhost:8080 npm run dev",
        url: FRONTEND_URL + "/login",
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
