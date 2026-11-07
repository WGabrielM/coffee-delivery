import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { accessibilityViolations } from "../../../test/axe";
import {
  catalogRequests,
  checkoutConfig,
  configRequests,
  fakeCheckoutApi,
} from "../../../test/checkout";
import { cuban, latte, renderWithQuery, traditionalEspresso } from "../../../test/coffees";
import { useCart } from "../../cart/cart-context";
import type { CartLine } from "../../cart/cart-reducer";
import { saveCart } from "../../cart/cart-storage";
import { OrderSummary } from "./OrderSummary";

afterEach(() => {
  vi.unstubAllGlobals();
});

// Shows what the cart holds, so a test reads the cart through the screen and not through the hook.
function CartProbe() {
  const { lines, totalQuantity } = useCart();
  return (
    <>
      <p>{`In the cart: ${totalQuantity}`}</p>
      <p data-testid="cart-lines">{JSON.stringify(lines)}</p>
    </>
  );
}

function SummaryAndProbe() {
  return (
    <>
      <OrderSummary />
      <CartProbe />
    </>
  );
}

const exampleCart: CartLine[] = [
  { coffeeId: latte.id, quantity: 2 },
  { coffeeId: traditionalEspresso.id, quantity: 1 },
];

function renderSummary(lines: CartLine[] = exampleCart) {
  saveCart(lines);
  return renderWithQuery(<SummaryAndProbe />);
}

/** The text of the value drawn next to a label of the totals ("Items total", "Delivery", "Total"). */
function valueOf(label: string): string | null | undefined {
  return screen.getByText(label, { exact: true }).nextElementSibling?.textContent;
}

function rowOf(name: string): HTMLElement {
  return screen.getByRole("listitem", { name });
}

describe("OrderSummary with data", () => {
  it("is a section named by its heading, Selected coffees, a level 2 in Title XS", async () => {
    fakeCheckoutApi();
    renderSummary();

    const heading = screen.getByRole("heading", { level: 2, name: "Selected coffees" });

    expect(heading).toHaveClass("type-title-xs", "text-subtitle");
    expect(screen.getByRole("region", { name: "Selected coffees" })).toBeInTheDocument();
    await screen.findByRole("list");
  });

  it("lists Latte × 2 and Traditional Espresso × 1 with their line prices 19.80 and 9.90", async () => {
    fakeCheckoutApi();
    renderSummary();

    await screen.findByRole("list");

    expect(within(rowOf("Latte")).getByText("$19.80")).toBeInTheDocument();
    expect(within(rowOf("Traditional Espresso")).getByText("$9.90")).toBeInTheDocument();
    expect(within(rowOf("Latte")).getByRole("heading", { level: 3 })).toHaveTextContent("Latte");
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("keeps the order of the cart, not the order of the catalog", async () => {
    fakeCheckoutApi();
    renderSummary();

    const items = await screen.findAllByRole("listitem");

    expect(items.map((item) => within(item).getByRole("heading").textContent)).toEqual([
      "Latte",
      "Traditional Espresso",
    ]);
  });

  it("shows Items total $29.70, Delivery $3.50, and Total $33.20", async () => {
    fakeCheckoutApi();
    renderSummary();

    await screen.findByRole("list");

    expect(valueOf("Items total")).toBe("$29.70");
    expect(valueOf("Delivery")).toBe("$3.50");
    expect(valueOf("Total")).toBe("$33.20");
  });

  it("draws the Total in Roboto Bold 20, as an output so a change of the total is heard", async () => {
    fakeCheckoutApi();
    renderSummary();

    await screen.findByRole("list");
    const label = screen.getByText("Total", { exact: true });
    const amount = screen.getByText("$33.20");

    expect(label).toHaveClass("type-text-bold-l", "text-subtitle");
    expect(amount).toHaveClass("type-text-bold-l", "text-subtitle");
    expect(amount.tagName).toBe("OUTPUT");
  });

  it("takes the delivery fee from the checkout config, not from the code", async () => {
    fakeCheckoutApi({ config: { ...checkoutConfig, deliveryFeeInCents: 500 } });
    renderSummary();

    await screen.findByRole("list");

    expect(valueOf("Delivery")).toBe("$5.00");
    expect(valueOf("Total")).toBe("$34.70");
  });

  it("shows the photo of each coffee at 64 px, round, with the name as alt text", async () => {
    fakeCheckoutApi();
    renderSummary();

    await screen.findByRole("list");
    const photo = within(rowOf("Latte")).getByRole("img", { name: "Latte" });

    expect(photo).toHaveAttribute("width", "64");
    expect(photo).toHaveAttribute("height", "64");
    expect(photo).toHaveClass("size-16", "rounded-round");
  });

  it("gives each row a compact counter at its quantity", async () => {
    fakeCheckoutApi();
    renderSummary();

    await screen.findByRole("list");
    const counter = within(rowOf("Latte")).getByRole("group", { name: "Quantity of Latte" });

    expect(within(counter).getByText("2")).toBeInTheDocument();
    expect(counter).toHaveClass("h-8", "w-18");
  });

  it("updates the line price, the totals, and the cart when the counter changes", async () => {
    fakeCheckoutApi();
    const user = userEvent.setup({ delay: null });
    renderSummary();
    await screen.findByRole("list");

    await user.click(within(rowOf("Latte")).getByRole("button", { name: "Increase quantity" }));

    expect(within(rowOf("Latte")).getByText("$29.70")).toBeInTheDocument();
    expect(valueOf("Items total")).toBe("$39.60");
    expect(valueOf("Total")).toBe("$43.10");
    expect(screen.getByText("In the cart: 4")).toBeInTheDocument();

    await user.click(within(rowOf("Latte")).getByRole("button", { name: "Decrease quantity" }));
    await user.click(within(rowOf("Latte")).getByRole("button", { name: "Decrease quantity" }));

    expect(within(rowOf("Latte")).getByText("$9.90", { selector: "p" })).toBeInTheDocument();
    expect(valueOf("Total")).toBe("$23.30");
    expect(screen.getByText("In the cart: 2")).toBeInTheDocument();
  });

  it("has a Remove button per row, named for its coffee, with the trash icon", async () => {
    fakeCheckoutApi();
    renderSummary();

    await screen.findByRole("list");
    const remove = within(rowOf("Latte")).getByRole("button", { name: "Remove Latte" });

    expect(remove).toHaveTextContent("Remove");
    expect(remove).toHaveClass("h-8", "bg-button");
    expect(remove.querySelector("svg")).toBeInTheDocument();
  });

  it("removes the row and updates the totals and the cart", async () => {
    fakeCheckoutApi();
    const user = userEvent.setup({ delay: null });
    renderSummary();
    await screen.findByRole("list");

    await user.click(screen.getByRole("button", { name: "Remove Latte" }));

    expect(screen.queryByRole("listitem", { name: "Latte" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    expect(valueOf("Items total")).toBe("$9.90");
    expect(valueOf("Total")).toBe("$13.40");
    expect(screen.getByText("In the cart: 1")).toBeInTheDocument();
    expect(screen.getByTestId("cart-lines")).toHaveTextContent(traditionalEspresso.id);
    expect(screen.getByTestId("cart-lines")).not.toHaveTextContent(latte.id);
  });

  it("moves the focus to the heading when a row is removed, so it is not lost", async () => {
    fakeCheckoutApi();
    const user = userEvent.setup({ delay: null });
    renderSummary();
    await screen.findByRole("list");

    await user.click(screen.getByRole("button", { name: "Remove Latte" }));

    expect(screen.getByRole("heading", { level: 2, name: "Selected coffees" })).toHaveFocus();
  });

  it("removes from the cart the lines whose coffee is not in the catalog", async () => {
    fakeCheckoutApi();
    renderSummary([
      { coffeeId: "a-coffee-that-was-dropped", quantity: 4 },
      { coffeeId: cuban.id, quantity: 1 },
    ]);

    await screen.findByRole("list");

    expect(await screen.findByText("In the cart: 1")).toBeInTheDocument();
    expect(screen.getByTestId("cart-lines")).not.toHaveTextContent("a-coffee-that-was-dropped");
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    expect(valueOf("Items total")).toBe("$12.50");
  });

  it("does not touch the cart while the catalog has not loaded", () => {
    fakeCheckoutApi({ catalog: "pending" });
    renderSummary([{ coffeeId: "unknown-until-loaded", quantity: 2 }]);

    expect(screen.getByText("In the cart: 2")).toBeInTheDocument();
  });

  it("has the Confirm order button, full width, enabled, that sends nothing yet", async () => {
    const fetchMock = fakeCheckoutApi();
    const user = userEvent.setup({ delay: null });
    renderSummary();
    await screen.findByRole("list");
    const requests = fetchMock.mock.calls.length;

    const confirm = screen.getByRole("button", { name: "Confirm order" });
    await user.click(confirm);

    expect(confirm).toBeEnabled();
    expect(confirm).toHaveClass("w-full", "bg-yellow");
    expect(fetchMock.mock.calls).toHaveLength(requests);
  });

  it("has the card shape of the design: the 6/44/6/44 corners, 40 px padding, the card color", async () => {
    fakeCheckoutApi();
    renderSummary();
    await screen.findByRole("list");

    const card = screen.getByRole("region", { name: "Selected coffees" }).lastElementChild;

    expect(card).toHaveClass("rounded-summary-card", "bg-card", "p-10");
  });

  it("has no accessibility violation", async () => {
    fakeCheckoutApi();
    const { container } = renderSummary();
    await screen.findByRole("list");

    expect(await accessibilityViolations(container)).toEqual([]);
  });
});

describe("OrderSummary while it loads", () => {
  it("shows Loading your order… and a Confirm order button that is disabled", () => {
    fakeCheckoutApi({ catalog: "pending", configMode: "pending" });
    renderSummary();

    expect(screen.getByText("Loading your order…")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirm order" })).toBeDisabled();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Selected coffees" })).toHaveAttribute(
      "aria-busy",
      "true",
    );
  });

  it("keeps loading while only the config is missing", async () => {
    fakeCheckoutApi({ configMode: "pending" });
    renderSummary();

    expect(await screen.findByText("Loading your order…")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirm order" })).toBeDisabled();
    expect(screen.queryByText("Items total")).not.toBeInTheDocument();
  });

  it("keeps loading while only the catalog is missing", async () => {
    fakeCheckoutApi({ catalog: "pending" });
    renderSummary();

    expect(await screen.findByText("Loading your order…")).toBeInTheDocument();
    expect(screen.queryByText("Items total")).not.toBeInTheDocument();
  });
});

describe("OrderSummary when a request fails", () => {
  it("shows an alert with Try again when the catalog fails, and the button is disabled", async () => {
    fakeCheckoutApi({ catalog: "fail" });
    renderSummary();

    const alert = await screen.findByRole("alert");

    expect(alert).toHaveTextContent("We couldn't load your order.");
    expect(within(alert).getByRole("button", { name: "Try again" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirm order" })).toBeDisabled();
    expect(screen.queryByText("Items total")).not.toBeInTheDocument();
  });

  it("shows the same alert when the config fails", async () => {
    fakeCheckoutApi({ configMode: "fail" });
    renderSummary();

    expect(await screen.findByRole("alert")).toHaveTextContent("We couldn't load your order.");
  });

  it("asks again only for what failed, and shows the summary when it answers", async () => {
    const fetchMock = fakeCheckoutApi({ configMode: ["fail", "ok"] });
    const user = userEvent.setup({ delay: null });
    renderSummary();
    await screen.findByRole("alert");
    const catalogBefore = catalogRequests(fetchMock);

    await user.click(screen.getByRole("button", { name: "Try again" }));

    expect(await screen.findByRole("list")).toBeInTheDocument();
    expect(valueOf("Total")).toBe("$33.20");
    expect(configRequests(fetchMock)).toBe(2);
    expect(catalogRequests(fetchMock)).toBe(catalogBefore);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("recovers the same way when the catalog failed first", async () => {
    fakeCheckoutApi({ catalog: ["fail", "ok"] });
    const user = userEvent.setup({ delay: null });
    renderSummary();
    await screen.findByRole("alert");

    await user.click(screen.getByRole("button", { name: "Try again" }));

    expect(await screen.findByRole("list")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirm order" })).toBeEnabled();
  });

  it("does not remove any line from the cart when the catalog fails", async () => {
    fakeCheckoutApi({ catalog: "fail" });
    renderSummary();

    await screen.findByRole("alert");

    expect(screen.getByText("In the cart: 3")).toBeInTheDocument();
  });

  it("has no accessibility violation in the error state", async () => {
    fakeCheckoutApi({ catalog: "fail" });
    const { container } = renderSummary();
    await screen.findByRole("alert");

    expect(await accessibilityViolations(container)).toEqual([]);
  });
});

describe("OrderSummary when no line can be priced", () => {
  it("disables Confirm order when every line is gone from the catalog", async () => {
    fakeCheckoutApi();
    renderSummary([{ coffeeId: "gone", quantity: 1 }]);

    expect(await screen.findByText("In the cart: 0")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirm order" })).toBeDisabled();
  });
});
