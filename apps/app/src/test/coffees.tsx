// Test helpers for everything that shows the catalog: sample coffees, a fake `GET /api/v1/coffees`,
// and a render that has a query client. The network is faked, not the hook, so the hook, the typed
// client, and the components are tested together.
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { vi } from "vitest";

import type { Coffee } from "../features/catalog/api";
import { CartProvider } from "../features/cart/cart-context";

export const traditionalEspresso: Coffee = {
  id: "2f6ffcd1-99dc-4734-83ea-6f17e7929870",
  slug: "traditional-espresso",
  name: "Traditional Espresso",
  description: "The traditional coffee made with hot water and ground beans",
  priceInCents: 990,
  tags: [{ slug: "traditional", name: "Traditional" }],
};

export const cuban: Coffee = {
  id: "0b0d6a3e-6f1c-4a52-8a7c-3d1f4f0f8c11",
  slug: "cuban",
  name: "Cuban",
  description: "Iced espresso drink with rum, cream and mint",
  priceInCents: 1250,
  tags: [
    { slug: "special", name: "Special" },
    { slug: "alcoholic", name: "Alcoholic" },
    { slug: "iced", name: "Iced" },
  ],
};

export const latte: Coffee = {
  id: "5c7d3f6a-2f55-4e0b-9d38-6a4c1f7e2b90",
  slug: "latte",
  name: "Latte",
  description: "A shot of espresso coffee with double the milk and creamy foam",
  priceInCents: 990,
  tags: [
    { slug: "traditional", name: "Traditional" },
    { slug: "with-milk", name: "With milk" },
  ],
};

export const sampleCoffees: Coffee[] = [traditionalEspresso, cuban, latte];

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** Answers every request with the coffees. Returns the mock, so a test can read the calls. */
export function fakeCoffeesApi(coffees: Coffee[] = sampleCoffees) {
  const fetchMock = vi.fn<typeof fetch>(async () => json({ coffees }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

/** A request that never answers, to keep the page in the loading state. */
export function fakePendingApi() {
  const fetchMock = vi.fn<typeof fetch>(() => new Promise<Response>(() => {}));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

/** Fails with the API's error shape; `answers` after that, when given, are the next responses. */
export function fakeFailingApi(...next: Response[]) {
  const answers = [...next];
  const fetchMock = vi.fn<typeof fetch>(
    async () =>
      answers.shift() ?? json({ error: { code: "unavailable", message: "Try again later." } }, 503),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

export function coffeesResponse(coffees: Coffee[]): Response {
  return json({ coffees });
}

/** A query client for tests: no retry, so a failure shows at once. */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

/** A render with the cart, which is what every card and the layout read. */
export function renderWithCart(ui: ReactElement) {
  return render(<CartProvider>{ui}</CartProvider>);
}

export function renderWithQuery(ui: ReactElement, client = createTestQueryClient()) {
  return {
    client,
    ...render(
      <QueryClientProvider client={client}>
        <CartProvider>{ui}</CartProvider>
      </QueryClientProvider>,
    ),
  };
}

/**
 * Answers like the server: `?tags=a,b` keeps the coffees that have every tag (AND), no `tags`
 * returns all of them. Returns the mock, so a test can read the URLs that were requested.
 */
export function fakeFilteringApi(catalog: Coffee[] = sampleCoffees) {
  const fetchMock = vi.fn<typeof fetch>(async (input) => {
    const wanted = (new URL(String(input), "http://localhost").searchParams.get("tags") ?? "")
      .split(",")
      .filter(Boolean);
    const coffees = catalog.filter((coffee) =>
      wanted.every((slug) => coffee.tags.some((tag) => tag.slug === slug)),
    );
    return json({ coffees });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

/** The URLs the app asked for, as `/api/v1/coffees` plus the query string. */
export function requestedUrls(fetchMock: ReturnType<typeof fakeFilteringApi>): string[] {
  return fetchMock.mock.calls.map(([input]) => String(input));
}
