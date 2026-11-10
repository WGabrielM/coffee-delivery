import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { accessibilityViolations } from "../../test/axe";
import {
  fakeCheckoutApi,
  postedOrders,
  renderCheckoutPage,
  sampleOrder,
  type OrderOutcome,
} from "../../test/checkout";
import { latte } from "../../test/coffees";
import { loadCart, saveCart } from "../cart/cart-storage";
import { AddressCard } from "./address-card/AddressCard";
import { CheckoutForm } from "./checkout-form/CheckoutForm";
import {
  CHECK_ORDER_MESSAGE,
  NO_LONGER_AVAILABLE_MESSAGE,
  TOO_MANY_ORDERS_MESSAGE,
  TRY_AGAIN_MESSAGE,
} from "./checkout-form/submit-errors";
import { OrderSummary } from "./order-summary/OrderSummary";
import { PaymentCard } from "./payment-card/PaymentCard";

afterEach(() => {
  vi.unstubAllGlobals();
});

// The three parts of the real page, inside the one form: the address, the payment, and the summary
// with the Confirm order button.
function Checkout() {
  return (
    <CheckoutForm>
      <AddressCard />
      <PaymentCard />
      <OrderSummary />
    </CheckoutForm>
  );
}

type User = ReturnType<typeof userEvent.setup>;

/** Every key of a JSON value, at any depth, so a test can check that no price field is sent. */
function allKeys(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(allKeys);
  if (typeof value !== "object" || value === null) return [];
  return Object.entries(value).flatMap(([key, inner]) => [key, ...allKeys(inner)]);
}

async function openCheckout(outcome?: OrderOutcome | OrderOutcome[]) {
  saveCart([{ coffeeId: latte.id, quantity: 2 }]);
  const fetchMock = fakeCheckoutApi(outcome === undefined ? {} : { orderOutcome: outcome });
  const user = userEvent.setup({ delay: null });
  const view = renderCheckoutPage(<Checkout />);
  await screen.findByRole("list");
  await screen.findByRole("radiogroup", { name: "Payment method" });
  return { ...view, fetchMock, user };
}

async function fillTheAddress(user: User) {
  await user.type(screen.getByRole("textbox", { name: "ZIP code" }), "90250440");
  await user.type(screen.getByRole("textbox", { name: "Street" }), "Rua João Daniel Martinelli");
  await user.type(screen.getByRole("textbox", { name: "Number" }), "102");
  await user.type(screen.getByRole("textbox", { name: "Neighborhood" }), "Farrapos");
  await user.type(screen.getByRole("textbox", { name: "City" }), "Porto Alegre");
  await user.type(screen.getByRole("textbox", { name: "State" }), "rs");
}

async function fillTheSample(user: User) {
  await fillTheAddress(user);
  await user.click(screen.getByRole("radio", { name: "Credit card" }));
}

const confirm = () => screen.getByRole("button", { name: "Confirm order" });

/** The `Idempotency-Key` header of each `POST /api/v1/orders`, in order. */
function sentKeys(fetchMock: Awaited<ReturnType<typeof openCheckout>>["fetchMock"]) {
  return fetchMock.mock.calls
    .filter(
      ([input, init]) => String(input).startsWith("/api/v1/orders") && init?.method === "POST",
    )
    .map(([, init]) => new Headers(init?.headers).get("Idempotency-Key"));
}

describe("Confirm order with an invalid form", () => {
  it("shows every error, moves the focus to the first invalid field, and sends no request", async () => {
    const { fetchMock, user } = await openCheckout();

    await user.click(confirm());

    expect(await screen.findByText("Enter a ZIP code like 12345-678")).toBeInTheDocument();
    expect(screen.getByText("Street is required")).toBeInTheDocument();
    expect(screen.getByText("Number is required")).toBeInTheDocument();
    expect(screen.getByText("Neighborhood is required")).toBeInTheDocument();
    expect(screen.getByText("City is required")).toBeInTheDocument();
    expect(screen.getByText("Enter the 2-letter state, like RS")).toBeInTheDocument();
    expect(screen.getByText("Choose a payment method")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "ZIP code" })).toHaveFocus();
    expect(postedOrders(fetchMock)).toHaveLength(0);
  });

  it("shows only the payment message and sends nothing when only the payment method is missing", async () => {
    const { fetchMock, user } = await openCheckout();
    await fillTheAddress(user);

    await user.click(confirm());

    expect(await screen.findByText("Choose a payment method")).toBeInTheDocument();
    expect(
      screen.queryByText(/is required|Enter a ZIP|Enter the 2-letter/),
    ).not.toBeInTheDocument();
    expect(postedOrders(fetchMock)).toHaveLength(0);
  });
});

describe("Confirm order with a valid form", () => {
  it("sends one POST with the cart lines as items, the address, and the payment, with no price", async () => {
    const { fetchMock, user } = await openCheckout();
    await fillTheSample(user);

    await user.click(confirm());

    await waitFor(() => expect(postedOrders(fetchMock)).toHaveLength(1));
    const body = postedOrders(fetchMock)[0]!;
    expect(body).toEqual({
      items: [{ coffeeId: latte.id, quantity: 2 }],
      address: {
        zipCode: "90250-440",
        street: "Rua João Daniel Martinelli",
        number: "102",
        complement: "",
        neighborhood: "Farrapos",
        city: "Porto Alegre",
        state: "RS",
      },
      paymentMethod: "credit_card",
    });
    expect(
      allKeys(body).filter((key) => /price|total|fee|cents/i.test(key.replace("coffeeId", ""))),
    ).toEqual([]);
  });

  it("builds the items from the cart, so a quantity changed in the summary is the one sent", async () => {
    const { fetchMock, user } = await openCheckout();
    await fillTheSample(user);
    await user.click(screen.getByRole("button", { name: "Increase quantity" }));

    await user.click(confirm());

    await waitFor(() => expect(postedOrders(fetchMock)).toHaveLength(1));
    expect(postedOrders(fetchMock)[0]?.items).toEqual([{ coffeeId: latte.id, quantity: 3 }]);
  });

  it("disables the button and marks it busy while the request runs, so a second click sends nothing", async () => {
    const { fetchMock, user } = await openCheckout({ kind: "pending" });
    await fillTheSample(user);
    expect(confirm()).not.toHaveAttribute("aria-busy");

    await user.click(confirm());

    await waitFor(() => expect(confirm()).toBeDisabled());
    expect(confirm()).toHaveAttribute("aria-busy", "true");
    await user.click(confirm());
    expect(postedOrders(fetchMock)).toHaveLength(1);
  });

  it("keeps the cart until the server has answered", async () => {
    const { user } = await openCheckout({ kind: "pending" });
    await fillTheSample(user);

    await user.click(confirm());
    await waitFor(() => expect(confirm()).toBeDisabled());

    expect(loadCart()).toEqual([{ coffeeId: latte.id, quantity: 2 }]);
  });
});

describe("the Idempotency-Key of the order", () => {
  it("is a UUID on the first submit", async () => {
    const { fetchMock, user } = await openCheckout();
    await fillTheSample(user);

    await user.click(confirm());
    await screen.findByText("The order page");

    expect(sentKeys(fetchMock)).toEqual([
      expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/),
    ]);
  });

  it("stays the same when the person tries again with the same order after a failure", async () => {
    const { fetchMock, user } = await openCheckout([
      { kind: "network-error" },
      { kind: "server-error" },
      { kind: "created" },
    ]);
    await fillTheSample(user);

    await user.click(confirm());
    await screen.findByRole("alert");
    await user.click(confirm());
    await waitFor(() => expect(sentKeys(fetchMock)).toHaveLength(2));
    await waitFor(() => expect(confirm()).toBeEnabled());
    await user.click(confirm());
    await screen.findByText("The order page");

    const keys = sentKeys(fetchMock);
    expect(keys).toHaveLength(3);
    expect(new Set(keys).size).toBe(1);
  });

  it("changes when the person changes the order before trying again", async () => {
    const { fetchMock, user } = await openCheckout([{ kind: "server-error" }, { kind: "created" }]);
    await fillTheSample(user);
    await user.click(confirm());
    await screen.findByRole("alert");

    await user.click(screen.getByRole("radio", { name: "Cash" }));
    await user.click(confirm());
    await screen.findByText("The order page");

    const keys = sentKeys(fetchMock);
    expect(keys).toHaveLength(2);
    expect(keys[0]).not.toBe(keys[1]);
  });
});

describe("when the server confirms the order (201)", () => {
  it("goes to /orders/<id>, replacing the checkout in the history", async () => {
    const { router, user } = await openCheckout();
    await fillTheSample(user);

    await user.click(confirm());

    expect(await screen.findByText("The order page")).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(`/orders/${sampleOrder.id}`);
    expect(router.state.historyAction).toBe("REPLACE");
  });

  it("clears the cart", async () => {
    const { user } = await openCheckout();
    await fillTheSample(user);

    await user.click(confirm());

    await screen.findByText("The order page");
    await waitFor(() => expect(loadCart()).toEqual([]));
  });

  it("does not show the empty cart for a moment on the way out", async () => {
    const { user } = await openCheckout();
    await fillTheSample(user);

    await user.click(confirm());

    await screen.findByText("The order page");
    expect(screen.queryByText("Your cart is empty")).not.toBeInTheDocument();
  });
});

describe("when the server answers 400 with fields", () => {
  it("sets the errors of the address fields and of the payment, keeps the cart and the values, and shows no alert", async () => {
    const { user } = await openCheckout({
      kind: "validation",
      fields: {
        "address.zipCode": "Enter a ZIP code like 12345-678.",
        "address.city": "Enter the city.",
        paymentMethod: "Choose a payment method.",
      },
    });
    await fillTheSample(user);

    await user.click(confirm());

    expect(await screen.findByText("Enter a ZIP code like 12345-678.")).toBeInTheDocument();
    expect(screen.getByText("Enter the city.")).toBeInTheDocument();
    expect(screen.getByText("Choose a payment method.")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "ZIP code" })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(screen.getByRole("textbox", { name: "ZIP code" })).toHaveFocus();
    expect(screen.getByRole("radiogroup", { name: "Payment method" })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Street" })).toHaveValue(
      "Rua João Daniel Martinelli",
    );
    expect(loadCart()).toHaveLength(1);
    expect(confirm()).toBeEnabled();
  });

  it("shows the alert Please review your order and try again for any other key", async () => {
    const { user } = await openCheckout({
      kind: "validation",
      fields: { items: "Add at least one coffee." },
    });
    await fillTheSample(user);

    await user.click(confirm());

    expect(await screen.findByRole("alert")).toHaveTextContent(CHECK_ORDER_MESSAGE);
    expect(loadCart()).toHaveLength(1);
    expect(confirm()).toBeEnabled();
  });

  it("lets the person fix a field the server refused and confirm again", async () => {
    const { fetchMock, user } = await openCheckout([
      { kind: "validation", fields: { "address.zipCode": "Enter a ZIP code like 12345-678." } },
      { kind: "created" },
    ]);
    await fillTheSample(user);
    await user.click(confirm());
    await screen.findByText("Enter a ZIP code like 12345-678.");

    await user.click(confirm());

    expect(await screen.findByText("The order page")).toBeInTheDocument();
    expect(postedOrders(fetchMock)).toHaveLength(2);
  });
});

describe("when the proxy answers 429", () => {
  it("shows the too many orders alert, keeps the cart and the values, and enables the button", async () => {
    const { fetchMock, user } = await openCheckout({ kind: "too-many" });
    await fillTheSample(user);

    await user.click(confirm());

    expect(await screen.findByRole("alert")).toHaveTextContent(TOO_MANY_ORDERS_MESSAGE);
    expect(loadCart()).toHaveLength(1);
    expect(confirm()).toBeEnabled();
    expect(screen.getByRole("textbox", { name: "Street" })).toHaveValue(
      "Rua João Daniel Martinelli",
    );
    expect(postedOrders(fetchMock)).toHaveLength(1);
  });

  it("goes through when the person waits and confirms again", async () => {
    const { user } = await openCheckout([{ kind: "too-many" }, { kind: "created" }]);
    await fillTheSample(user);
    await user.click(confirm());
    await screen.findByRole("alert");

    await user.click(confirm());

    expect(await screen.findByText("The order page")).toBeInTheDocument();
  });
});

describe("when the server answers 422", () => {
  it("shows the alert about coffees that are no longer available and keeps the cart", async () => {
    const { user } = await openCheckout({ kind: "unprocessable" });
    await fillTheSample(user);

    await user.click(confirm());

    expect(await screen.findByRole("alert")).toHaveTextContent(NO_LONGER_AVAILABLE_MESSAGE);
    expect(loadCart()).toHaveLength(1);
    expect(confirm()).toBeEnabled();
  });
});

describe.each([
  ["a 500", { kind: "server-error" } as const],
  ["a network error", { kind: "network-error" } as const],
])("when the request fails with %s", (_name, outcome) => {
  it("shows the alert We couldn't place your order, enables the button again, and keeps the values", async () => {
    const { fetchMock, user } = await openCheckout(outcome);
    await fillTheSample(user);

    await user.click(confirm());

    expect(await screen.findByRole("alert")).toHaveTextContent(TRY_AGAIN_MESSAGE);
    expect(confirm()).toBeEnabled();
    expect(confirm()).not.toHaveAttribute("aria-busy");
    expect(screen.getByRole("textbox", { name: "Street" })).toHaveValue(
      "Rua João Daniel Martinelli",
    );
    expect(screen.getByRole("radio", { name: "Credit card" })).toBeChecked();
    expect(loadCart()).toHaveLength(1);
    // No automatic retry: one request, and a second only when the person asks.
    expect(postedOrders(fetchMock)).toHaveLength(1);
  });

  it("goes through when the person confirms again and the server is back", async () => {
    const { user } = await openCheckout([outcome, { kind: "created" }]);
    await fillTheSample(user);
    await user.click(confirm());
    await screen.findByRole("alert");

    await user.click(confirm());

    expect(await screen.findByText("The order page")).toBeInTheDocument();
  });
});

describe("the alert", () => {
  it("moves the focus to the alert, so a keyboard user is not left on a button that went away", async () => {
    const { user } = await openCheckout({ kind: "server-error" });
    await fillTheSample(user);

    await user.click(confirm());

    expect(await screen.findByRole("alert")).toHaveFocus();
  });

  it("goes away when the person confirms again", async () => {
    const { user } = await openCheckout([{ kind: "server-error" }, { kind: "pending" }]);
    await fillTheSample(user);
    await user.click(confirm());
    await screen.findByRole("alert");

    await user.click(confirm());

    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
  });

  it("sits above the Confirm order button, inside the summary card", async () => {
    const { user } = await openCheckout({ kind: "server-error" });
    await fillTheSample(user);

    await user.click(confirm());
    const alert = await screen.findByRole("alert");

    expect(
      alert.compareDocumentPosition(confirm()) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(alert.closest("section")).toBe(confirm().closest("section"));
  });

  it("has no accessibility violation", async () => {
    const { container, user } = await openCheckout({ kind: "server-error" });
    await fillTheSample(user);
    await user.click(confirm());
    await screen.findByRole("alert");

    expect(await accessibilityViolations(container)).toEqual([]);
  });
});
