// Test helpers for the checkout: the config of the server and a fake API that answers both
// `GET /api/v1/coffees` and `GET /api/v1/checkout-config`, so the hooks, the typed client, and the
// components are tested together.
import { render, screen } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { vi } from "vitest";

import { routes } from "../app/routes";
import { CartProvider } from "../features/cart/cart-context";
import type { CartLine } from "../features/cart/cart-reducer";
import { saveCart } from "../features/cart/cart-storage";
import type { Coffee } from "../features/catalog/api";
import type { CheckoutConfig, Order, OrderRequest } from "../features/checkout/api";
import { createTestQueryClient, latte, sampleCoffees } from "./coffees";

export const checkoutConfig: CheckoutConfig = {
  currency: "USD",
  deliveryFeeInCents: 350,
  estimatedDeliveryMinutes: { min: 20, max: 30 },
  paymentMethods: ["credit_card", "debit_card", "cash"],
};

/** What one endpoint does: answer, fail with the API's error shape, or never answer. */
export type Mode = "ok" | "fail" | "pending";

/** The order the server confirms in the tests: Latte × 2 and the design sample address. */
export const sampleOrder: Order = {
  id: "3b9f0c1e-5d2a-4e7b-9a41-0f6c8d7e2a15",
  status: "confirmed",
  items: [
    {
      coffeeId: latte.id,
      name: "Latte",
      quantity: 2,
      unitPriceInCents: 990,
      lineTotalInCents: 1980,
    },
  ],
  address: {
    zipCode: "90250-440",
    street: "Rua João Daniel Martinelli",
    number: "102",
    complement: null,
    neighborhood: "Farrapos",
    city: "Porto Alegre",
    state: "RS",
  },
  paymentMethod: "credit_card",
  subtotalInCents: 1980,
  deliveryFeeInCents: 350,
  totalInCents: 2330,
  currency: "USD",
  estimatedDeliveryMinutes: { min: 20, max: 30 },
  createdAt: "2026-11-07T12:00:00.123456Z",
};

/** How `POST /api/v1/orders` answers in a test. */
export type OrderOutcome =
  | { kind: "created"; order?: Order }
  | { kind: "validation"; fields: Record<string, string> }
  | { kind: "unprocessable" }
  | { kind: "server-error" }
  | { kind: "network-error" }
  | { kind: "pending" };

type Options = {
  coffees?: Coffee[];
  config?: CheckoutConfig;
  /** One mode, or one per request in order; the last one stays for the next requests. */
  catalog?: Mode | Mode[];
  configMode?: Mode | Mode[];
  /** The answer of `POST /api/v1/orders`; it creates the sample order when omitted. */
  orderOutcome?: OrderOutcome | OrderOutcome[];
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
  orderOutcome = { kind: "created" },
}: Options = {}) {
  const catalogMode = sequence(catalog);
  const configNext = sequence(configMode);
  const outcomes = Array.isArray(orderOutcome) ? [...orderOutcome] : [orderOutcome];
  const nextOutcome = () => (outcomes.length > 1 ? outcomes.shift()! : outcomes[0]!);
  const fetchMock = vi.fn<typeof fetch>(async (input, init) => {
    const path = String(input);
    if (path.startsWith("/api/v1/orders") && init?.method === "POST") {
      const outcome = nextOutcome();
      switch (outcome.kind) {
        case "created":
          return json(outcome.order ?? sampleOrder, 201);
        case "validation":
          return json(
            {
              error: {
                code: "validation_failed",
                message: "The request has invalid fields.",
                fields: outcome.fields,
              },
            },
            400,
          );
        case "unprocessable":
          return json(
            {
              error: {
                code: "unprocessable_content",
                message: "The order cannot be processed.",
                fields: { items: "Unknown coffee." },
              },
            },
            422,
          );
        case "server-error":
          return json(
            { error: { code: "unexpected_error", message: "Something went wrong." } },
            500,
          );
        case "network-error":
          throw new TypeError("Failed to fetch");
        case "pending":
          return new Promise<Response>(() => {});
      }
    }
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

/** The bodies of the `POST /api/v1/orders` requests, parsed. */
export function postedOrders(fetchMock: ReturnType<typeof fakeCheckoutApi>): OrderRequest[] {
  return fetchMock.mock.calls
    .filter(
      ([input, init]) => String(input).startsWith("/api/v1/orders") && init?.method === "POST",
    )
    .map(([, init]) => JSON.parse(String(init?.body)) as OrderRequest);
}

/**
 * Renders a checkout (a form, with or without its cards) inside the providers it needs: a query
 * client, the cart, and a router with the checkout and the order page, so a test can see where the
 * app went after an order.
 */
export function renderCheckoutPage(ui: ReactElement) {
  const router = createMemoryRouter(
    [
      { path: "/checkout", element: ui },
      { path: "/orders/:orderId", element: <p>The order page</p> },
    ],
    { initialEntries: ["/checkout"] },
  );
  return {
    router,
    ...render(
      <QueryClientProvider client={createTestQueryClient()}>
        <CartProvider>
          <RouterProvider router={router} />
        </CartProvider>
      </QueryClientProvider>,
    ),
  };
}

/**
 * The real checkout route (`/checkout`) inside the real layout, with a saved cart, so a test can read
 * the navbar badge too. The page is its own chunk, loaded when the route is visited: this waits for
 * its level 1.
 */
export async function renderCheckoutRoute(lines: CartLine[]) {
  saveCart(lines);
  const router = createMemoryRouter(routes, { initialEntries: ["/checkout"] });
  const view = render(
    <QueryClientProvider client={createTestQueryClient()}>
      <CartProvider>
        <RouterProvider router={router} />
      </CartProvider>
    </QueryClientProvider>,
  );
  await screen.findByRole("heading", { level: 1, name: "Checkout" });
  return view;
}
