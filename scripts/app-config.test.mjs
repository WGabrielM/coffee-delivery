// Guards the root side of the app foundation (spec 012): workspace, scripts, and the MCP config.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { planTask } from "./run-task.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(join(root, path), "utf8");
const rootPackage = () => JSON.parse(read("package.json"));
const appPackage = () => JSON.parse(read("apps/app/package.json"));

test("apps/app is the Yarn workspace and app:dev starts it", () => {
  assert.deepEqual(rootPackage().workspaces, ["apps/app"]);
  assert.equal(rootPackage().scripts["app:dev"], "yarn --cwd apps/app dev");
});

test("the app provides the scripts the root runner calls, and relies on the root for lint", () => {
  const scripts = Object.keys(appPackage().scripts);
  for (const task of ["types:check", "test", "test:e2e", "build"]) {
    assert.ok(scripts.includes(task), `apps/app has no ${task} script`);
  }
  assert.equal(scripts.includes("lint"), false, "lint belongs to the root (oxlint)");
  assert.equal(scripts.includes("code:fix"), false, "code:fix belongs to the root (oxfmt)");
  assert.equal(appPackage().scripts["types:check"], "tsc --noEmit");
});

test("the root runner runs the app for the tasks it defines and skips lint and code:fix", () => {
  const context = {
    exists: (path) => path === "apps/app/package.json",
    appScripts: () => Object.keys(appPackage().scripts),
    platform: "linux",
  };
  for (const task of ["types:check", "test", "test:e2e", "build"]) {
    const plan = planTask(task, context);
    assert.ok(
      plan.steps.some((step) => step.workspace === "app"),
      `${task} must run the app`,
    );
  }
  for (const task of ["lint", "code:fix"]) {
    const plan = planTask(task, context);
    assert.ok(plan.skipped.some((entry) => entry.workspace === "app"));
  }
});

test("dependencies are pinned to exact versions", () => {
  const { dependencies, devDependencies } = appPackage();
  for (const [name, version] of Object.entries({ ...dependencies, ...devDependencies })) {
    assert.match(version, /^\d+\.\d+\.\d+$/, `${name} is not pinned: ${version}`);
  }
});

test("the app is strict TypeScript", () => {
  const tsconfig = JSON.parse(read("apps/app/tsconfig.json"));
  assert.equal(tsconfig.compilerOptions.strict, true);
});

test(".mcp.json registers the Playwright MCP server, pinned, with no secrets", () => {
  const config = JSON.parse(read(".mcp.json"));
  const server = config.mcpServers.playwright;
  assert.ok(server, "playwright server missing");
  assert.ok(
    server.args.some((arg) => /^@playwright\/mcp@\d+\.\d+\.\d+$/.test(arg)),
    "the MCP package must be pinned",
  );
  assert.equal(server.env, undefined, "no environment values in .mcp.json");
  assert.doesNotMatch(read(".mcp.json"), /token|secret|password|key/i);
});

test("the app sources contain no hex color literal (colors come from tokens, spec 013)", () => {
  const files = [
    "src/pages/HomePage.tsx",
    "src/pages/CheckoutPage.tsx",
    "src/pages/OrderPage.tsx",
    "src/pages/NotFoundPage.tsx",
  ];
  for (const file of files) {
    assert.doesNotMatch(read(`apps/app/${file}`), /#[0-9a-fA-F]{3,8}\b/, `${file} has a hex color`);
  }
});
