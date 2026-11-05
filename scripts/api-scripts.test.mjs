// Guards the root scripts of the API (spec 003): env file parsing, api:dev, load, and the k6 harness.
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
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

// Load profiles (spec 008)
const PROFILES = ["smoke", "load", "stress", "spike", "soak"];

test("each of the five load profiles has an options file that runs every scenario of the index", () => {
  for (const profile of PROFILES) {
    const script = read(`apps/api/load/${profile}.js`);
    assert.match(script, /from "\.\/scenarios\/index\.js"/, `${profile}: scenarios index`);
    assert.match(script, /export const options/, `${profile}: options`);
    assert.match(script, /thresholds/, `${profile}: thresholds`);
  }
});

test("load, stress, spike, and soak share the helper that gives every scenario its executor", () => {
  for (const profile of ["load", "stress", "spike", "soak"]) {
    const script = read(`apps/api/load/${profile}.js`);
    assert.match(script, /from "\.\/lib\/profile\.js"/, `${profile}: helper`);
    assert.match(script, /export \* from "\.\/scenarios\/index\.js"/, `${profile}: re-export`);
  }
  assert.match(read("apps/api/load/lib/profile.js"), /exec: name/);
});

test("every profile fails on more than 1% failed requests or a p95 latency of 500 ms or more", () => {
  const config = read("apps/api/load/lib/config.js");
  assert.match(config, /http_req_failed: \["rate<0\.01"\]/);
  assert.match(config, /http_req_duration: \["p\(95\)<500"\]/);
  for (const profile of ["load", "stress", "spike", "soak"]) {
    assert.match(
      read(`apps/api/load/${profile}.js`),
      /THRESHOLDS/,
      `${profile}: shared thresholds`,
    );
  }
  assert.match(read("apps/api/load/smoke.js"), /SMOKE_THRESHOLDS/);
});

test("the soak duration is set by SOAK_DURATION and defaults to 30 minutes", () => {
  const soak = read("apps/api/load/soak.js");
  assert.match(soak, /__ENV\.SOAK_DURATION/);
  assert.match(soak, /"30m"/);
});

test("the load README documents every profile, the thresholds, and SOAK_DURATION", () => {
  const readme = read("apps/api/load/README.md");
  for (const profile of PROFILES) {
    assert.ok(readme.includes(`\`${profile}\``), `README does not describe ${profile}`);
  }
  assert.match(readme, /SOAK_DURATION/);
  assert.match(readme, /THINK_SECONDS/);
  assert.match(readme, /1%/);
  assert.match(readme, /500 ms/);
});

test("package.json has a script for each load profile and each plans an existing file", () => {
  const scripts = JSON.parse(read("package.json")).scripts;
  const expected = {
    "load:smoke": "smoke",
    load: "load",
    "load:stress": "stress",
    "load:spike": "spike",
    "load:soak": "soak",
  };
  for (const [name, profile] of Object.entries(expected)) {
    assert.equal(scripts[name], `node scripts/load.mjs ${profile}`, name);
    const plan = planLoad(profile, { exists: (path) => existsSync(join(root, path)), env: {} });
    assert.deepEqual(plan.args, ["run", `apps/api/load/${profile}.js`]);
  }
});

test("scenarios think between iterations so a virtual user behaves like a person", () => {
  assert.match(read("apps/api/load/lib/http.js"), /export function think/);
  assert.match(read("apps/api/load/lib/config.js"), /THINK_SECONDS/);
  const folder = "apps/api/load/scenarios";
  for (const file of readdirSync(join(root, folder)).filter((f) => f !== "index.js")) {
    assert.match(read(`${folder}/${file}`), /think\(\);/, `${file} does not call think()`);
  }
});
