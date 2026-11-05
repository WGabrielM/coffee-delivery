import { getAndCheck } from "../lib/http.js";

// GET /api/v1/coffees, then the same list filtered with ?tags=special,iced (only the Cuban)
export function listCoffees() {
  getAndCheck("/api/v1/coffees", {
    "GET /api/v1/coffees returns the 14 coffees": (r) => r.json().coffees.length === 14,
  });
  getAndCheck("/api/v1/coffees?tags=special,iced", {
    "GET /api/v1/coffees?tags=special,iced returns one coffee": (r) =>
      r.json().coffees.length === 1,
  });
}
