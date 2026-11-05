import { getAndCheck } from "../lib/http.js";

// GET /api/v1/checkout-config
export function getCheckoutConfig() {
  getAndCheck("/api/v1/checkout-config", {
    "GET /api/v1/checkout-config has the delivery fee of 350 cents": (r) =>
      r.json().deliveryFeeInCents === 350,
  });
}
