import assert from "node:assert/strict";
import { test } from "node:test";

import { TASKS, formatSummary, planTask } from "./run-task.mjs";

const none = () => false;
const only =
  (...paths) =>
  (path) =>
    paths.includes(path);

const baseContext = (overrides = {}) => ({
  exists: none,
  appScripts: () => [],
  platform: "linux",
  ...overrides,
});

test("exposes the six root tasks", () => {
  assert.deepEqual([...TASKS].toSorted(), [
    "build",
    "code:fix",
    "lint",
    "test",
    "test:e2e",
    "types:check",
  ]);
});

test("rejects an unknown task", () => {
  assert.throws(() => planTask("deploy", baseContext()), /Unknown task "deploy"/);
});

test("on the bare skeleton only the root steps run and both apps are skipped", () => {
  const plan = planTask("lint", baseContext());
  assert.deepEqual(
    plan.steps.map((step) => step.workspace),
    ["root", "root"],
  );
  assert.deepEqual(
    plan.skipped.map((entry) => entry.workspace),
    ["api", "app"],
  );
  assert.match(plan.skipped[0].reason, /apps\/api/);
  assert.match(plan.skipped[1].reason, /apps\/app/);
});

test("root tasks without a root step are reported as skipped, not as errors", () => {
  const plan = planTask("build", baseContext());
  assert.equal(plan.steps.length, 0);
  assert.deepEqual(
    plan.skipped.map((entry) => entry.workspace),
    ["root", "api", "app"],
  );
});

test("code:fix fixes with oxlint and oxfmt at the root", () => {
  const plan = planTask("code:fix", baseContext());
  assert.deepEqual(
    plan.steps.map((step) => [step.command, ...step.args]),
    [
      ["yarn", "oxlint", "--fix", "."],
      ["yarn", "oxfmt", "--write", "."],
    ],
  );
});

test("lint only checks, it never writes", () => {
  const plan = planTask("lint", baseContext());
  const lines = plan.steps.map((step) => [step.command, ...step.args].join(" "));
  assert.deepEqual(lines, ["yarn oxlint .", "yarn oxfmt --check ."]);
});

test("test runs the root script tests", () => {
  const plan = planTask("test", baseContext());
  assert.deepEqual(
    [plan.steps[0].command, ...plan.steps[0].args],
    ["node", "--test", "scripts/*.test.mjs"],
  );
});

test("the API maps each task to its Gradle tasks", () => {
  const context = baseContext({ exists: only("apps/api/gradlew") });
  const gradle = (task) => planTask(task, context).steps.find((step) => step.workspace === "api");
  assert.deepEqual(gradle("code:fix").args, ["spotlessApply"]);
  assert.deepEqual(gradle("lint").args, ["spotlessCheck"]);
  assert.deepEqual(gradle("types:check").args, ["compileJava", "compileTestJava"]);
  assert.deepEqual(gradle("test").args, ["test"]);
  assert.deepEqual(gradle("test:e2e").args, ["e2eTest", "jacocoTestCoverageVerification"]);
  assert.deepEqual(gradle("build").args, ["build", "-x", "test", "-x", "e2eTest"]);
  assert.equal(gradle("build").cwd, "apps/api");
  assert.equal(gradle("build").command, "./gradlew");
});

test("the Gradle wrapper name follows the platform", () => {
  const context = baseContext({ exists: only("apps/api/gradlew"), platform: "win32" });
  const step = planTask("test", context).steps.find((entry) => entry.workspace === "api");
  assert.equal(step.command, ".\\gradlew.bat");
});

test("the app runs the script of the same name through Yarn", () => {
  const context = baseContext({
    exists: only("apps/app/package.json"),
    appScripts: () => ["build", "test", "test:e2e", "types:check"],
  });
  const step = planTask("test:e2e", context).steps.find((entry) => entry.workspace === "app");
  assert.deepEqual([step.command, ...step.args], ["yarn", "--cwd", "apps/app", "run", "test:e2e"]);
});

test("an app without the script is skipped with the reason", () => {
  const context = baseContext({
    exists: only("apps/app/package.json"),
    appScripts: () => ["build"],
  });
  const plan = planTask("lint", context);
  assert.equal(
    plan.steps.some((step) => step.workspace === "app"),
    false,
  );
  const skipped = plan.skipped.find((entry) => entry.workspace === "app");
  assert.match(skipped.reason, /no "lint" script/);
});

test("steps keep the order root, api, app", () => {
  const context = baseContext({
    exists: only("apps/api/gradlew", "apps/app/package.json"),
    appScripts: () => ["test"],
  });
  const plan = planTask("test", context);
  assert.deepEqual(
    plan.steps.map((step) => step.workspace),
    ["root", "api", "app"],
  );
});

test("the summary names what ran and what was skipped", () => {
  const plan = planTask("build", baseContext());
  const summary = formatSummary("build", plan);
  assert.match(summary, /build/);
  assert.match(summary, /ran: none/);
  assert.match(summary, /skipped: root \(/);
  assert.match(summary, /api \(apps\/api not created yet\)/);
});
