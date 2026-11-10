import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { accessibilityViolations } from "../../../test/axe";
import { fakeCheckoutApi, renderCheckoutRoute } from "../../../test/checkout";
import { latte } from "../../../test/coffees";

afterEach(() => {
  vi.unstubAllGlobals();
});

const exampleCart = [{ coffeeId: latte.id, quantity: 2 }];

// The gate is tested where the person meets it: on the checkout route, inside the real layout.
describe("CartGate with coffees in the cart", () => {
  it("shows the checkout and no empty-cart message", async () => {
    fakeCheckoutApi();
    await renderCheckoutRoute(exampleCart);

    expect(screen.queryByText("Your cart is empty")).not.toBeInTheDocument();
    expect(await screen.findByRole("list")).toBeInTheDocument();
  });
});

describe("CartGate with an empty cart", () => {
  it("says Your cart is empty and links to the home page with Browse coffees", async () => {
    const fetchMock = fakeCheckoutApi();
    await renderCheckoutRoute([]);

    expect(
      screen.getByRole("heading", { level: 2, name: "Your cart is empty" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Browse coffees" })).toHaveAttribute("href", "/");
    // Nothing to price, so nothing is asked of the server.
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows neither the form column nor the summary", async () => {
    fakeCheckoutApi();
    const { container } = await renderCheckoutRoute([]);

    expect(container.querySelector("form")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Complete your order" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Selected coffees" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Confirm order" })).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("keeps the level 1 and shows the empty badge on the navbar", async () => {
    fakeCheckoutApi();
    await renderCheckoutRoute([]);

    expect(screen.getByRole("heading", { level: 1, name: "Checkout" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Cart, empty" })).toBeInTheDocument();
  });

  it("does not move the focus when the person arrives with an empty cart", async () => {
    fakeCheckoutApi();
    await renderCheckoutRoute([]);

    expect(screen.getByRole("heading", { name: "Your cart is empty" })).not.toHaveFocus();
  });

  it("shows the empty state, with the focus on its heading, when the last coffee is removed", async () => {
    fakeCheckoutApi();
    const user = userEvent.setup({ delay: null });
    await renderCheckoutRoute([{ coffeeId: latte.id, quantity: 1 }]);
    await screen.findByRole("list");

    await user.click(screen.getByRole("button", { name: "Remove Latte" }));

    const heading = screen.getByRole("heading", { level: 2, name: "Your cart is empty" });
    expect(heading).toHaveFocus();
    expect(screen.getByRole("link", { name: "Browse coffees" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Selected coffees" })).not.toBeInTheDocument();
  });

  it("shows the empty state when the catalog no longer has any coffee of the cart", async () => {
    fakeCheckoutApi();
    await renderCheckoutRoute([{ coffeeId: "a-coffee-that-was-dropped", quantity: 2 }]);

    expect(await screen.findByRole("heading", { name: "Your cart is empty" })).toBeInTheDocument();
  });

  it("has no accessibility violation", async () => {
    fakeCheckoutApi();
    const { container } = await renderCheckoutRoute([]);

    expect(await accessibilityViolations(container)).toEqual([]);
  });
});
