// Rate limit check (spec 038): a spike of orders from one client against the packaged app, which
// limits POST /api/v1/orders to 10 a minute with a burst of 5 (apps/app/nginx.conf). It is not a
// profile of the other scenarios: run it against the app image on port 8080, not against the API
// directly (the API has no limit, on purpose).
//
//   yarn docker:up
//   BASE_URL=http://localhost:8080 node scripts/load.mjs rate-limit
//
// It passes when some orders are answered 429 and the number of orders created is not higher than
// the limit allows: the first one, the burst, and one more every 6 seconds.
import http from "k6/http";
import { check } from "k6";
import { Counter } from "k6/metrics";

import { coffeeId } from "./lib/catalog.js";
import { BASE_URL } from "./lib/config.js";
import { newOrderBody } from "./lib/orders.js";

// The numbers of apps/app/nginx.conf.
const RATE_PER_MINUTE = 10;
const BURST = 5;

const DURATION_SECONDS = 30;
const REQUESTS_PER_SECOND = 20;
// One order passes at once, the burst follows, and a new slot opens every 60 / RATE seconds.
const ALLOWED = 1 + BURST + Math.ceil((RATE_PER_MINUTE * DURATION_SECONDS) / 60) + 1;

const created = new Counter("orders_created");
const limited = new Counter("orders_limited");

export const options = {
  scenarios: {
    spike: {
      executor: "constant-arrival-rate",
      rate: REQUESTS_PER_SECOND,
      timeUnit: "1s",
      duration: `${DURATION_SECONDS}s`,
      preAllocatedVUs: 20,
    },
  },
  thresholds: {
    orders_limited: ["count>0"],
    orders_created: [`count<=${ALLOWED}`],
    checks: ["rate==1"],
  },
};

export function setup() {
  // Read the catalog once, so the spike itself is only orders.
  return { coffee: coffeeId("latte") };
}

export default function () {
  const body = newOrderBody();
  const response = http.post(`${BASE_URL}/api/v1/orders`, JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    tags: { name: "POST /api/v1/orders" },
    responseCallback: http.expectedStatuses(201, 429),
  });
  if (response.status === 201) created.add(1);
  if (response.status === 429) limited.add(1);
  check(response, {
    "the answer is 201 or 429": (r) => r.status === 201 || r.status === 429,
    "a 429 has the error body of the API": (r) =>
      r.status !== 429 || r.json().error.code === "too_many_requests",
    "a 429 asks to wait": (r) => r.status !== 429 || r.headers["Retry-After"] === "60",
  });
}
