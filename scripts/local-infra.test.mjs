// Guards the local infrastructure (spec 002): Compose file, env example, and package scripts.
// The containers themselves are checked by hand (see plans/002-local-infrastructure-plan.md).
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(join(root, path), "utf8");
const compose = () => read("compose.yaml");
const pkg = () => JSON.parse(read("package.json"));

const dockerInstalled =
  spawnSync("docker", ["compose", "version"], { encoding: "utf8" }).status === 0;

test("compose declares exactly the postgres and grafana services", () => {
  const services = compose().match(/^services:\n([\s\S]*?)(?=^\S|(?![\s\S]))/m)?.[1] ?? "";
  const names = [...services.matchAll(/^ {2}([a-z][\w-]*):\s*$/gm)].map((match) => match[1]);
  assert.deepEqual(names, ["postgres", "grafana"]);
});

test("every image has an explicit version and none uses latest", () => {
  const images = [...compose().matchAll(/^\s+image:\s*(\S+)/gm)].map((match) => match[1]);
  assert.equal(images.length, 2);
  for (const image of images) {
    assert.match(image, /:\d+(\.\d+)*(-[a-z]+)?$/, `${image} must pin a version`);
    assert.doesNotMatch(image, /latest/);
  }
});

test("both services have a health check", () => {
  assert.equal([...compose().matchAll(/^\s+healthcheck:/gm)].length, 2);
  assert.match(compose(), /pg_isready/);
  assert.match(compose(), /\/api\/health/);
});

test("Postgres data lives in a named volume mounted where PostgreSQL 18 keeps it", () => {
  const text = compose();
  assert.match(text, /postgres-data:\/var\/lib\/postgresql\s*$/m);
  assert.match(text, /^volumes:\n {2}postgres-data:/m);
});

test("ports are bound to localhost and match the documented ones", () => {
  const ports = [...compose().matchAll(/^\s+- "?(127\.0\.0\.1:[^"\n]+)"?\s*$/gm)].map((m) =>
    m[1].replace(/\$\{(\w+):\?[^}]*\}/, "${$1}"),
  );
  assert.deepEqual(ports.toSorted(), [
    "127.0.0.1:${POSTGRES_PORT}:5432",
    "127.0.0.1:3030:3000",
    "127.0.0.1:4317:4317",
    "127.0.0.1:4318:4318",
  ]);
  assert.doesNotMatch(compose(), /^\s+- "?\d+:\d+/m, "a port is published on all interfaces");
});

test("database settings come from the environment and have no defaults in the file", () => {
  const text = compose();
  for (const name of ["POSTGRES_DB", "POSTGRES_USER", "POSTGRES_PASSWORD", "POSTGRES_PORT"]) {
    assert.match(text, new RegExp(`\\$\\{${name}:\\?[^}]+\\}`), `${name} must be required`);
  }
});

test(".env.example defines every variable the Compose file reads and says it is for development", () => {
  const example = read(".env.example");
  const used = new Set([...compose().matchAll(/\$\{([A-Z_]+)[:}]/g)].map((match) => match[1]));
  assert.ok(used.size >= 4);
  for (const name of used) assert.match(example, new RegExp(`^${name}=.+`, "m"), `${name} missing`);
  assert.match(example, /local development only/i);
});

test("package scripts: env:setup, infra:up, infra:down, local:setup", () => {
  const scripts = pkg().scripts;
  assert.equal(scripts["env:setup"], "node scripts/env-setup.mjs");
  assert.match(
    scripts["infra:up"],
    /^node scripts\/env-setup\.mjs && docker compose .*--env-file \.env\.local/,
  );
  assert.match(scripts["infra:up"], /up .*--wait/);
  assert.match(scripts["infra:down"], /docker compose .*--env-file \.env\.local down/);
  assert.doesNotMatch(scripts["infra:down"], /--volumes|-v\b/, "infra:down must keep the volume");
});

test("local:setup runs install, env:setup, and infra:up in that order", () => {
  const steps = pkg()
    .scripts["local:setup"].split("&&")
    .map((step) => step.trim());
  assert.deepEqual(steps, ["yarn install", "yarn env:setup", "yarn infra:up"]);
});

test("secrets files stay out of Git", () => {
  const ignored = read(".gitignore").split(/\r?\n/);
  assert.ok(ignored.includes(".env.local"));
  assert.ok(!ignored.includes(".env.example"));
});

test("docker compose accepts the file with the example values", { skip: !dockerInstalled }, () => {
  const result = spawnSync(
    "docker",
    ["compose", "--env-file", ".env.example", "config", "--quiet"],
    { cwd: root, encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stderr);
});

test(
  "docker compose rejects an env file without the database password",
  { skip: !dockerInstalled },
  () => {
    const dir = mkdtempSync(join(tmpdir(), "compose-env-"));
    const envFile = join(dir, "partial.env");
    const partial = read(".env.example")
      .split(/\r?\n/)
      .filter((line) => !line.startsWith("POSTGRES_PASSWORD="))
      .join("\n");
    writeFileSync(envFile, partial);
    const result = spawnSync("docker", ["compose", "--env-file", envFile, "config", "--quiet"], {
      cwd: root,
      encoding: "utf8",
    });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /POSTGRES_PASSWORD/);
  },
);
