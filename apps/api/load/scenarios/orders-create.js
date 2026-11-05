import { postAndCheck, think } from "../lib/http.js";
import { ORDER_TOTAL_IN_CENTS, newOrderBody } from "../lib/orders.js";

// POST /api/v1/orders: 1 Latte and 2 Cuban, total 3320 cents. Every iteration stores an order.
export function createOrder() {
  postAndCheck("/api/v1/orders", newOrderBody(), 201, {
    "POST /api/v1/orders totals 3320 cents": (r) => r.json().totalInCents === ORDER_TOTAL_IN_CENTS,
  });
  think();
}
