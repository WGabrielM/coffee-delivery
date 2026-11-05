// Guards the root side of the app foundation (spec 012): workspace, scripts, and the MCP config.
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
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

test("Playwright never reuses a server it did not start (another project may hold port 5173)", () => {
  const config = read("apps/app/playwright.config.ts");
  assert.match(config, /reuseExistingServer: false/);
  assert.doesNotMatch(config, /reuseExistingServer: !/);
});

test("Tailwind is wired into Vite and the styles are loaded by the entry point", () => {
  assert.match(read("apps/app/vite.config.ts"), /tailwindcss\(\)/);
  assert.match(read("apps/app/src/main.tsx"), /import "\.\/styles\/index\.css"/);
  const index = read("apps/app/src/styles/index.css");
  for (const part of ["tailwindcss", "./fonts.css", "./theme.css", "./base.css"]) {
    assert.ok(index.includes(`"${part}"`), `index.css does not import ${part}`);
  }
});

test("Tailwind does not scan the assets: SVG attributes such as transform would become classes", () => {
  assert.match(read("apps/app/src/styles/index.css"), /@source not "\.\.\/assets";/);
});

test("the fonts are self-hosted: no font host in the styles or the HTML", () => {
  const files = [
    "apps/app/index.html",
    "apps/app/src/styles/fonts.css",
    "apps/app/src/styles/index.css",
  ];
  for (const file of files) {
    assert.doesNotMatch(read(file), /fonts\.googleapis|fonts\.gstatic|use\.typekit|cdnjs/i, file);
  }
  assert.match(read("apps/app/src/styles/fonts.css"), /@fontsource\/roboto\/latin-400/);
  assert.match(read("apps/app/src/styles/fonts.css"), /@fontsource\/baloo-2\/latin-800/);
});

test("no source file of the app has a hex color except the theme (colors come from tokens)", () => {
  const found = [];
  const walk = (directory) => {
    for (const entry of readdirSync(join(root, directory), { withFileTypes: true })) {
      const path = `${directory}/${entry.name}`;
      if (entry.isDirectory()) walk(path);
      else if (/\.(tsx?|css|html)$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)) {
        if (!path.endsWith("styles/theme.css") && /#[0-9a-fA-F]{3,8}\b/.test(read(path))) {
          found.push(path);
        }
      }
    }
  };
  walk("apps/app/src");
  assert.deepEqual(found, []);
});
