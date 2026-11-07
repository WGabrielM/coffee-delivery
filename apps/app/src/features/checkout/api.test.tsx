import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "../../api";
import { createTestQueryClient } from "../../test/coffees";
import { checkoutConfig, fakeCheckoutApi } from "../../test/checkout";
import { getCheckoutConfig, useCheckoutConfig } from "./api";

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
