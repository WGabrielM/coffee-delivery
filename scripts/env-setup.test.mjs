import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { ensureEnvLocal } from "./env-setup.mjs";

const makeRoot = (example) => {
  const root = mkdtempSync(join(tmpdir(), "env-setup-"));
  if (example !== undefined) writeFileSync(join(root, ".env.example"), example);
  return root;
};

test("creates .env.local from .env.example", () => {
  const root = makeRoot("POSTGRES_DB=coffee\n");
  const result = ensureEnvLocal(root);
  assert.equal(result.status, "created");
  assert.equal(readFileSync(join(root, ".env.local"), "utf8"), "POSTGRES_DB=coffee\n");
});

test("keeps an existing .env.local untouched", () => {
  const root = makeRoot("POSTGRES_DB=coffee\n");
  writeFileSync(join(root, ".env.local"), "POSTGRES_DB=mine\n");
  const result = ensureEnvLocal(root);
  assert.equal(result.status, "kept");
  assert.equal(readFileSync(join(root, ".env.local"), "utf8"), "POSTGRES_DB=mine\n");
});

test("running twice creates once and keeps after", () => {
  const root = makeRoot("A=1\n");
  assert.equal(ensureEnvLocal(root).status, "created");
  assert.equal(ensureEnvLocal(root).status, "kept");
});

test("fails with a clear message when .env.example is missing", () => {
  const root = makeRoot();
  assert.throws(() => ensureEnvLocal(root), /\.env\.example/);
  assert.equal(existsSync(join(root, ".env.local")), false);
});
