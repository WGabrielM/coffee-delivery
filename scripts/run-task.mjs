// Runs one root task (code:fix, lint, types:check, test, test:e2e, build) in every workspace that exists.
// The API is a Gradle project and the app is a Yarn workspace; a workspace that does not exist yet is skipped
// and named in the summary, so the QA commands stay green while the project grows spec by spec.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const TASKS = ["code:fix", "lint", "types:check", "test", "test:e2e", "build"];

const ROOT_STEPS = {
  "code:fix": [
    ["yarn", "oxlint", "--fix", "."],
    ["yarn", "oxfmt", "--write", "."],
  ],
  lint: [
    ["yarn", "oxlint", "."],
    ["yarn", "oxfmt", "--check", "."],
  ],
  test: [["node", "--test", "scripts/*.test.mjs"]],
};

const GRADLE_TASKS = {
  "code:fix": ["spotlessApply"],
  lint: ["spotlessCheck"],
  "types:check": ["compileJava", "compileTestJava"],
  test: ["test"],
  "test:e2e": ["e2eTest", "jacocoTestCoverageVerification"],
  build: ["build", "-x", "test", "-x", "e2eTest"],
};

export function planTask(task, context) {
  if (!TASKS.includes(task)) {
    throw new Error(`Unknown task "${task}". Tasks: ${TASKS.join(", ")}.`);
  }
  const { exists, appScripts, platform } = context;
  const steps = [];
  const skipped = [];

  const rootSteps = ROOT_STEPS[task];
  if (rootSteps) {
    for (const [command, ...args] of rootSteps)
      steps.push({ workspace: "root", command, args, cwd: "." });
  } else {
    skipped.push({ workspace: "root", reason: `no root step for ${task}` });
  }

  if (exists("apps/api/gradlew")) {
    const command = platform === "win32" ? "gradlew.bat" : "./gradlew";
    steps.push({ workspace: "api", command, args: GRADLE_TASKS[task], cwd: "apps/api" });
  } else {
    skipped.push({ workspace: "api", reason: "apps/api not created yet" });
  }

  if (!exists("apps/app/package.json")) {
    skipped.push({ workspace: "app", reason: "apps/app not created yet" });
  } else if (!appScripts().includes(task)) {
    skipped.push({ workspace: "app", reason: `apps/app has no "${task}" script` });
  } else {
    steps.push({
      workspace: "app",
      command: "yarn",
      args: ["--cwd", "apps/app", "run", task],
      cwd: ".",
    });
  }

  return { steps, skipped };
}

export function formatSummary(task, plan) {
  const ran = [...new Set(plan.steps.map((step) => step.workspace))];
  const skipped = plan.skipped.map((entry) => `${entry.workspace} (${entry.reason})`);
  return `Task "${task}" - ran: ${ran.length ? ran.join(", ") : "none"} - skipped: ${skipped.length ? skipped.join(", ") : "none"}`;
}

function main(task) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const context = {
    exists: (path) => existsSync(join(root, path)),
    appScripts: () => {
      try {
        const pkg = JSON.parse(readFileSync(join(root, "apps/app/package.json"), "utf8"));
        return Object.keys(pkg.scripts ?? {});
      } catch {
        return [];
      }
    },
    platform: process.platform,
  };

  let plan;
  try {
    plan = planTask(task, context);
  } catch (error) {
    console.error(error.message);
    return 2;
  }

  for (const step of plan.steps) {
    console.log(`> ${step.workspace}: ${[step.command, ...step.args].join(" ")}`);
    const result = spawnSync(step.command, step.args, {
      cwd: join(root, step.cwd),
      stdio: "inherit",
      shell: process.platform === "win32",
    });
    if (result.error) {
      console.error(`Could not start ${step.command}: ${result.error.message}`);
      return 1;
    }
    if (result.status !== 0) {
      console.error(`${step.workspace} failed on "${task}" (exit ${result.status}).`);
      return result.status ?? 1;
    }
  }

  console.log(formatSummary(task, plan));
  return 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(main(process.argv[2] ?? ""));
}
