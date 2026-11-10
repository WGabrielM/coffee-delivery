// The cart rules, with no browser API and no React: a pure reducer over lines of
// `{ coffeeId, quantity }`. Names, photos, and prices are never stored here; they come from the
// catalog, so a saved cart cannot show a stale price.

import { MAX_QUANTITY, MIN_QUANTITY } from "../../lib/quantity-limits";

export type CartLine = { readonly coffeeId: string; readonly quantity: number };

export type CartAction =
  | { type: "add"; coffeeId: string; quantity: number }
  | { type: "setQuantity"; coffeeId: string; quantity: number }
  | { type: "remove"; coffeeId: string }
  | { type: "clear" };

/** The quantity of a saved line: a whole number from the least to the most of an order. */
export function isValidQuantity(quantity: unknown): quantity is number {
  return (
    Number.isInteger(quantity) &&
    (quantity as number) >= MIN_QUANTITY &&
    (quantity as number) <= MAX_QUANTITY
  );
}

/** A requested quantity as a whole number (`2.9` is `2`), or `undefined` when it is not a finite number. */
function wholeNumber(quantity: number): number | undefined {
  return Number.isFinite(quantity) ? Math.trunc(quantity) : undefined;
}

function clamp(quantity: number): number {
  return Math.min(MAX_QUANTITY, Math.max(MIN_QUANTITY, quantity));
}

function add(lines: readonly CartLine[], coffeeId: string, requested: number): readonly CartLine[] {
  const amount = wholeNumber(requested);
  if (coffeeId === "" || amount === undefined || amount < MIN_QUANTITY) return lines;

  const existing = lines.find((line) => line.coffeeId === coffeeId);
  if (!existing) return [...lines, { coffeeId, quantity: clamp(amount) }];

  const quantity = clamp(existing.quantity + amount);
  if (quantity === existing.quantity) return lines;
  return lines.map((line) => (line === existing ? { coffeeId, quantity } : line));
}

function setQuantity(
  lines: readonly CartLine[],
  coffeeId: string,
  requested: number,
): readonly CartLine[] {
  const amount = wholeNumber(requested);
  const existing = lines.find((line) => line.coffeeId === coffeeId);
  if (!existing || amount === undefined) return lines;

  const quantity = clamp(amount);
  if (quantity === existing.quantity) return lines;
  return lines.map((line) => (line === existing ? { coffeeId, quantity } : line));
}

function remove(lines: readonly CartLine[], coffeeId: string): readonly CartLine[] {
  return lines.some((line) => line.coffeeId === coffeeId)
    ? lines.filter((line) => line.coffeeId !== coffeeId)
    : lines;
}

/**
 * The next cart for an action. It returns the same array when nothing changes, so a caller can tell
 * "no change" from "changed" by reference, and it never changes the array it receives.
 */
export function cartReducer(lines: readonly CartLine[], action: CartAction): readonly CartLine[] {
  switch (action.type) {
    case "add":
      return add(lines, action.coffeeId, action.quantity);
    case "setQuantity":
      return setQuantity(lines, action.coffeeId, action.quantity);
    case "remove":
      return remove(lines, action.coffeeId);
    case "clear":
      return lines.length === 0 ? lines : [];
  }
}

/** The number of coffees in the cart, not the number of lines. */
export function totalQuantity(lines: readonly CartLine[]): number {
  return lines.reduce((sum, line) => sum + line.quantity, 0);
}
