import http from "k6/http";

import { BASE_URL } from "../lib/config.js";
import { getAndCheck, think } from "../lib/http.js";
import { ORDER_TOTAL_IN_CENTS, newOrderBody } from "../lib/orders.js";

// Module variables are per virtual user: each user creates its own order once (its setup), then
// reads it on every iteration.
let orderId;

function createOrderForThisUser() {
  const response = http.post(`${BASE_URL}/api/v1/orders`, JSON.stringify(newOrderBody()), {
    headers: { "Content-Type": "application/json" },
    tags: { name: "POST /api/v1/orders (setup)" },
  });
  return response.json().id;
}

// GET /api/v1/orders/{id}
export function getOrder() {
  if (!orderId) {
    orderId = createOrderForThisUser();
  }
  getAndCheck(
    `/api/v1/orders/${orderId}`,
    {
      "GET /api/v1/orders/{id} returns the same order with a total of 3320 cents": (r) =>
        r.json().id === orderId && r.json().totalInCents === ORDER_TOTAL_IN_CENTS,
    },
    "/api/v1/orders/{id}",
  );
  think();
}
