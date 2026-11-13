// Guards the warm-up of the end-to-end run (found by the bug-investigator agent, which traced one
// run of 9 failures to a start-up race: the first tests loaded a cold dev server and a cold JVM
// within the 5 seconds of an expectation). The warm-up is data, so it is tested as data.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(join(root, path), "utf8");

test("the dev server transforms the entry and the two lazy pages at start", () => {
  const config = read("apps/app/vite.config.ts");

  assert.match(config, /warmup:\s*\{\s*clientFiles:/);
  for (const file of [
    "./src/main.tsx",
    "./src/pages/CheckoutPage.tsx",
    "./src/pages/OrderPage.tsx",
  ]) {
    assert.ok(config.includes(file), `${file} is not warmed up`);
  }
});

test("the global setup warms the pages and the read endpoints of the API", () => {
  const setup = read("apps/app/e2e/global-setup.ts");

  for (const url of ["localhost:5173/checkout", "/api/v1/coffees", "/api/v1/checkout-config"]) {
    assert.ok(setup.includes(url), `the warm-up does not ask for ${url}`);
  }
  assert.match(setup, /await warmUp\(\);/);
});

test("the warm-up only reads: no POST, no write", () => {
  const setup = read("apps/app/e2e/global-setup.ts");

  assert.doesNotMatch(setup, /method:\s*["']POST["']/i);
  assert.doesNotMatch(setup, /\/api\/v1\/orders["'`]\s*,\s*\{/);
});

test("the expectation timeout is not raised to hide a slow start", () => {
  assert.doesNotMatch(read("apps/app/playwright.config.ts"), /expect:\s*\{/);
});
