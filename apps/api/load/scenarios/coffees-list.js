import { getAndCheck } from "../lib/http.js";

// GET /api/v1/coffees
export function listCoffees() {
  getAndCheck("/api/v1/coffees", {
    "GET /api/v1/coffees returns the 14 coffees": (r) => r.json().coffees.length === 14,
  });
}
