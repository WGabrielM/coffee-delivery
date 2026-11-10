// Guards the backup and restore commands (spec 037): the names, the arguments, and the refusal to
// restore into the live database. The commands are built by pure functions, so nothing runs here.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  BACKUP_DIR,
  backupFileName,
  notRunningMessage,
  parseRows,
  planBackup,
} from "./db-backup.mjs";
import { RESTORE_DB, planRestore } from "./db-restore.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(join(root, path), "utf8");

const env = {
  POSTGRES_DB: "coffee_delivery",
  POSTGRES_USER: "coffee_delivery",
  POSTGRES_PASSWORD: "secret",
  POSTGRES_PORT: "5432",
};
const date = new Date("2026-11-10T14:30:05Z");

test("the backup file is named after the database and the date, in the backups folder", () => {
  assert.equal(BACKUP_DIR, "backups");
  assert.equal(
    backupFileName("coffee_delivery", date),
    "coffee_delivery-2026-11-10T14-30-05Z.dump",
  );
});

test("the backup is a custom-format pg_dump of the live database, run in the postgres container", () => {
  const plan = planBackup({ env, date });

  assert.equal(plan.file, "backups/coffee_delivery-2026-11-10T14-30-05Z.dump");
  assert.equal(plan.command, "docker");
  assert.deepEqual(plan.args, [
    "compose",
    "--env-file",
    ".env.local",
    "exec",
    "-T",
    "postgres",
    "pg_dump",
    "--format=custom",
    "--username=coffee_delivery",
    "--dbname=coffee_delivery",
  ]);
});

test("the backup command never carries the password", () => {
  const plan = planBackup({ env, date });

  assert.ok(!JSON.stringify(plan).includes("secret"));
});

test("a backup without the database settings is refused with the name of the setting", () => {
  assert.throws(() => planBackup({ env: { POSTGRES_USER: "u" }, date }), /POSTGRES_DB/);
  assert.throws(() => planBackup({ env: { POSTGRES_DB: "d" }, date }), /POSTGRES_USER/);
});

test("the message for a postgres container that is not running says what to run", () => {
  assert.match(notRunningMessage(), /not running/);
  assert.match(notRunningMessage(), /yarn infra:up/);
});

test("the restore goes into restore_check, never into the live database", () => {
  const plan = planRestore({ env, file: "backups/x.dump", drop: false });

  assert.equal(RESTORE_DB, "restore_check");
  assert.equal(plan.database, "restore_check");
  // Every step that writes goes to restore_check; only the count of the live rows reads the live one.
  const writing = plan.steps.filter((step) => step.name !== "count live");
  assert.ok(writing.every((step) => !step.args.includes("--dbname=coffee_delivery")));
  const live = plan.steps.find((step) => step.name === "count live");
  assert.ok(live.args.every((argument) => !/INSERT|UPDATE|DELETE|DROP|CREATE/.test(argument)));
});

test("the restore creates restore_check empty, restores the file from stdin, and counts the rows", () => {
  const plan = planRestore({ env, file: "backups/x.dump", drop: false });
  const names = plan.steps.map((step) => step.name);

  assert.deepEqual(names, ["drop old", "create", "restore", "count restored", "count live"]);
  const restore = plan.steps.find((step) => step.name === "restore");
  assert.equal(restore.stdinFile, "backups/x.dump");
  assert.ok(restore.args.includes("pg_restore"));
  assert.ok(restore.args.includes("--exit-on-error"));
  assert.ok(restore.args.includes("--dbname=restore_check"));
  const count = plan.steps.find((step) => step.name === "count restored");
  const sql = count.args.at(-1);
  for (const table of ["coffees", "orders", "order_items"]) {
    assert.match(sql, new RegExp(`count\\(\\*\\) FROM ${table}\\b`));
  }
  assert.ok(count.args.includes("--dbname=restore_check"));
});

test("--drop adds a last step that drops restore_check", () => {
  const without = planRestore({ env, file: "backups/x.dump", drop: false });
  const withDrop = planRestore({ env, file: "backups/x.dump", drop: true });

  assert.equal(without.steps.length + 1, withDrop.steps.length);
  assert.equal(withDrop.steps.at(-1).name, "drop");
  assert.ok(withDrop.steps.at(-1).args.at(-1).includes("DROP DATABASE IF EXISTS restore_check"));
});

test("a live database that is called restore_check is refused", () => {
  assert.throws(
    () =>
      planRestore({ env: { ...env, POSTGRES_DB: "restore_check" }, file: "x.dump", drop: false }),
    /live database/,
  );
});

test("a restore without a file is refused with the usage", () => {
  assert.throws(() => planRestore({ env, file: undefined, drop: false }), /yarn db:restore <file>/);
});

test("the counts come back as numbers from the psql output", () => {
  assert.deepEqual(parseRows("14|3|7\n"), { coffees: 14, orders: 3, order_items: 7 });
  assert.throws(() => parseRows("nonsense"), /counts/);
});

test("the root package.json has the five docker and db scripts, and backups are ignored by Git", () => {
  const scripts = JSON.parse(read("package.json")).scripts;

  assert.equal(scripts["db:backup"], "node scripts/db-backup.mjs");
  assert.equal(scripts["db:restore"], "node scripts/db-restore.mjs");
  assert.match(scripts["docker:build"], /docker compose/);
  assert.match(scripts["docker:up"], /compose\.packaged\.yaml/);
  assert.match(scripts["docker:down"], /compose\.packaged\.yaml/);
  assert.match(read(".gitignore"), /^backups\/$/m);
});

test("the images are pinned to exact versions and the API image does not run as root", () => {
  const api = read("apps/api/Dockerfile");
  const app = read("apps/app/Dockerfile");

  for (const text of [api, app]) {
    for (const line of text.split("\n").filter((entry) => entry.startsWith("FROM "))) {
      assert.match(line, /FROM [a-z/-]+:\d+\.\d+\.\d+\S*(?: AS \w+)?$/, `${line} is not pinned`);
      assert.doesNotMatch(line, /:latest/);
    }
  }
  assert.match(api, /^USER \S+/m);
  assert.match(api, /EXPOSE 3000/);
  assert.match(app, /node:22\.22\.2-alpine/);
  assert.match(app, /EXPOSE 80/);
});

test("the proxy sends /api to the API, falls back to index.html, and sets the cache headers", () => {
  const conf = read("apps/app/nginx.conf");

  assert.match(conf, /location \/api\/\s*\{[^}]*proxy_pass http:\/\/api:3000/);
  assert.match(conf, /try_files \$uri \/index\.html/);
  assert.match(conf, /location \/assets\/\s*\{[^}]*max-age=31536000[^}]*immutable/);
  assert.match(conf, /location = \/index\.html\s*\{[^}]*no-cache/);
});

test("the packaged compose runs the two images with the postgres of compose.yaml on port 8080", () => {
  const compose = read("compose.packaged.yaml");

  assert.match(compose, /api:\s*\n\s*build:/);
  assert.match(compose, /app:\s*\n\s*build:/);
  assert.match(compose, /127\.0\.0\.1:8080:80/);
  assert.match(compose, /condition: service_healthy/);
  assert.doesNotMatch(compose, /POSTGRES_PASSWORD:\s*\S*[a-z]+_dev/);
});

test("the runbook is 40 lines or fewer and names the five commands", () => {
  const runbook = read("docs/RUNBOOK.md");

  assert.ok(runbook.trimEnd().split("\n").length <= 40);
  for (const command of ["docker:build", "docker:up", "docker:down", "db:backup", "db:restore"]) {
    assert.ok(runbook.includes(`yarn ${command}`), `${command} is missing`);
  }
});
