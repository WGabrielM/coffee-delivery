import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { MAX_QUANTITY, MIN_QUANTITY } from "./quantity-limits";

const src = join(import.meta.dirname, "..");
const files = readdirSync(src, { recursive: true, encoding: "utf8" })
  .map((file) => file.replaceAll("\\", "/"))
  .filter((file) => /[.]tsx?$/.test(file) && !/[.]test[.]tsx?$/.test(file))
  .toSorted();

describe("quantity limits", () => {
  it("are 1 and 99, the business rule of the order", () => {
    expect(MIN_QUANTITY).toBe(1);
    expect(MAX_QUANTITY).toBe(99);
  });

  it("is the only place in src with the number 99 (the tests and their support files in src/test aside)", () => {
    const withTheNumber = files.filter(
      (file) =>
        file !== "lib/quantity-limits.ts" &&
        !file.startsWith("test/") &&
        /(?<![\d.])99(?![\d.])/.test(readFileSync(join(src, file), "utf8")),
    );

    expect(withTheNumber).toEqual([]);
  });

  it("is imported by the counter, the badge, and the cart reducer", () => {
    for (const file of [
      "components/counter/Counter.tsx",
      "components/badge/Badge.tsx",
      "features/cart/cart-reducer.ts",
    ]) {
      expect(readFileSync(join(src, file), "utf8")).toContain("lib/quantity-limits");
    }
  });
});
