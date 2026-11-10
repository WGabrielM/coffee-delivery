import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { accessibilityViolations } from "../test/axe";
import { fakeOrderApi, renderOrderPage, sampleOrder } from "../test/orders";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("OrderPage with an order", () => {
  it("asks the API for the order of the URL and shows the confirmation", async () => {
    const fetchMock = fakeOrderApi();
    await renderOrderPage();

    expect(
      await screen.findByRole("heading", { level: 1, name: "Uhu! Order confirmed" }),
    ).toBeInTheDocument();
    expect(fetchMock.mock.calls[0]?.[0]).toBe(`/api/v1/orders/${sampleOrder.id}`);
    expect(screen.getByRole("list", { name: "Order details" })).toBeInTheDocument();
  });

  it("starts the content on the 160 px page margin, inside the layout", async () => {
    fakeOrderApi();
    const { container } = await renderOrderPage();
    await screen.findByRole("heading", { level: 1, name: "Uhu! Order confirmed" });

    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(container.querySelector(".px-page .max-w-content")).toBeInTheDocument();
  });

  it("shows the empty cart badge when the cart is empty", async () => {
    fakeOrderApi();
    await renderOrderPage();
    await screen.findByRole("heading", { level: 1, name: "Uhu! Order confirmed" });

    expect(screen.getByRole("link", { name: "Cart, empty" })).toBeInTheDocument();
  });

  it("has no accessibility violation", async () => {
    fakeOrderApi();
    const { container } = await renderOrderPage();
    await screen.findByRole("heading", { level: 1, name: "Uhu! Order confirmed" });

    expect(await accessibilityViolations(container)).toEqual([]);
  });
});

describe("OrderPage while it loads", () => {
  it("shows Loading your order… and keeps one level 1 for screen readers", async () => {
    fakeOrderApi("pending");
    await renderOrderPage();

    expect(screen.getByText("Loading your order…")).toBeInTheDocument();
    const title = screen.getByRole("heading", { level: 1, name: "Order confirmation" });
    expect(title).toHaveClass("sr-only");
    expect(screen.queryByText("Uhu! Order confirmed")).not.toBeInTheDocument();
  });

  it("marks the main area busy", async () => {
    fakeOrderApi("pending");
    const { container } = await renderOrderPage();

    expect(container.querySelector("[aria-busy=true]")).toBeInTheDocument();
  });
});

describe("OrderPage with an order that is not found", () => {
  it("shows Order not found and a link Back to coffees to the home page", async () => {
    fakeOrderApi("not-found");
    await renderOrderPage("00000000-0000-4000-8000-000000000000");

    expect(
      await screen.findByRole("heading", { level: 1, name: "Order not found" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to coffees" })).toHaveAttribute("href", "/");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("treats a malformed id the same way (the API answers 404)", async () => {
    const fetchMock = fakeOrderApi("not-found");
    await renderOrderPage("not-a-uuid");

    expect(
      await screen.findByRole("heading", { level: 1, name: "Order not found" }),
    ).toBeInTheDocument();
    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/v1/orders/not-a-uuid");
  });

  it("has no accessibility violation", async () => {
    fakeOrderApi("not-found");
    const { container } = await renderOrderPage("nope");
    await screen.findByRole("heading", { level: 1, name: "Order not found" });

    expect(await accessibilityViolations(container)).toEqual([]);
  });
});

describe("OrderPage when the request fails", () => {
  it("shows We couldn't load your order with a Try again button", async () => {
    fakeOrderApi("fail");
    await renderOrderPage();

    const alert = await screen.findByRole("alert");

    expect(alert).toHaveTextContent("We couldn't load your order.");
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Order confirmation" })).toHaveClass(
      "sr-only",
    );
  });

  it("asks again on Try again and shows the order when it answers", async () => {
    const fetchMock = fakeOrderApi(["fail", "ok"]);
    const user = userEvent.setup({ delay: null });
    await renderOrderPage();
    await screen.findByRole("alert");

    await user.click(screen.getByRole("button", { name: "Try again" }));

    expect(
      await screen.findByRole("heading", { level: 1, name: "Uhu! Order confirmed" }),
    ).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("has no accessibility violation", async () => {
    fakeOrderApi("fail");
    const { container } = await renderOrderPage();
    await screen.findByRole("alert");

    expect(await accessibilityViolations(container)).toEqual([]);
  });
});
