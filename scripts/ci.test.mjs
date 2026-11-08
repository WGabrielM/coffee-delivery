// Guards `yarn ci` and the GitHub Actions workflows (spec 030): the workflow runs the commands of
// `scripts/ci.mjs`, in the same order, with explicit and pinned versions.
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { JOBS, formatStep, planCi } from "./ci.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(join(root, path), "utf8");
const ci = read(".github/workflows/ci.yml");

/** The text of one job of the workflow, from its key to the next job or the end. */
function jobText(workflow, name) {
  const start = workflow.search(new RegExp(`^  ${name}:`, "m"));
  assert.ok(start >= 0, `the workflow has no job ${name}`);
  const rest = workflow.slice(start + 1);
  const next = rest.search(/^ {2}[a-z0-9-]+:/m);
  return next < 0 ? workflow.slice(start) : workflow.slice(start, start + 1 + next);
}

/** The `run:` commands of a job (single-line), with their working directory when the step has one. */
function runCommands(job) {
  const commands = [];
  const lines = job.split("\n");
  lines.forEach((line, index) => {
    const match = line.match(/^ {8}run: (.+)$/);
    if (match) commands.push(match[1].trim());
    void index;
  });
  return commands;
}

test("yarn ci is a root script that runs scripts/ci.mjs", () => {
  const scripts = JSON.parse(read("package.json")).scripts;

  assert.equal(scripts.ci, "node scripts/ci.mjs");
});

test("the jobs are api, app, and e2e, run in that order", () => {
  assert.deepEqual(Object.keys(JOBS), ["api", "app", "e2e"]);
  const names = Object.keys(JOBS).flatMap((name) => JOBS[name].map(() => name));

  assert.deepEqual(
    planCi().map((step) => step.job),
    names,
  );
  assert.deepEqual(
    planCi().map((step) => formatStep(step)),
    [...JOBS.api, ...JOBS.app, ...JOBS.e2e].map((step) => formatStep(step)),
  );
});

test("the api job lints, type checks, tests, and builds the API with Gradle", () => {
  assert.deepEqual(
    JOBS.api.map((step) => formatStep(step)),
    [
      "./gradlew spotlessCheck",
      "./gradlew compileJava compileTestJava",
      "./gradlew test",
      "./gradlew build -x test -x e2eTest",
    ],
  );
  assert.ok(JOBS.api.every((step) => step.cwd === "apps/api"));
});

test("the app job lints, type checks, tests, and builds the app", () => {
  assert.deepEqual(
    JOBS.app.map((step) => formatStep(step)),
    [
      "yarn oxlint .",
      "yarn oxfmt --check .",
      "node --test scripts/*.test.mjs",
      "yarn --cwd apps/app types:check",
      "yarn --cwd apps/app test",
      "yarn --cwd apps/app build",
    ],
  );
});

test("the e2e job runs yarn test:e2e", () => {
  assert.deepEqual(
    JOBS.e2e.map((step) => formatStep(step)),
    ["yarn test:e2e"],
  );
});

test("planCi can run one job", () => {
  assert.deepEqual(
    planCi("app"),
    JOBS.app.map((step) => ({ ...step, job: "app" })),
  );
  assert.throws(() => planCi("deploy"), /Unknown job "deploy"/);
});

test("the workflow runs on push to main and on pull requests, with the three jobs", () => {
  assert.match(ci, /^on:\n {2}push:\n {4}branches: \[main\]\n {2}pull_request:/m);
  for (const name of ["api", "app", "e2e"]) assert.match(ci, new RegExp(`^ {2}${name}:`, "m"));
});

test("api and app run in parallel and e2e starts after both", () => {
  assert.doesNotMatch(jobText(ci, "api"), /needs:/);
  assert.doesNotMatch(jobText(ci, "app"), /needs:/);
  assert.match(jobText(ci, "e2e"), /needs: \[api, app\]/);
});

test("each job runs the commands of scripts/ci.mjs, in the same order", () => {
  for (const name of ["api", "app", "e2e"]) {
    const expected = JOBS[name].map((step) => formatStep(step));
    const actual = runCommands(jobText(ci, name)).filter((command) => expected.includes(command));
    assert.deepEqual(actual, expected, `the ${name} job does not run the commands of ci.mjs`);
  }
});

test("the api job runs its commands in apps/api, and the others at the root", () => {
  assert.match(jobText(ci, "api"), /working-directory: apps\/api/);
  assert.doesNotMatch(jobText(ci, "app"), /working-directory/);
  assert.doesNotMatch(jobText(ci, "e2e"), /working-directory: apps\/api/);
});

test("every action is pinned to a full commit SHA with its version in a comment", () => {
  for (const file of ["ci.yml", "commitlint.yml"]) {
    const text = read(`.github/workflows/${file}`);
    const uses = [
      ...text.matchAll(/^\s+- uses: (\S+)(?: # (\S+))?$|^\s+uses: (\S+)(?: # (\S+))?$/gm),
    ];
    assert.ok(uses.length > 0, `${file} uses no action`);
    for (const match of uses) {
      const reference = match[1] ?? match[3];
      const version = match[2] ?? match[4];
      assert.match(reference, /@[0-9a-f]{40}$/, `${reference} is not pinned to a commit SHA`);
      assert.match(version ?? "", /^v\d+\.\d+\.\d+$/, `${reference} has no version comment`);
    }
  }
});

test("no action uses a moving reference", () => {
  for (const file of ["ci.yml", "commitlint.yml"]) {
    assert.doesNotMatch(
      read(`.github/workflows/${file}`),
      /uses: \S+@(main|master|latest|v\d+)\s*$/m,
    );
  }
});

test("Java, Node, and Yarn versions are explicit and match the project", () => {
  assert.match(ci, /java-version: "21"/);
  assert.match(ci, /distribution: temurin/);
  assert.match(ci, /node-version: "22\.22\.1"/);
  // Yarn comes from the packageManager field through Corepack.
  assert.match(read("package.json"), /"packageManager": "yarn@1\.22\.22"/);
  assert.match(ci, /corepack enable/);
  assert.match(read("apps/api/build.gradle.kts"), /options\.release = 21/);
});

test("e2e starts a Postgres service with the values of .env.example and uploads the report on failure", () => {
  const job = jobText(ci, "e2e");
  assert.match(job, /services:\n {6}postgres:\n {8}image: postgres:18\.6-alpine/);
  assert.match(job, /POSTGRES_DB: coffee_delivery/);
  assert.match(job, /POSTGRES_USER: coffee_delivery/);
  assert.match(job, /POSTGRES_PASSWORD: coffee_delivery_dev/);
  assert.match(job, /- 5432:5432/);
  assert.match(job, /--health-cmd/);
  assert.match(job, /playwright install --with-deps chromium/);
  assert.match(job, /if: failure\(\)/);
  assert.match(job, /apps\/app\/playwright-report/);
  assert.match(job, /apps\/app\/test-results/);
});

test("the Postgres service matches compose.yaml and .env.example", () => {
  assert.match(read("compose.yaml"), /image: postgres:18\.6-alpine/);
  const env = read(".env.example");
  assert.match(env, /POSTGRES_DB=coffee_delivery/);
  assert.match(env, /POSTGRES_USER=coffee_delivery/);
  assert.match(env, /POSTGRES_PASSWORD=coffee_delivery_dev/);
  assert.match(env, /POSTGRES_PORT=5432/);
});

test("the workflow does not deploy, release, build images, or use secrets", () => {
  for (const file of ["ci.yml", "commitlint.yml"]) {
    const text = read(`.github/workflows/${file}`);
    assert.doesNotMatch(text, /secrets\.|docker\/build-push|deploy|release/i);
    assert.doesNotMatch(text, /lighthouse|k6|grafana|load:/i);
    assert.doesNotMatch(text, /matrix:/);
  }
});

test("jobs have timeouts and the workflow only reads the repository", () => {
  assert.match(ci, /permissions:\n {2}contents: read/);
  for (const name of ["api", "app", "e2e"]) assert.match(jobText(ci, name), /timeout-minutes: \d+/);
});

test("the commit message workflow runs commitlint over the commits of a pull request", () => {
  assert.ok(existsSync(join(root, ".github/workflows/commitlint.yml")));
  const text = read(".github/workflows/commitlint.yml");
  assert.match(text, /^on:\n {2}pull_request:/m);
  assert.match(text, /fetch-depth: 0/);
  assert.match(
    text,
    /yarn commitlint --from \$\{\{ github\.event\.pull_request\.base\.sha \}\} --to \$\{\{ github\.event\.pull_request\.head\.sha \}\} --verbose/,
  );
});
