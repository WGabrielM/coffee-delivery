import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { CartLine } from "../features/cart/cart-reducer";
import { accessibilityViolations } from "../test/axe";
import { fakeCheckoutApi, renderCheckoutRoute } from "../test/checkout";
import { latte, traditionalEspresso } from "../test/coffees";

afterEach(() => {
  vi.unstubAllGlobals();
});

const exampleCart: CartLine[] = [
  { coffeeId: latte.id, quantity: 2 },
  { coffeeId: traditionalEspresso.id, quantity: 1 },
];

describe("CheckoutPage with coffees in the cart", () => {
  it("has a level 1 Checkout for screen readers, then two level 2 headings", async () => {
    fakeCheckoutApi();
    await renderCheckoutRoute(exampleCart);

    const h1 = screen.getByRole("heading", { level: 1, name: "Checkout" });

    expect(h1).toHaveClass("sr-only");
    expect(
      screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent),
    ).toEqual(["Complete your order", "Selected coffees"]);
    await screen.findByRole("list");
  });

  it("has two columns: 640 px for the form (left) and 448 px for the summary, 32 px apart", async () => {
    fakeCheckoutApi();
    await renderCheckoutRoute(exampleCart);

    const left = screen.getByRole("region", { name: "Complete your order" });
    const right = screen.getByRole("region", { name: "Selected coffees" });

    // One column below 1024 px; from there 640 to 448 (the design), 32 px apart.
    expect(left.parentElement).toHaveClass(
      "grid",
      "grid-cols-1",
      "lg:grid-cols-[minmax(0,640fr)_minmax(0,448fr)]",
      "gap-8",
    );
    expect(left.parentElement).toBe(right.parentElement);
    expect(left.nextElementSibling).toBe(right);
    await screen.findByRole("list");
  });

  it("draws the heading Complete your order in Title XS, with the address card under it", async () => {
    fakeCheckoutApi();
    await renderCheckoutRoute(exampleCart);

    const heading = screen.getByRole("heading", { level: 2, name: "Complete your order" });

    expect(heading).toHaveClass("type-title-xs", "text-subtitle");
    const left = screen.getByRole("region", { name: "Complete your order" });
    expect(within(left).getByRole("group", { name: "Delivery address" })).toBeInTheDocument();
    expect(within(left).getAllByRole("textbox")).toHaveLength(7);
    await screen.findByRole("list");
  });

  it("puts the payment card under the address card, 12 px apart, with three options", async () => {
    fakeCheckoutApi();
    await renderCheckoutRoute(exampleCart);

    const left = screen.getByRole("region", { name: "Complete your order" });
    const address = within(left).getByRole("group", { name: "Delivery address" });
    const payment = within(left).getByRole("group", { name: "Payment" });

    expect(
      address.compareDocumentPosition(payment) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(address.parentElement).toBe(payment.parentElement);
    expect(address.parentElement).toHaveClass("flex", "flex-col", "gap-3");
    expect(await within(payment).findAllByRole("radio")).toHaveLength(3);
    await screen.findByRole("list");
  });

  it("puts both columns in one form, so the summary can submit the address (spec 025)", async () => {
    fakeCheckoutApi();
    const { container } = await renderCheckoutRoute(exampleCart);
    await screen.findByRole("list");

    const forms = container.querySelectorAll("form");

    expect(forms).toHaveLength(1);
    expect(forms[0]).toContainElement(screen.getByRole("textbox", { name: "ZIP code" }));
    expect(forms[0]).toContainElement(screen.getByRole("button", { name: "Confirm order" }));
  });

  it("changes the navbar badge with the counter and the Remove button of the summary", async () => {
    fakeCheckoutApi();
    const user = userEvent.setup({ delay: null });
    await renderCheckoutRoute(exampleCart);
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
    const { container } = await renderCheckoutRoute(exampleCart);
    await screen.findByRole("list");

    expect(await accessibilityViolations(container)).toEqual([]);
  });
});
