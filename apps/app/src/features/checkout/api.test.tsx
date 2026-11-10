import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "../../api";
import { createTestQueryClient } from "../../test/coffees";
import {
  checkoutConfig,
  fakeCheckoutApi,
  postedOrders,
  postedQuotes,
  sampleOrder,
} from "../../test/checkout";
import { cuban, latte } from "../../test/coffees";
import {
  createOrder,
  getCheckoutConfig,
  getQuote,
  useCheckoutConfig,
  useCreateOrder,
  useQuote,
  type OrderRequest,
} from "./api";

afterEach(() => {
  vi.unstubAllGlobals();
});

function wrapperFor(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe("getCheckoutConfig", () => {
  it("reads GET /api/v1/checkout-config and returns the config as it is", async () => {
    const fetchMock = fakeCheckoutApi();

    await expect(getCheckoutConfig()).resolves.toEqual(checkoutConfig);

    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/v1/checkout-config");
    expect(fetchMock.mock.calls[0]?.[1]?.method).toBe("GET");
  });

  it("throws the ApiError of a failed request", async () => {
    fakeCheckoutApi({ configMode: "fail" });

    await expect(getCheckoutConfig()).rejects.toBeInstanceOf(ApiError);
  });
});

describe("useCheckoutConfig", () => {
  it("is pending, then has the config", async () => {
    fakeCheckoutApi();
    const { result } = renderHook(() => useCheckoutConfig(), {
      wrapper: wrapperFor(createTestQueryClient()),
    });

    expect(result.current.isPending).toBe(true);
    await waitFor(() => expect(result.current.data).toEqual(checkoutConfig));
    expect(result.current.data?.deliveryFeeInCents).toBe(350);
  });

  it("is in error when the request fails", async () => {
    fakeCheckoutApi({ configMode: "fail" });
    const { result } = renderHook(() => useCheckoutConfig(), {
      wrapper: wrapperFor(createTestQueryClient()),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it("shares one request between two readers (the cache key is checkout-config)", async () => {
    const fetchMock = fakeCheckoutApi();
    const client = createTestQueryClient();
    const { result } = renderHook(() => [useCheckoutConfig(), useCheckoutConfig()] as const, {
      wrapper: wrapperFor(client),
    });

    await waitFor(() => expect(result.current[1].data).toBeDefined());

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(client.getQueryData(["checkout-config"])).toEqual(checkoutConfig);
  });
});

const request: OrderRequest = {
  items: [{ coffeeId: latte.id, quantity: 2 }],
  address: {
    zipCode: "90250-440",
    street: "Rua João Daniel Martinelli",
    number: "102",
    complement: "",
    neighborhood: "Farrapos",
    city: "Porto Alegre",
    state: "RS",
  },
  paymentMethod: "credit_card",
};

describe("createOrder", () => {
  it("posts the request to /api/v1/orders as JSON and returns the order", async () => {
    const fetchMock = fakeCheckoutApi();

    await expect(createOrder({ request })).resolves.toEqual(sampleOrder);

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("/api/v1/orders");
    expect(init?.method).toBe("POST");
    expect(new Headers(init?.headers).get("Content-Type")).toBe("application/json");
    expect(postedOrders(fetchMock)).toEqual([request]);
  });

  it("sends the key as the Idempotency-Key header, and no header without one", async () => {
    const fetchMock = fakeCheckoutApi();

    await createOrder({ request, idempotencyKey: "3f2b8a1e-0000-4000-8000-000000000001" });
    await createOrder({ request });

    const withKey = new Headers(fetchMock.mock.calls[0]![1]?.headers);
    const withoutKey = new Headers(fetchMock.mock.calls[1]![1]?.headers);
    expect(withKey.get("Idempotency-Key")).toBe("3f2b8a1e-0000-4000-8000-000000000001");
    expect(withoutKey.has("Idempotency-Key")).toBe(false);
  });

  it("throws the ApiError of a 400 with its fields", async () => {
    fakeCheckoutApi({
      orderOutcome: { kind: "validation", fields: { "address.zipCode": "Enter a ZIP code." } },
    });

    await expect(createOrder({ request })).rejects.toMatchObject({
      status: 400,
      code: "validation_failed",
      fields: { "address.zipCode": "Enter a ZIP code." },
    });
  });
});

describe("useCreateOrder", () => {
  it("sends one request when mutated, and gives the order", async () => {
    const fetchMock = fakeCheckoutApi();
    const { result } = renderHook(() => useCreateOrder(), {
      wrapper: wrapperFor(createTestQueryClient()),
    });

    const order = await result.current.mutateAsync({ request });

    expect(order.id).toBe(sampleOrder.id);
    expect(postedOrders(fetchMock)).toHaveLength(1);
  });

  it("does not retry a failed request by itself", async () => {
    const fetchMock = fakeCheckoutApi({ orderOutcome: { kind: "server-error" } });
    const { result } = renderHook(() => useCreateOrder(), {
      wrapper: wrapperFor(createTestQueryClient()),
    });

    await expect(result.current.mutateAsync({ request })).rejects.toBeInstanceOf(ApiError);

    expect(postedOrders(fetchMock)).toHaveLength(1);
  });
});

describe("getQuote", () => {
  it("posts the items to /api/v1/orders/quote and returns the quote as it is", async () => {
    const fetchMock = fakeCheckoutApi();

    const quote = await getQuote({ items: [{ coffeeId: latte.id, quantity: 2 }] });

    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/v1/orders/quote");
    expect(fetchMock.mock.calls[0]?.[1]?.method).toBe("POST");
    expect(postedQuotes(fetchMock)).toEqual([{ items: [{ coffeeId: latte.id, quantity: 2 }] }]);
    expect(quote.subtotalInCents).toBe(latte.priceInCents * 2);
    expect(quote.deliveryFeeInCents).toBe(checkoutConfig.deliveryFeeInCents);
    expect(quote.totalInCents).toBe(latte.priceInCents * 2 + checkoutConfig.deliveryFeeInCents);
    expect(quote.items[0]).toMatchObject({ coffeeId: latte.id, name: "Latte", quantity: 2 });
  });

  it("throws the ApiError of a 422", async () => {
    fakeCheckoutApi({ quote: "unprocessable" });

    await expect(getQuote({ items: [{ coffeeId: latte.id, quantity: 1 }] })).rejects.toMatchObject({
      status: 422,
    });
  });
});

describe("useQuote", () => {
  const lines = [
    { coffeeId: latte.id, quantity: 2 },
    { coffeeId: cuban.id, quantity: 1 },
  ];
  const renderQuote = (fetchLines = lines, zipCode?: string, options?: { enabled?: boolean }) =>
    renderHook(({ zip }) => useQuote(fetchLines, zip, options), {
      initialProps: { zip: zipCode },
      wrapper: wrapperFor(createTestQueryClient()),
    });

  it("asks for the quote of the lines, with no ZIP code when none is given", async () => {
    const fetchMock = fakeCheckoutApi();
    const { result } = renderQuote();

    await waitFor(() => expect(result.current.data).toBeDefined());

    expect(postedQuotes(fetchMock)).toEqual([
      {
        items: [
          { coffeeId: latte.id, quantity: 2 },
          { coffeeId: cuban.id, quantity: 1 },
        ],
      },
    ]);
  });

  it("sends the ZIP code only when it is complete", async () => {
    const fetchMock = fakeCheckoutApi();
    const { result, rerender } = renderQuote(lines, "90250-4");
    await waitFor(() => expect(result.current.data).toBeDefined());

    rerender({ zip: "90250-440" });
    await waitFor(() => expect(postedQuotes(fetchMock)).toHaveLength(2));

    expect(postedQuotes(fetchMock)[0]).not.toHaveProperty("zipCode");
    expect(postedQuotes(fetchMock)[1]).toHaveProperty("zipCode", "90250-440");
  });

  it("does not ask again for a ZIP code that is still incomplete", async () => {
    const fetchMock = fakeCheckoutApi();
    const { result, rerender } = renderQuote(lines, "");
    await waitFor(() => expect(result.current.data).toBeDefined());

    rerender({ zip: "9025" });
    rerender({ zip: "90250-44" });

    expect(postedQuotes(fetchMock)).toHaveLength(1);
  });

  it("asks nothing for an empty cart, or while it is not enabled", () => {
    const fetchMock = fakeCheckoutApi();

    renderQuote([]);
    renderQuote(lines, undefined, { enabled: false });

    expect(postedQuotes(fetchMock)).toEqual([]);
  });

  it("keeps the previous quote while the quote of the new lines loads", async () => {
    fakeCheckoutApi({ quote: ["ok", "pending"] });
    const client = createTestQueryClient();
    const { result, rerender } = renderHook(({ current }) => useQuote(current, undefined), {
      initialProps: { current: lines },
      wrapper: wrapperFor(client),
    });
    await waitFor(() => expect(result.current.data).toBeDefined());
    const first = result.current.data;

    rerender({ current: [{ coffeeId: latte.id, quantity: 3 }] });

    expect(result.current.data).toBe(first);
    expect(result.current.isPlaceholderData).toBe(true);
  });
});
