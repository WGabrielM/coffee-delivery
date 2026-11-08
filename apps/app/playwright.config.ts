import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig, devices } from "@playwright/test";

// `yarn test:e2e` runs against the real API and database, so it starts what is missing and reuses
// what is already running:
// - Postgres is not started here: it is checked first, and the run fails with a clear message when
//   it is not reachable (`yarn infra:up` starts it).
// - The API (`yarn api:dev`, port 3000) and the app (`yarn dev`, port 5173) start by themselves when
//   nothing answers on their address, and stop when the run ends. A server that is already running
//   is reused; `e2e/global-setup.ts` checks that it is the right one.
// Install the browser once with `yarn --cwd apps/app playwright install chromium`.
// PLAYWRIGHT_CHROMIUM_PATH points at an existing Chromium instead (for example in a container).
const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const chromiumPath = process.env["PLAYWRIGHT_CHROMIUM_PATH"];

const postgres = spawnSync(process.execPath, [join(root, "scripts", "check-postgres.mjs")], {
  encoding: "utf8",
});
if (postgres.status !== 0) {
  throw new Error(postgres.stderr.trim() || "Postgres is not reachable.");
}

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
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
  webServer: [
    {
      command: "yarn api:dev",
      cwd: root,
      url: "http://localhost:3000/actuator/health",
      reuseExistingServer: true,
      // Gradle may have to compile the API first.
      timeout: 240_000,
    },
    {
      command: "yarn dev",
      url: "http://localhost:5173",
      reuseExistingServer: true,
      timeout: 60_000,
    },
  ],
});
