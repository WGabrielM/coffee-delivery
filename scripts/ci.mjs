// `yarn ci`: runs on this machine the same commands, in the same order, as the jobs of
// `.github/workflows/ci.yml` (api, then app, then e2e). A test (`ci.test.mjs`) keeps the workflow and
// this list the same. Prerequisites: `yarn local:setup` (the dependencies, `.env.local`, and Postgres)
// and the Chromium of Playwright. `node scripts/ci.mjs app` runs one job.
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const gradle = (...args) => ({ command: "./gradlew", args, cwd: "apps/api" });
const root = (command, ...args) => ({ command, args, cwd: "." });

/** The commands of each job of the workflow. The API is checked with Gradle, the rest with Yarn. */
export const JOBS = {
  api: [
    gradle("spotlessCheck"),
    gradle("compileJava", "compileTestJava"),
    gradle("test"),
    gradle("build", "-x", "test", "-x", "e2eTest"),
  ],
  app: [
    root("yarn", "oxlint", "."),
    root("yarn", "oxfmt", "--check", "."),
    root("node", "--test", "scripts/*.test.mjs"),
    root("yarn", "--cwd", "apps/app", "types:check"),
    root("yarn", "--cwd", "apps/app", "test"),
    root("yarn", "--cwd", "apps/app", "build"),
  ],
  e2e: [root("yarn", "test:e2e")],
};

export const formatStep = ({ command, args }) => [command, ...args].join(" ");

/** The steps to run, each with its job: all the jobs in order, or one. */
export function planCi(job) {
  if (job !== undefined && !Object.hasOwn(JOBS, job)) {
    throw new Error(`Unknown job "${job}". Jobs: ${Object.keys(JOBS).join(", ")}.`);
  }
  const names = job === undefined ? Object.keys(JOBS) : [job];
  return names.flatMap((name) => JOBS[name].map((step) => ({ ...step, job: name })));
}

function main() {
  const repository = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  let steps;
  try {
    steps = planCi(process.argv[2]);
  } catch (error) {
    console.error(error.message);
    return 2;
  }

  for (const step of steps) {
    console.log(`> ${step.job}: ${formatStep(step)}`);
    const windows = process.platform === "win32";
    const result = spawnSync(
      windows && step.command === "./gradlew" ? ".\\gradlew.bat" : step.command,
      step.args,
      { cwd: join(repository, step.cwd), stdio: "inherit", shell: windows },
    );
    if (result.error) {
      console.error(`Could not start ${step.command}: ${result.error.message}`);
      return 1;
    }
    if (result.status !== 0) {
      console.error(`${step.job} failed on "${formatStep(step)}" (exit ${result.status}).`);
      return result.status ?? 1;
    }
  }
  console.log(
    `ci: ${steps.length} command(s) passed (${[...new Set(steps.map((s) => s.job))].join(", ")}).`,
  );
  return 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(main());
}
