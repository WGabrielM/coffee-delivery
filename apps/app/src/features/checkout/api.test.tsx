import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "../../api";
import { createTestQueryClient } from "../../test/coffees";
import { checkoutConfig, fakeCheckoutApi, postedOrders, sampleOrder } from "../../test/checkout";
import { latte } from "../../test/coffees";
import {
  createOrder,
  getCheckoutConfig,
  useCheckoutConfig,
  useCreateOrder,
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
