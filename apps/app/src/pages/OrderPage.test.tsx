import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { fakeOrderApi, renderOrderPage, sampleOrder } from "../test/orders";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("OrderPage", () => {
  it("shows the order of the id in the URL, at /orders/:orderId", async () => {
    const fetchMock = fakeOrderApi();
    await renderOrderPage(sampleOrder.id);

    expect(
      await screen.findByRole("heading", { level: 1, name: "Uhu! Order confirmed" }),
    ).toBeInTheDocument();
    expect(fetchMock.mock.calls[0]?.[0]).toBe(`/api/v1/orders/${sampleOrder.id}`);
  });
});
