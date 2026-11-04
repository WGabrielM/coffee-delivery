import { defineConfig, devices } from "@playwright/test";

// The smoke tests start the dev server themselves and do not need the API.
// Install the browser once with `yarn --cwd apps/app playwright install chromium`.
// PLAYWRIGHT_CHROMIUM_PATH points at an existing Chromium instead (for example in a container).
const chromiumPath = process.env["PLAYWRIGHT_CHROMIUM_PATH"];

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env["CI"]),
  retries: process.env["CI"] ? 1 : 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:5173",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        ...(chromiumPath ? { launchOptions: { executablePath: chromiumPath } } : {}),
      },
    },
  ],
  webServer: {
    command: "yarn dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env["CI"],
    timeout: 60_000,
  },
});
