// The only code that touches `localStorage`. The cart is read from outside the app, so every value
// is checked, and a browser that refuses storage (blocked site data, a full quota) must never break
// the cart: it keeps working in memory.
import { isValidQuantity, type CartLine } from "./cart-reducer";

export const CART_STORAGE_KEY = "coffee-delivery:cart:v1";

/** A saved line, or `undefined` when it is not one. Only `coffeeId` and `quantity` are kept. */
function parseLine(value: unknown): CartLine | undefined {
  if (typeof value !== "object" || value === null) return undefined;
  const { coffeeId, quantity } = value as Record<string, unknown>;
  if (typeof coffeeId !== "string" || coffeeId === "" || !isValidQuantity(quantity)) {
    return undefined;
  }
  return { coffeeId, quantity };
}

/** Each invalid line is dropped on its own; a coffee that appears twice keeps its first line. */
function parseLines(value: unknown): CartLine[] {
  if (!Array.isArray(value)) return [];
  const lines: CartLine[] = [];
  for (const item of value) {
    const line = parseLine(item);
    if (line && !lines.some((existing) => existing.coffeeId === line.coffeeId)) lines.push(line);
  }
  return lines;
}

export function loadCart(): CartLine[] {
  try {
    const text = window.localStorage.getItem(CART_STORAGE_KEY);
    return text === null ? [] : parseLines(JSON.parse(text));
  } catch {
    // Invalid JSON, or the browser refused the access: start with an empty cart.
    return [];
  }
}

export function saveCart(lines: readonly CartLine[]): void {
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(lines));
  } catch {
    // Storage is blocked or full: the cart stays in memory and is lost on reload.
  }
}
