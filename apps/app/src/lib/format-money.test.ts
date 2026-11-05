import { describe, expect, it } from "vitest";

import { formatMoney, formatMoneyParts } from "./format-money";

describe("formatMoney", () => {
  it.each([
    [990, "$9.90"],
    [3320, "$33.20"],
    [0, "$0.00"],
    [123456, "$1,234.56"],
    [1, "$0.01"],
    [350, "$3.50"],
    [100000000, "$1,000,000.00"],
  ])("formats %i cents as %s", (cents, expected) => {
    expect(formatMoney(cents)).toBe(expected);
  });

  it("formats the example order: 1 + 2 coffees at 990 plus the 350 fee", () => {
    expect(formatMoney(1 * 990 + 2 * 990 + 350)).toBe("$33.20");
  });

  it.each([990.5, Number.NaN, Number.POSITIVE_INFINITY, -1, Number.MAX_SAFE_INTEGER + 1])(
    "rejects %s: amounts are non-negative whole cents",
    (cents) => {
      expect(() => formatMoney(cents)).toThrow(RangeError);
    },
  );
});

describe("formatMoneyParts", () => {
  it("splits the symbol from the amount so a price can draw them at different sizes", () => {
    expect(formatMoneyParts(990)).toEqual({ symbol: "$", amount: "9.90" });
  });

  it("keeps the grouping separator and the cents in the amount", () => {
    expect(formatMoneyParts(123456)).toEqual({ symbol: "$", amount: "1,234.56" });
    expect(formatMoneyParts(0)).toEqual({ symbol: "$", amount: "0.00" });
  });

  it("joins back to the same text as formatMoney", () => {
    for (const cents of [0, 1, 350, 990, 3320, 123456]) {
      const { symbol, amount } = formatMoneyParts(cents);

      expect(`${symbol}${amount}`).toBe(formatMoney(cents));
    }
  });

  it("rejects what formatMoney rejects", () => {
    expect(() => formatMoneyParts(9.9)).toThrow(RangeError);
    expect(() => formatMoneyParts(-5)).toThrow(RangeError);
  });
});
