import { postAndCheck, think } from "../lib/http.js";
import { ORDER_TOTAL_IN_CENTS, newOrderBody } from "../lib/orders.js";

// POST /api/v1/orders/quote: the same 1 Latte and 2 Cuban as the order, priced and not stored.
// The numbers must be the ones of the order, 3320 cents, with and without a ZIP code.
export function quoteOrder() {
  const { items } = newOrderBody();
  postAndCheck("/api/v1/orders/quote", { items }, 200, {
    "POST /api/v1/orders/quote totals 3320 cents": (r) =>
      r.json().totalInCents === ORDER_TOTAL_IN_CENTS,
    "POST /api/v1/orders/quote has the fee of 350 cents": (r) =>
      r.json().deliveryFeeInCents === 350,
  });
  postAndCheck("/api/v1/orders/quote", { items, zipCode: "01310-100" }, 200, {
    "POST /api/v1/orders/quote with a ZIP code totals 3320 cents": (r) =>
      r.json().totalInCents === ORDER_TOTAL_IN_CENTS,
  });
  think();
}
