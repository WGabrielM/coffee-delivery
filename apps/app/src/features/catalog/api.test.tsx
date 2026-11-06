import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "../../api";
import {
  createTestQueryClient,
  fakeCoffeesApi,
  fakeFailingApi,
  fakeFilteringApi,
  requestedUrls,
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

  it("sends the tags as a comma separated list, in the order given", async () => {
    const fetchMock = fakeFilteringApi();

    await listCoffees(["special", "iced"]);

    expect(requestedUrls(fetchMock)).toEqual(["/api/v1/coffees?tags=special,iced"]);
  });

  it("sends no tags parameter for an empty list", async () => {
    const fetchMock = fakeFilteringApi();

    await listCoffees([]);
    await listCoffees();

    expect(requestedUrls(fetchMock)).toEqual(["/api/v1/coffees", "/api/v1/coffees"]);
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

  it("asks for the tags it is given and caches each list under [coffees, tags]", async () => {
    const fetchMock = fakeFilteringApi();
    const client = createTestQueryClient();

    const { result } = renderHook(() => useCoffees(["special", "iced"]), {
      wrapper: wrapperFor(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(requestedUrls(fetchMock)).toEqual(["/api/v1/coffees?tags=special,iced"]);
    expect(result.current.data?.map((coffee) => coffee.slug)).toEqual(["cuban"]);
    expect(client.getQueryData(["coffees", ["special", "iced"]])).toHaveLength(1);
  });

  it("keeps the previous list while the list of new tags loads", async () => {
    fakeFilteringApi();
    const client = createTestQueryClient();

    const { result, rerender } = renderHook(({ tags }) => useCoffees(tags), {
      wrapper: wrapperFor(client),
      initialProps: { tags: [] as string[] },
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(3);

    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>(() => new Promise<Response>(() => {})),
    );
    rerender({ tags: ["special"] });

    expect(result.current.isPlaceholderData).toBe(true);
    expect(result.current.data).toHaveLength(3);
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
