// Test helpers for the order page: a fake `GET /api/v1/orders/{id}` and a render with the router, so
// the hook, the typed client, and the page are tested together.
import { QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { vi } from "vitest";

import { routes } from "../app/routes";
import { CartProvider } from "../features/cart/cart-context";
import type { Order } from "../features/checkout/api";
import { sampleOrder } from "./checkout";
import { createTestQueryClient } from "./coffees";

export { sampleOrder };

export type OrderAnswer = "ok" | "not-found" | "fail" | "pending";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Answers `GET /api/v1/orders/{id}`: the order, a `404`, a `500`, or never. A list gives one answer
 * per request, in order, and the last one stays. Returns the mock, so a test can read the URLs.
 */
export function fakeOrderApi(
  answers: OrderAnswer | OrderAnswer[] = "ok",
  order: Order = sampleOrder,
) {
  const queue = Array.isArray(answers) ? [...answers] : [answers];
  const fetchMock = vi.fn<typeof fetch>(async () => {
    const answer = queue.length > 1 ? queue.shift()! : queue[0]!;
    if (answer === "pending") return new Promise<Response>(() => {});
    if (answer === "not-found") {
      return json(
        { error: { code: "not_found", message: "The requested resource was not found." } },
        404,
      );
    }
    if (answer === "fail") {
      return json({ error: { code: "unexpected_error", message: "Something went wrong." } }, 500);
    }
    return json(order);
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

/** The app at `/orders/<id>`, inside the real layout and routes. */
export function renderOrderPage(orderId: string = sampleOrder.id) {
  const router = createMemoryRouter(routes, { initialEntries: [`/orders/${orderId}`] });
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <CartProvider>
        <RouterProvider router={router} />
      </CartProvider>
    </QueryClientProvider>,
  );
}
