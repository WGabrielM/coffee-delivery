// `yarn db:backup`: writes a pg_dump of the live database (custom format, with the date in the name)
// to backups/ (ignored by Git) through the Postgres container of compose.yaml, and prints the file
// and its size (spec 037). The commands are built by pure functions, so a test can check them.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { readEnvFile } from "./env-file.mjs";
import { ensureEnvLocal } from "./env-setup.mjs";

export const BACKUP_DIR = "backups";

/** The SQL that counts the rows the restore check compares. */
export const COUNT_SQL =
  "SELECT (SELECT count(*) FROM coffees), (SELECT count(*) FROM orders), (SELECT count(*) FROM order_items)";

/** `coffee_delivery-2026-11-10T14-30-05Z.dump`: sorts by date and has no character a shell dislikes. */
export function backupFileName(database, date) {
  const stamp = date
    .toISOString()
    .replace(/[.]\d+Z$/, "Z")
    .replaceAll(":", "-");
  return `${database}-${stamp}.dump`;
}

/** The database settings of the environment, or an error that names the one that is missing. */
export function databaseSettings(env) {
  for (const key of ["POSTGRES_DB", "POSTGRES_USER"]) {
    if (!env[key]) throw new Error(`${key} is not set. Run "yarn env:setup" to create .env.local.`);
  }
  return { database: env.POSTGRES_DB, user: env.POSTGRES_USER };
}

/** `docker compose exec` in the postgres service, with no TTY so a file can be piped in and out. */
export function composeExec(...command) {
  return ["compose", "--env-file", ".env.local", "exec", "-T", "postgres", ...command];
}

export function planBackup({ env, date }) {
  const { database, user } = databaseSettings(env);
  return {
    file: `${BACKUP_DIR}/${backupFileName(database, date)}`,
    command: "docker",
    // The password stays in the container: pg_dump connects on its local socket as the user.
    args: composeExec("pg_dump", "--format=custom", `--username=${user}`, `--dbname=${database}`),
  };
}

export function notRunningMessage() {
  return 'The postgres container is not running, so there is nothing to back up. Run "yarn infra:up" first.';
}

/** The three counts of `COUNT_SQL`, from the output of psql with the separator "|". */
export function parseRows(output) {
  const match = /^(\d+)[|](\d+)[|](\d+)\s*$/.exec(output);
  if (!match) throw new Error(`Could not read the counts from "${output.trim()}".`);
  return { coffees: Number(match[1]), orders: Number(match[2]), order_items: Number(match[3]) };
}

export function postgresIsRunning(root) {
  const result = spawnSync(
    "docker",
    ["compose", "--env-file", ".env.local", "ps", "--status", "running", "--services"],
    { cwd: root, encoding: "utf8" },
  );
  return result.status === 0 && result.stdout.split(/\r?\n/).includes("postgres");
}

function main() {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  ensureEnvLocal(root);
  if (!postgresIsRunning(root)) {
    console.error(notRunningMessage());
    return 1;
  }
  let plan;
  try {
    plan = planBackup({ env: readEnvFile(join(root, ".env.local")), date: new Date() });
  } catch (error) {
    console.error(error.message);
    return 1;
  }
  const result = spawnSync(plan.command, plan.args, {
    cwd: root,
    maxBuffer: 1024 * 1024 * 1024,
  });
  if (result.status !== 0 || result.stdout.length === 0) {
    console.error(`pg_dump failed: ${result.stderr?.toString().trim() || "no output"}`);
    return 1;
  }
  const folder = join(root, BACKUP_DIR);
  if (!existsSync(folder)) mkdirSync(folder, { recursive: true });
  const path = join(root, plan.file);
  writeFileSync(path, result.stdout);
  console.log(`Backup written: ${plan.file} (${statSync(path).size} bytes)`);
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  process.exit(main());
}
