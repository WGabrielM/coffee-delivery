import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClientProvider } from "@tanstack/react-query";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import { routes } from "../app/routes";
import { CartProvider } from "../features/cart/cart-context";
import type { CartLine } from "../features/cart/cart-reducer";
import { saveCart } from "../features/cart/cart-storage";
import { accessibilityViolations } from "../test/axe";
import { fakeCheckoutApi } from "../test/checkout";
import { createTestQueryClient, latte, traditionalEspresso } from "../test/coffees";

afterEach(() => {
  vi.unstubAllGlobals();
});

const exampleCart: CartLine[] = [
  { coffeeId: latte.id, quantity: 2 },
  { coffeeId: traditionalEspresso.id, quantity: 1 },
];

// The page renders inside the real layout, so the navbar badge can be read.
function renderCheckout(lines: CartLine[]) {
  saveCart(lines);
  const router = createMemoryRouter(routes, { initialEntries: ["/checkout"] });
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <CartProvider>
        <RouterProvider router={router} />
      </CartProvider>
    </QueryClientProvider>,
  );
}

describe("CheckoutPage with coffees in the cart", () => {
  it("has a level 1 Checkout for screen readers, then two level 2 headings", async () => {
    fakeCheckoutApi();
    renderCheckout(exampleCart);

    const h1 = screen.getByRole("heading", { level: 1, name: "Checkout" });

    expect(h1).toHaveClass("sr-only");
    expect(
      screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent),
    ).toEqual(["Complete your order", "Selected coffees"]);
    await screen.findByRole("list");
  });

  it("has two columns: 640 px for the form (left) and 448 px for the summary, 32 px apart", async () => {
    fakeCheckoutApi();
    renderCheckout(exampleCart);

    const left = screen.getByRole("region", { name: "Complete your order" });
    const right = screen.getByRole("region", { name: "Selected coffees" });

    expect(left.parentElement).toHaveClass("grid", "grid-cols-[640px_448px]", "gap-x-8");
    expect(left.parentElement).toBe(right.parentElement);
    expect(left.nextElementSibling).toBe(right);
    await screen.findByRole("list");
  });

  it("draws the heading Complete your order in Title XS, with the address card under it", async () => {
    fakeCheckoutApi();
    renderCheckout(exampleCart);

    const heading = screen.getByRole("heading", { level: 2, name: "Complete your order" });

    expect(heading).toHaveClass("type-title-xs", "text-subtitle");
    const left = screen.getByRole("region", { name: "Complete your order" });
    expect(within(left).getByRole("group", { name: "Delivery address" })).toBeInTheDocument();
    expect(within(left).getAllByRole("textbox")).toHaveLength(7);
    await screen.findByRole("list");
  });

  it("puts both columns in one form, so the summary can submit the address (spec 025)", async () => {
    fakeCheckoutApi();
    const { container } = renderCheckout(exampleCart);
    await screen.findByRole("list");

    const forms = container.querySelectorAll("form");

    expect(forms).toHaveLength(1);
    expect(forms[0]).toContainElement(screen.getByRole("textbox", { name: "ZIP code" }));
    expect(forms[0]).toContainElement(screen.getByRole("button", { name: "Confirm order" }));
  });

  it("shows no empty-cart message", async () => {
    fakeCheckoutApi();
    renderCheckout(exampleCart);

    expect(screen.queryByText("Your cart is empty")).not.toBeInTheDocument();
    await screen.findByRole("list");
  });

  it("changes the navbar badge with the counter and the Remove button of the summary", async () => {
    fakeCheckoutApi();
    const user = userEvent.setup({ delay: null });
    renderCheckout(exampleCart);
    await screen.findByRole("list");
    expect(screen.getByRole("link", { name: "Cart, 3 items" })).toHaveTextContent("3");

    await user.click(
      within(screen.getByRole("listitem", { name: "Latte" })).getByRole("button", {
        name: "Increase quantity",
      }),
    );
    expect(screen.getByRole("link", { name: "Cart, 4 items" })).toHaveTextContent("4");

    await user.click(screen.getByRole("button", { name: "Remove Latte" }));
    expect(screen.getByRole("link", { name: "Cart, 1 item" })).toHaveTextContent("1");
  });

  it("has no accessibility violation", async () => {
    fakeCheckoutApi();
    const { container } = renderCheckout(exampleCart);
    await screen.findByRole("list");

    expect(await accessibilityViolations(container)).toEqual([]);
  });
});

describe("CheckoutPage with an empty cart", () => {
  it("says Your cart is empty and links to the home page with Browse coffees", () => {
    const fetchMock = fakeCheckoutApi();
    renderCheckout([]);

    expect(
      screen.getByRole("heading", { level: 2, name: "Your cart is empty" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Browse coffees" })).toHaveAttribute("href", "/");
    // Nothing to price, so nothing is asked of the server.
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows neither the form column nor the summary", () => {
    fakeCheckoutApi();
    const { container } = renderCheckout([]);

    expect(container.querySelector("form")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Complete your order" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Selected coffees" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Confirm order" })).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("keeps the level 1 and shows the empty badge on the navbar", () => {
    fakeCheckoutApi();
    renderCheckout([]);

    expect(screen.getByRole("heading", { level: 1, name: "Checkout" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Cart, empty" })).toBeInTheDocument();
  });

  it("does not move the focus when the person arrives with an empty cart", () => {
    fakeCheckoutApi();
    renderCheckout([]);

    expect(screen.getByRole("heading", { name: "Your cart is empty" })).not.toHaveFocus();
  });

  it("shows the empty state, with the focus on its heading, when the last coffee is removed", async () => {
    fakeCheckoutApi();
    const user = userEvent.setup({ delay: null });
    renderCheckout([{ coffeeId: latte.id, quantity: 1 }]);
    await screen.findByRole("list");

    await user.click(screen.getByRole("button", { name: "Remove Latte" }));

    const heading = screen.getByRole("heading", { level: 2, name: "Your cart is empty" });
    expect(heading).toHaveFocus();
    expect(screen.getByRole("link", { name: "Browse coffees" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Selected coffees" })).not.toBeInTheDocument();
  });

  it("shows the empty state when the catalog no longer has any coffee of the cart", async () => {
    fakeCheckoutApi();
    renderCheckout([{ coffeeId: "a-coffee-that-was-dropped", quantity: 2 }]);

    expect(await screen.findByRole("heading", { name: "Your cart is empty" })).toBeInTheDocument();
  });

  it("has no accessibility violation", async () => {
    fakeCheckoutApi();
    const { container } = renderCheckout([]);

    expect(await accessibilityViolations(container)).toEqual([]);
  });
});
