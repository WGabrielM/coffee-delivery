const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

/** Amounts are whole cents everywhere in the product; the only place they become text is here. */
function assertCents(cents: number): void {
  if (!Number.isSafeInteger(cents) || cents < 0) {
    throw new RangeError(`Money is a non-negative whole number of cents, received ${cents}.`);
  }
}

/** `990` becomes `$9.90`, `123456` becomes `$1,234.56`. */
export function formatMoney(cents: number): string {
  assertCents(cents);
  return currency.format(cents / 100);
}

/**
 * The same amount in two parts, so a price can draw the small symbol next to the large amount:
 * `990` becomes `{ symbol: "$", amount: "9.90" }`.
 */
export function formatMoneyParts(cents: number): { symbol: string; amount: string } {
  assertCents(cents);
  const parts = currency.formatToParts(cents / 100);
  return {
    symbol: parts
      .filter((part) => part.type === "currency")
      .map((part) => part.value)
      .join(""),
    amount: parts
      .filter((part) => part.type !== "currency")
      .map((part) => part.value)
      .join(""),
  };
}
