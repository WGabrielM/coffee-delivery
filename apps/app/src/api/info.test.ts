import { afterEach, expect, it, vi } from "vitest";

import { getApiInfo } from "./info";

afterEach(() => {
  vi.unstubAllGlobals();
});

it("reads the API root", async () => {
  const fetchMock = vi.fn<typeof fetch>(
    async () =>
      new Response(JSON.stringify({ name: "coffee-delivery-api", version: "v1" }), {
        headers: { "Content-Type": "application/json" },
      }),
  );
  vi.stubGlobal("fetch", fetchMock);

  await expect(getApiInfo()).resolves.toEqual({ name: "coffee-delivery-api", version: "v1" });
  expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/v1");
});
