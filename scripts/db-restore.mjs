// `yarn db:restore <file> [--drop]`: restores a backup into a new, empty database called
// restore_check, never into the live one, and prints the rows of coffees, orders, and order_items
// next to those of the live database (spec 037). With --drop the check database is dropped at the end.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  COUNT_SQL,
  composeExec,
  databaseSettings,
  notRunningMessage,
  parseRows,
  postgresIsRunning,
} from "./db-backup.mjs";
import { readEnvFile } from "./env-file.mjs";
import { ensureEnvLocal } from "./env-setup.mjs";

export const RESTORE_DB = "restore_check";

/** The steps of a restore, each a `docker` command; the file of a step is sent to its stdin. */
export function planRestore({ env, file, drop }) {
  const { database, user } = databaseSettings(env);
  if (!file) throw new Error("Usage: yarn db:restore <file> [--drop]");
  if (database === RESTORE_DB) {
    throw new Error(`The live database is called ${RESTORE_DB}: refusing to restore into it.`);
  }
  const admin = (sql) =>
    composeExec(
      "psql",
      `--username=${user}`,
      "--dbname=postgres",
      "--set=ON_ERROR_STOP=1",
      "--command",
      sql,
    );
  const count = (name, target) => ({
    name,
    args: composeExec(
      "psql",
      `--username=${user}`,
      `--dbname=${target}`,
      "--tuples-only",
      "--no-align",
      "--field-separator=|",
      "--command",
      COUNT_SQL,
    ),
  });
  const steps = [
    { name: "drop old", args: admin(`DROP DATABASE IF EXISTS ${RESTORE_DB}`) },
    { name: "create", args: admin(`CREATE DATABASE ${RESTORE_DB}`) },
    {
      name: "restore",
      stdinFile: file,
      args: composeExec(
        "pg_restore",
        "--exit-on-error",
        "--no-owner",
        `--username=${user}`,
        `--dbname=${RESTORE_DB}`,
      ),
    },
    count("count restored", RESTORE_DB),
    // Read only: the live database is never written to.
    count("count live", database),
  ];
  if (drop) steps.push({ name: "drop", args: admin(`DROP DATABASE IF EXISTS ${RESTORE_DB}`) });
  return { database: RESTORE_DB, steps };
}

function main(argv) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const drop = argv.includes("--drop");
  const file = argv.find((argument) => !argument.startsWith("--"));
  ensureEnvLocal(root);
  let plan;
  try {
    plan = planRestore({ env: readEnvFile(join(root, ".env.local")), file, drop });
  } catch (error) {
    console.error(error.message);
    return 2;
  }
  const path = resolve(root, file);
  if (!existsSync(path)) {
    console.error(`The backup ${file} does not exist.`);
    return 1;
  }
  if (!postgresIsRunning(root)) {
    console.error(notRunningMessage());
    return 1;
  }
  const started = Date.now();
  const counts = {};
  for (const step of plan.steps) {
    const result = spawnSync("docker", step.args, {
      cwd: root,
      input: step.stdinFile ? readFileSync(path) : undefined,
      maxBuffer: 1024 * 1024 * 1024,
    });
    if (result.status !== 0) {
      console.error(`Step "${step.name}" failed: ${result.stderr?.toString().trim()}`);
      return 1;
    }
    if (step.name.startsWith("count")) counts[step.name] = parseRows(String(result.stdout));
  }
  const show = (rows) =>
    `coffees ${rows.coffees}, orders ${rows.orders}, order_items ${rows.order_items}`;
  const restored = counts["count restored"];
  const live = counts["count live"];
  console.log(`Restored ${file} into ${plan.database}${drop ? " (dropped again)" : ""}.`);
  console.log(`  restored: ${show(restored)}`);
  console.log(`  live:     ${show(live)}`);
  console.log(
    JSON.stringify(restored) === JSON.stringify(live)
      ? "The counts are equal."
      : "The counts differ (the live database changed since the backup, or the restore is incomplete).",
  );
  console.log(`Took ${((Date.now() - started) / 1000).toFixed(1)} s.`);
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  process.exit(main(process.argv.slice(2)));
}
