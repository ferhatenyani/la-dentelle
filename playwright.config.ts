import { defineConfig, devices } from "@playwright/test";

/**
 * E2E suite. By default builds and serves the production app on :3200.
 * During development point at a running dev server instead:
 *   PW_BASE_URL=http://localhost:3100 npx playwright test
 */
const externalBase = process.env.PW_BASE_URL;
const PORT = 3200;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [["list"], ["html", { open: "never" }]],
  timeout: 45_000,
  expect: { timeout: 8_000 },
  use: {
    baseURL: externalBase ?? `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    locale: "fr-FR",
    timezoneId: "Africa/Algiers",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: externalBase
    ? undefined
    : {
        command: `npx next build && npx next start -p ${PORT}`,
        url: `http://localhost:${PORT}`,
        reuseExistingServer: !process.env.CI,
        timeout: 240_000,
      },
});
