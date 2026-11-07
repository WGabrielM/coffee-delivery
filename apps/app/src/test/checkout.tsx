// Test helpers for the checkout: the config of the server and a fake API that answers both
// `GET /api/v1/coffees` and `GET /api/v1/checkout-config`, so the hooks, the typed client, and the
// components are tested together.
import { vi } from "vitest";

import type { Coffee } from "../features/catalog/api";
import type { CheckoutConfig } from "../features/checkout/api";
import { sampleCoffees } from "./coffees";

export const checkoutConfig: CheckoutConfig = {
  currency: "USD",
  deliveryFeeInCents: 350,
  estimatedDeliveryMinutes: { min: 20, max: 30 },
  paymentMethods: ["credit_card", "debit_card", "cash"],
};

/** What one endpoint does: answer, fail with the API's error shape, or never answer. */
export type Mode = "ok" | "fail" | "pending";

type Options = {
  coffees?: Coffee[];
  config?: CheckoutConfig;
  /** One mode, or one per request in order; the last one stays for the next requests. */
  catalog?: Mode | Mode[];
  configMode?: Mode | Mode[];
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function sequence(modes: Mode | Mode[] = "ok"): () => Mode {
  const queue = Array.isArray(modes) ? [...modes] : [modes];
  return () => (queue.length > 1 ? queue.shift()! : queue[0]!);
}

/** Answers by URL. Returns the mock, so a test can count the requests of each endpoint. */
export function fakeCheckoutApi({
  coffees = sampleCoffees,
  config = checkoutConfig,
  catalog,
  configMode,
}: Options = {}) {
  const catalogMode = sequence(catalog);
  const configNext = sequence(configMode);
  const fetchMock = vi.fn<typeof fetch>(async (input) => {
    const path = String(input);
    const isConfig = path.startsWith("/api/v1/checkout-config");
    const mode = isConfig ? configNext() : catalogMode();
    if (mode === "pending") return new Promise<Response>(() => {});
    if (mode === "fail") {
      return json({ error: { code: "unavailable", message: "Try again later." } }, 503);
    }
    return isConfig ? json(config) : json({ coffees });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

/** How many requests asked for the checkout config. */
export function configRequests(fetchMock: ReturnType<typeof fakeCheckoutApi>): number {
  return fetchMock.mock.calls.filter(([input]) => String(input).includes("/checkout-config"))
    .length;
}

/** How many requests asked for the catalog. */
export function catalogRequests(fetchMock: ReturnType<typeof fakeCheckoutApi>): number {
  return fetchMock.mock.calls.filter(([input]) => String(input).includes("/coffees")).length;
}
