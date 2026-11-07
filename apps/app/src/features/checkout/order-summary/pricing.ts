import type { CartLine } from "../../cart/cart-reducer";
import type { Coffee } from "../../catalog/api";

/** One coffee of the cart with its quantity and its line price. */
export type PricedRow = {
  coffee: Coffee;
  quantity: number;
  /** Unit price × quantity, whole cents. */
  lineTotalInCents: number;
};

export type PricedOrder = {
  rows: PricedRow[];
  itemsTotalInCents: number;
  deliveryFeeInCents: number;
  totalInCents: number;
};

/**
 * The summary of the order, in whole cents. Names and prices come from the catalog (the cart keeps
 * only ids and quantities); the fee is the one the server publishes. A line whose coffee is not in
 * the catalog has no price, so it is left out.
 */
export function priceOrder(
  lines: readonly CartLine[],
  catalog: readonly Coffee[],
  deliveryFeeInCents: number,
): PricedOrder {
  const byId = new Map(catalog.map((coffee) => [coffee.id, coffee]));
  const rows: PricedRow[] = [];
  for (const { coffeeId, quantity } of lines) {
    const coffee = byId.get(coffeeId);
    if (coffee) rows.push({ coffee, quantity, lineTotalInCents: coffee.priceInCents * quantity });
  }
  const itemsTotalInCents = rows.reduce((sum, row) => sum + row.lineTotalInCents, 0);
  return {
    rows,
    itemsTotalInCents,
    deliveryFeeInCents,
    totalInCents: itemsTotalInCents + deliveryFeeInCents,
  };
}
