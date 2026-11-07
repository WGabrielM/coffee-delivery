import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createQueryClient } from "../../app/providers";
import { ApiError } from "../../api";
import { createTestQueryClient } from "../../test/coffees";
import { fakeOrderApi, sampleOrder } from "../../test/orders";
import { getOrder, useOrder } from "./api";

afterEach(() => {
  vi.unstubAllGlobals();
});

function wrapperFor(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe("getOrder", () => {
  it("reads GET /api/v1/orders/{id} and returns the order as it is", async () => {
    const fetchMock = fakeOrderApi();

    await expect(getOrder(sampleOrder.id)).resolves.toEqual(sampleOrder);

    expect(fetchMock.mock.calls[0]?.[0]).toBe(`/api/v1/orders/${sampleOrder.id}`);
    expect(fetchMock.mock.calls[0]?.[1]?.method).toBe("GET");
  });

  it("encodes the id, so a path-like value cannot change the URL", async () => {
    const fetchMock = fakeOrderApi();

    await getOrder("a/b?c");

    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/v1/orders/a%2Fb%3Fc");
  });

  it("throws an ApiError with status 404 for an order that does not exist", async () => {
    fakeOrderApi("not-found");

    await expect(getOrder("nope")).rejects.toMatchObject({ status: 404, code: "not_found" });
  });
});

describe("useOrder", () => {
  it("is pending, then has the order, cached under [orders, id]", async () => {
    fakeOrderApi();
    const client = createTestQueryClient();
    const { result } = renderHook(() => useOrder(sampleOrder.id), { wrapper: wrapperFor(client) });

    expect(result.current.isPending).toBe(true);
    await waitFor(() => expect(result.current.data).toEqual(sampleOrder));
    expect(client.getQueryData(["orders", sampleOrder.id])).toEqual(sampleOrder);
  });

  it("is in error with the ApiError when the order is not found", async () => {
    fakeOrderApi("not-found");
    const { result } = renderHook(() => useOrder("nope"), {
      wrapper: wrapperFor(createTestQueryClient()),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(ApiError);
    expect((result.current.error as ApiError).status).toBe(404);
  });

  it("is not asked again after a 404 when the hook uses the client of the app", async () => {
    const fetchMock = fakeOrderApi("not-found");
    const { result } = renderHook(() => useOrder("nope"), {
      wrapper: wrapperFor(createQueryClient()),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
