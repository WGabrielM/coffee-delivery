// Runs one k6 load profile against the API: `node scripts/load.mjs smoke`.
// k6 must be installed (https://grafana.com/docs/k6/latest/set-up/install-k6/).
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const DEFAULT_BASE_URL = "http://localhost:3000";

export function planLoad(profile, { exists, env }) {
  const script = `apps/api/load/${profile}.js`;
  if (!profile || !/^[a-z][a-z-]*$/.test(profile) || !exists(script)) {
    throw new Error(`Unknown load profile "${profile ?? ""}": ${script} does not exist.`);
  }
  return {
    command: "k6",
    args: ["run", script],
    env: { BASE_URL: env.BASE_URL ?? DEFAULT_BASE_URL },
  };
}

function main(profile) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  let plan;
  try {
    plan = planLoad(profile, {
      exists: (path) => existsSync(join(root, path)),
      env: process.env,
    });
  } catch (error) {
    console.error(error.message);
    return 2;
  }
  console.log(`> load: ${[plan.command, ...plan.args].join(" ")} (BASE_URL=${plan.env.BASE_URL})`);
  const result = spawnSync(plan.command, plan.args, {
    cwd: root,
    env: { ...process.env, ...plan.env },
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (result.error || result.status === 127) {
    console.error(
      "Could not run k6. Install it (Windows: `winget install k6`, macOS: `brew install k6`) and start the API with `yarn api:dev`.",
    );
    return 1;
  }
  return result.status ?? 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(main(process.argv[2]));
}
