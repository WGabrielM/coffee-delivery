// Guards the root scripts of the API (spec 003): env file parsing, api:dev, load, and the k6 harness.
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { planApiDev } from "./api-dev.mjs";
import { parseEnvFile } from "./env-file.mjs";
import { DEFAULT_BASE_URL, planLoad } from "./load.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(join(root, path), "utf8");

test("parseEnvFile reads KEY=VALUE, skips comments and blanks, strips quotes", () => {
  const values = parseEnvFile(
    [
      "# comment",
      "",
      "A=1",
      "B = two ",
      'C="quoted value"',
      "D='single'",
      "E=a=b",
      "=nokey",
      "junk",
    ].join("\r\n"),
  );
  assert.deepEqual(values, { A: "1", B: "two", C: "quoted value", D: "single", E: "a=b" });
});

test("parseEnvFile reads the real .env.example", () => {
  const values = parseEnvFile(read(".env.example"));
  for (const key of ["POSTGRES_DB", "POSTGRES_USER", "POSTGRES_PASSWORD", "POSTGRES_PORT"]) {
    assert.ok(values[key], `${key} missing`);
  }
});

test("api:dev runs bootRun in apps/api with the settings of .env.local", () => {
  const plan = planApiDev({ platform: "linux", envFile: { POSTGRES_DB: "x" } });
  assert.equal(plan.command, "./gradlew");
  assert.deepEqual(plan.args, ["bootRun"]);
  assert.equal(plan.cwd, "apps/api");
  assert.deepEqual(plan.env, { POSTGRES_DB: "x" });
});

test("api:dev runs the wrapper with an explicit path on Windows", () => {
  assert.equal(planApiDev({ platform: "win32", envFile: {} }).command, ".\\gradlew.bat");
});

test("load runs the k6 script of the profile with the default base URL", () => {
  const plan = planLoad("smoke", { exists: () => true, env: {} });
  assert.deepEqual([plan.command, ...plan.args], ["k6", "run", "apps/api/load/smoke.js"]);
  assert.equal(plan.env.BASE_URL, DEFAULT_BASE_URL);
});

test("load keeps a BASE_URL given by the caller", () => {
  const plan = planLoad("smoke", { exists: () => true, env: { BASE_URL: "http://example.test" } });
  assert.equal(plan.env.BASE_URL, "http://example.test");
});

test("load rejects an unknown profile or an unsafe name", () => {
  assert.throws(() => planLoad("stress", { exists: () => false, env: {} }), /Unknown load profile/);
  assert.throws(() => planLoad("../x", { exists: () => true, env: {} }), /Unknown load profile/);
  assert.throws(() => planLoad(undefined, { exists: () => true, env: {} }), /Unknown load profile/);
});

test("package scripts: api:dev and load:smoke", () => {
  const scripts = JSON.parse(read("package.json")).scripts;
  assert.equal(scripts["api:dev"], "node scripts/api-dev.mjs");
  assert.equal(scripts["load:smoke"], "node scripts/load.mjs smoke");
});

test("every k6 scenario file is exported by scenarios/index.js", () => {
  const folder = "apps/api/load/scenarios";
  const index = read(`${folder}/index.js`);
  const files = readdirSync(join(root, folder)).filter(
    (file) => file.endsWith(".js") && file !== "index.js",
  );
  assert.ok(files.length >= 1);
  for (const file of files) {
    assert.ok(index.includes(`"./${file}"`), `${file} is not exported by index.js`);
  }
});

test("the smoke profile runs every exported scenario through its index", () => {
  const smoke = read("apps/api/load/smoke.js");
  assert.match(smoke, /from "\.\/scenarios\/index\.js"/);
  assert.match(smoke, /exec: name/);
});

test("the e2e PostgreSQL image is the one of compose.yaml", () => {
  const compose = read("compose.yaml").match(/image:\s*(postgres:\S+)/)?.[1];
  const support = read(
    "apps/api/src/test/java/com/coffeedelivery/e2e/PostgresContainerSupport.java",
  ).match(/POSTGRES_IMAGE = "([^"]+)"/)?.[1];
  assert.ok(compose && support);
  assert.equal(support, compose);
});

test("the Gradle project provides the tasks the root runner calls", () => {
  const build = read("apps/api/build.gradle.kts");
  for (const task of ["e2eTest", "jacocoTestCoverageVerification", "spotless"]) {
    assert.ok(build.includes(task), `build.gradle.kts has no ${task}`);
  }
  assert.match(build, /minimum = "0\.80"/);
  assert.match(
    read("apps/api/gradle/wrapper/gradle-wrapper.properties"),
    /gradle-9\.\d+\.\d+-bin\.zip/,
  );
});

test("no layer package is named after the Java keyword", () => {
  const found = [];
  const walk = (directory) => {
    for (const entry of readdirSync(join(root, directory), { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      if (entry.name === "interface") found.push(join(directory, entry.name));
      walk(join(directory, entry.name));
    }
  };
  walk("apps/api/src");
  assert.deepEqual(found, []);
});
