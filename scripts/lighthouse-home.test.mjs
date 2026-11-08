// Guards the pass rules and the report of `yarn lighthouse` (spec 029).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  MIN_ACCESSIBILITY,
  MIN_PERFORMANCE,
  evaluateScores,
  formatScores,
} from "./lighthouse-home.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

test("the limits are the exit criteria of the plan: 90 for performance, 95 for accessibility", () => {
  assert.equal(MIN_PERFORMANCE, 90);
  assert.equal(MIN_ACCESSIBILITY, 95);
});

test("the scores pass at the limits and above", () => {
  assert.deepEqual(evaluateScores({ performance: 0.9, accessibility: 0.95 }), {
    ok: true,
    failures: [],
  });
  assert.equal(evaluateScores({ performance: 1, accessibility: 1 }).ok, true);
});

test("a score under its limit fails and the failure names it", () => {
  const result = evaluateScores({ performance: 0.89, accessibility: 0.95 });

  assert.equal(result.ok, false);
  assert.deepEqual(result.failures, ["performance 89 is under 90"]);
});

test("both scores can fail at once", () => {
  const result = evaluateScores({ performance: 0.5, accessibility: 0.94 });

  assert.deepEqual(result.failures, ["performance 50 is under 90", "accessibility 94 is under 95"]);
});

test("the scores are printed as whole numbers out of 100", () => {
  assert.equal(
    formatScores({ performance: 0.926, accessibility: 0.97 }),
    "Lighthouse (desktop, Home): performance 93, accessibility 97",
  );
});

test("a missing score counts as a failure, never as a pass", () => {
  assert.equal(evaluateScores({ performance: null, accessibility: 1 }).ok, false);
});

test("the root package.json has the lighthouse script", () => {
  const scripts = JSON.parse(readFileSync(join(root, "package.json"), "utf8")).scripts;

  assert.equal(scripts.lighthouse, "node scripts/lighthouse-home.mjs");
});
