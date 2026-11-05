import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "../../api";
import {
  createTestQueryClient,
  fakeCoffeesApi,
  fakeFailingApi,
  sampleCoffees,
} from "../../test/coffees";
import { listCoffees, useCoffees } from "./api";

afterEach(() => {
  vi.unstubAllGlobals();
});

function wrapperFor(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe("listCoffees", () => {
  it("reads GET /api/v1/coffees and returns the coffees in the order of the API", async () => {
    const fetchMock = fakeCoffeesApi();

    await expect(listCoffees()).resolves.toEqual(sampleCoffees);

    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/v1/coffees");
    expect(fetchMock.mock.calls[0]?.[1]?.method).toBe("GET");
  });

  it("returns an empty list when the API has no coffee", async () => {
    fakeCoffeesApi([]);

    await expect(listCoffees()).resolves.toEqual([]);
  });

  it("rejects with the ApiError of a failed request", async () => {
    fakeFailingApi();

    await expect(listCoffees()).rejects.toMatchObject({
      status: 503,
      code: "unavailable",
    });
    await expect(listCoffees()).rejects.toBeInstanceOf(ApiError);
  });
});

describe("useCoffees", () => {
  it("loads the coffees and caches them under the key [coffees, tags] with no tags yet", async () => {
    fakeCoffeesApi();
    const client = createTestQueryClient();

    const { result } = renderHook(() => useCoffees(), { wrapper: wrapperFor(client) });

    expect(result.current.isPending).toBe(true);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(sampleCoffees);
    expect(client.getQueryData(["coffees", []])).toEqual(sampleCoffees);
  });

  it("exposes the error and loads again on refetch", async () => {
    fakeFailingApi(); // the first answer is a 503
    const { result } = renderHook(() => useCoffees(), {
      wrapper: wrapperFor(createTestQueryClient()),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(ApiError);

    fakeCoffeesApi();
    await result.current.refetch();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(sampleCoffees);
  });
});
