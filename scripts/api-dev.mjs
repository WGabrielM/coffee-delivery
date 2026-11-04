// Starts the API on port 3000 with the settings of .env.local, against the database of `yarn infra:up`.
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { readEnvFile } from "./env-file.mjs";
import { ensureEnvLocal } from "./env-setup.mjs";

export function planApiDev({ platform, envFile }) {
  return {
    command: platform === "win32" ? ".\\gradlew.bat" : "./gradlew",
    args: ["bootRun"],
    cwd: "apps/api",
    env: { ...envFile },
  };
}

function main() {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  ensureEnvLocal(root);
  const plan = planApiDev({
    platform: process.platform,
    envFile: readEnvFile(join(root, ".env.local")),
  });
  console.log(`> api: ${[plan.command, ...plan.args].join(" ")} (settings from .env.local)`);
  const result = spawnSync(plan.command, plan.args, {
    cwd: join(root, plan.cwd),
    env: { ...process.env, ...plan.env },
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (result.error) {
    console.error(`Could not start ${plan.command}: ${result.error.message}`);
    return 1;
  }
  return result.status ?? 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(main());
}
