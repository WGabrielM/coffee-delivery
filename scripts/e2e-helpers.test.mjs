// Guards the shared helpers of the Playwright specs (spec 035): each is defined once, in
// apps/app/e2e/checkout-helpers.ts, and no spec keeps its own copy.
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const e2e = join(root, "apps", "app", "e2e");
const sources = readdirSync(e2e).filter((file) => file.endsWith(".ts"));

const SHARED = [
  "boxOf",
  "fillTheSample",
  "fillTheAddress",
  "sampleAddress",
  "createOrder",
  "coffeeId",
  "listCoffees",
  "field",
  "drawn",
];

/** The files that define `name` as a function or a constant (not the ones that only use it). */
function definitions(name) {
  const pattern = new RegExp(`(?:function|const|let)\\s+${name}\\b`);
  return sources.filter((file) => pattern.test(readFileSync(join(e2e, file), "utf8")));
}

test("every shared helper is defined once, in checkout-helpers.ts", () => {
  for (const name of SHARED) {
    assert.deepEqual(definitions(name), ["checkout-helpers.ts"], `${name} is defined elsewhere`);
  }
});

test("the specs that used to keep a copy import the helpers", () => {
  const users = {
    "cart-add.spec.ts": ["boxOf"],
    "home-coffees.spec.ts": ["boxOf"],
    "checkout-address.spec.ts": ["fillTheAddress", "field"],
    "checkout-payment.spec.ts": ["drawn"],
    "checkout-submit.spec.ts": ["fillTheSample", "field"],
    "first-load.spec.ts": ["createOrder"],
    "order-confirmation.spec.ts": ["createOrder"],
    "responsive.spec.ts": ["createOrder"],
    "accessibility.spec.ts": ["createOrder"],
    "visual-parity.spec.ts": ["coffeeId", "createOrder", "fillTheSample"],
    "happy-path.spec.ts": ["field"],
  };
  for (const [file, names] of Object.entries(users)) {
    const text = readFileSync(join(e2e, file), "utf8");
    const end = text.indexOf('from "./checkout-helpers"');
    const imported = text.slice(text.lastIndexOf("import", end), end);
    for (const name of names) {
      assert.ok(imported.includes(name), `${file} does not import ${name}`);
    }
  }
});

test("no spec spells the sample order out again with a POST to /api/v1/orders", () => {
  const withOwnOrder = sources.filter(
    (file) =>
      file !== "checkout-helpers.ts" &&
      readFileSync(join(e2e, file), "utf8").includes('request.post("/api/v1/orders"'),
  );

  assert.deepEqual(withOwnOrder, []);
});
