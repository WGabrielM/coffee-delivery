import { postAndCheck, think } from "../lib/http.js";
import { ORDER_TOTAL_IN_CENTS, newOrderBody } from "../lib/orders.js";

// A version 4 UUID for the Idempotency-Key header (k6 has no crypto.randomUUID).
function newKey() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16);
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

// POST /api/v1/orders: 1 Latte and 2 Cuban, total 3320 cents. Every iteration stores one order: it
// is sent with a key, then sent again with the same key, which must answer 200 with the same order
// and store nothing (this is the retry of a person whose first answer was lost).
export function createOrder() {
  const headers = { "Idempotency-Key": newKey() };
  const body = newOrderBody();
  const first = postAndCheck(
    "/api/v1/orders",
    body,
    201,
    {
      "POST /api/v1/orders totals 3320 cents": (r) =>
        r.json().totalInCents === ORDER_TOTAL_IN_CENTS,
    },
    headers,
  );
  postAndCheck(
    "/api/v1/orders",
    body,
    200,
    { "POST /api/v1/orders replay returns the same order": (r) => r.json().id === first.json().id },
    headers,
  );
  think();
}
