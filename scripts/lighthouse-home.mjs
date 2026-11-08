// `yarn lighthouse`: builds the app, serves the build on port 5173 (the API must be running on port
// 3000), audits the Home page with the desktop preset, prints the scores, and exits 1 unless the
// performance score is at least 90 and the accessibility score at least 95. It is not run in CI.
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const MIN_PERFORMANCE = 90;
export const MIN_ACCESSIBILITY = 95;

const toPoints = (score) => (typeof score === "number" ? Math.round(score * 100) : null);

/** Whether the scores (0 to 1) meet the limits. A missing score is a failure. */
export function evaluateScores({ performance, accessibility }) {
  const failures = [];
  for (const [name, score, minimum] of [
    ["performance", performance, MIN_PERFORMANCE],
    ["accessibility", accessibility, MIN_ACCESSIBILITY],
  ]) {
    const points = toPoints(score);
    if (points === null) failures.push(`${name} has no score`);
    else if (points < minimum) failures.push(`${name} ${points} is under ${minimum}`);
  }
  return { ok: failures.length === 0, failures };
}

export function formatScores({ performance, accessibility }) {
  return `Lighthouse (desktop, Home): performance ${toPoints(performance)}, accessibility ${toPoints(accessibility)}`;
}

const APP_URL = "http://localhost:5173/";
const API_HEALTH_URL = "http://localhost:3000/actuator/health";

async function apiIsUp() {
  try {
    const response = await fetch(API_HEALTH_URL);
    return response.status === 200;
  } catch {
    return false;
  }
}

async function main() {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const appDir = join(root, "apps", "app");

  if (!(await apiIsUp())) {
    console.error(
      'The API is not running on port 3000, so the Home page would have no coffees. Run "yarn infra:up" and "yarn api:dev" first.',
    );
    return 1;
  }

  console.log("> app: yarn --cwd apps/app build");
  const build = spawnSync("yarn", ["--cwd", "apps/app", "build"], {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (build.status !== 0) {
    console.error("The build failed.");
    return build.status ?? 1;
  }

  const { preview } = await import("vite");
  let server;
  try {
    server = await preview({ root: appDir, logLevel: "warn" });
  } catch (error) {
    console.error(
      `Could not serve the build on port 5173 (is another server using it?): ${error.message}`,
    );
    return 1;
  }

  // Lighthouse drives a Chrome; the one Playwright installs is used when no CHROME_PATH is set.
  if (!process.env.CHROME_PATH) {
    const { chromium } = await import("@playwright/test");
    process.env.CHROME_PATH = chromium.executablePath();
  }
  const chromeLauncher = await import("chrome-launcher");
  const chrome = await chromeLauncher.launch({
    chromeFlags: ["--headless=new", "--no-sandbox"],
  });

  try {
    const { default: lighthouse } = await import("lighthouse");
    const { default: desktopConfig } = await import("lighthouse/core/config/desktop-config.js");
    const result = await lighthouse(
      APP_URL,
      {
        port: chrome.port,
        output: "json",
        logLevel: "error",
        onlyCategories: ["performance", "accessibility"],
      },
      desktopConfig,
    );
    const categories = result?.lhr.categories ?? {};
    const scores = {
      performance: categories.performance?.score ?? null,
      accessibility: categories.accessibility?.score ?? null,
    };
    console.log(formatScores(scores));

    // The audits that cost points, so a failing run says what to look at.
    for (const category of Object.values(categories)) {
      for (const ref of category.auditRefs) {
        const audit = result.lhr.audits[ref.id];
        if (ref.weight > 0 && audit.score !== null && audit.score < 0.9) {
          console.log(`  ${category.id}: ${audit.title} (score ${audit.score})`);
        }
      }
    }

    const verdict = evaluateScores(scores);
    if (!verdict.ok) {
      console.error(`Lighthouse failed: ${verdict.failures.join("; ")}.`);
      return 1;
    }
    return 0;
  } finally {
    await chrome.kill();
    await server.close();
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(await main());
}
