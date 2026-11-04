import { getAndCheck } from "../lib/http.js";

// GET /api/v1
export function getApiInfo() {
  getAndCheck("/api/v1", {
    "GET /api/v1 returns the name and version": (r) => {
      const body = r.json();
      return body.name === "coffee-delivery-api" && body.version === "v1";
    },
  });
}
