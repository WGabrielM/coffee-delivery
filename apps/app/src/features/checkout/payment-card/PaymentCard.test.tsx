import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useWatch } from "react-hook-form";
import { afterEach, describe, expect, it, vi } from "vitest";

import { accessibilityViolations } from "../../../test/axe";
import {
  catalogRequests,
  checkoutConfig,
  configRequests,
  fakeCheckoutApi,
  renderCheckoutPage,
} from "../../../test/checkout";
import { CheckoutForm } from "../checkout-form/CheckoutForm";
import type { CheckoutFormValues } from "../checkout-form/checkout-form-schema";
import { PaymentCard } from "./PaymentCard";

afterEach(() => {
  vi.unstubAllGlobals();
});

// Shows the value the form holds, so a test reads it through the screen.
function FormValue() {
  const value = useWatch<CheckoutFormValues, "paymentMethod">({ name: "paymentMethod" });
  return <p>{`Form value: ${value ?? "none"}`}</p>;
}

function renderCard() {
  return renderCheckoutPage(
    <CheckoutForm>
      <PaymentCard />
      <FormValue />
      <button type="submit">Send</button>
    </CheckoutForm>,
  );
}

const group = () => screen.findByRole("radiogroup", { name: "Payment method" });

describe("PaymentCard with the config", () => {
  it("is a fieldset named Payment, with a level 3 heading, a purple dollar icon, and the line", async () => {
    fakeCheckoutApi();
    renderCard();
    await group();

    const card = screen.getByRole("group", { name: "Payment" });

    expect(within(card).getByRole("heading", { level: 3, name: "Payment" })).toHaveClass(
      "type-text-regular-m",
      "text-subtitle",
    );
    expect(
      within(card).getByText("Payment is made on delivery. Choose the way you want to pay"),
    ).toBeInTheDocument();
    expect(card).toHaveClass("bg-card", "rounded-button", "p-10");
    expect(card.querySelector("svg")?.parentElement).toHaveClass("text-purple");
  });

  it("shows one option per method of the config, in its order, with no option selected", async () => {
    fakeCheckoutApi({
      config: { ...checkoutConfig, paymentMethods: ["cash", "credit_card", "debit_card"] },
    });
    renderCard();

    const radios = within(await group()).getAllByRole("radio");

    expect(radios.map((radio) => (radio as HTMLInputElement).value)).toEqual([
      "cash",
      "credit_card",
      "debit_card",
    ]);
    for (const radio of radios) expect(radio).not.toBeChecked();
  });

  it("labels the options Credit card, Debit card, and Cash", async () => {
    fakeCheckoutApi();
    renderCard();
    await group();

    expect(screen.getByRole("radio", { name: "Credit card" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Debit card" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Cash" })).toBeInTheDocument();
  });

  it("ignores a method the app does not know and shows the others", async () => {
    fakeCheckoutApi({
      config: { ...checkoutConfig, paymentMethods: ["credit_card", "crypto", "cash"] },
    });
    renderCard();

    expect(within(await group()).getAllByRole("radio")).toHaveLength(2);
    expect(screen.queryByRole("radio", { name: /crypto/i })).not.toBeInTheDocument();
  });

  it("selects an option on a click and unselects the previous one", async () => {
    fakeCheckoutApi();
    const user = userEvent.setup({ delay: null });
    renderCard();
    await group();

    await user.click(screen.getByRole("radio", { name: "Credit card" }));
    expect(screen.getByRole("radio", { name: "Credit card" })).toBeChecked();

    await user.click(screen.getByRole("radio", { name: "Cash" }));

    expect(screen.getByRole("radio", { name: "Cash" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Credit card" })).not.toBeChecked();
  });

  it("selects with Space on the focused option", async () => {
    fakeCheckoutApi();
    const user = userEvent.setup({ delay: null });
    renderCard();
    await group();

    await user.tab();
    await user.keyboard(" ");

    expect(screen.getByRole("radio", { name: "Credit card" })).toBeChecked();
  });

  it("moves the selection with the arrow keys once one is selected", async () => {
    fakeCheckoutApi();
    const user = userEvent.setup({ delay: null });
    renderCard();
    await group();
    await user.click(screen.getByRole("radio", { name: "Credit card" }));

    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("radio", { name: "Debit card" })).toBeChecked();

    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("radio", { name: "Cash" })).toBeChecked();

    await user.keyboard("{ArrowLeft}");
    expect(screen.getByRole("radio", { name: "Debit card" })).toBeChecked();
  });

  it("gives the form the exact API code of the selected option", async () => {
    fakeCheckoutApi();
    const user = userEvent.setup({ delay: null });
    renderCard();
    await group();
    expect(screen.getByText("Form value: none")).toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: "Credit card" }));
    expect(screen.getByText("Form value: credit_card")).toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: "Debit card" }));
    expect(screen.getByText("Form value: debit_card")).toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: "Cash" }));
    expect(screen.getByText("Form value: cash")).toBeInTheDocument();
  });

  it("shows Choose a payment method below the options on submit, and marks the group invalid", async () => {
    fakeCheckoutApi();
    const user = userEvent.setup({ delay: null });
    renderCard();
    const radios = await group();

    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(await screen.findByText("Choose a payment method")).toBeInTheDocument();
    expect(radios).toHaveAttribute("aria-invalid", "true");
    expect(radios).toHaveAccessibleDescription("Choose a payment method");
  });

  it("clears the message when an option is chosen", async () => {
    fakeCheckoutApi();
    const user = userEvent.setup({ delay: null });
    renderCard();
    const radios = await group();
    await user.click(screen.getByRole("button", { name: "Send" }));
    await screen.findByText("Choose a payment method");

    await user.click(screen.getByRole("radio", { name: "Cash" }));

    await waitFor(() =>
      expect(screen.queryByText("Choose a payment method")).not.toBeInTheDocument(),
    );
    expect(radios).not.toHaveAttribute("aria-invalid");
  });

  it("shows no message before a submit, even when the group is left with no choice", async () => {
    fakeCheckoutApi();
    const user = userEvent.setup({ delay: null });
    renderCard();
    await group();

    await user.tab();
    await user.tab();

    expect(screen.queryByText("Choose a payment method")).not.toBeInTheDocument();
  });

  it("has no accessibility violation, with and without the message", async () => {
    fakeCheckoutApi();
    const user = userEvent.setup({ delay: null });
    const { container } = renderCard();
    await group();
    expect(await accessibilityViolations(container)).toEqual([]);

    await user.click(screen.getByRole("button", { name: "Send" }));
    await screen.findByText("Choose a payment method");

    expect(await accessibilityViolations(container)).toEqual([]);
  });
});

describe("PaymentCard while the config loads or fails", () => {
  it("shows Loading payment methods… while it loads, and no options", () => {
    fakeCheckoutApi({ configMode: "pending" });
    renderCard();

    expect(screen.getByText("Loading payment methods…")).toBeInTheDocument();
    expect(screen.queryByRole("radiogroup")).not.toBeInTheDocument();
  });

  it("shows an alert with Try again when it fails, and the options come back after a retry", async () => {
    const fetchMock = fakeCheckoutApi({ configMode: ["fail", "ok"] });
    const user = userEvent.setup({ delay: null });
    renderCard();

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("We couldn't load the payment methods.");

    await user.click(within(alert).getByRole("button", { name: "Try again" }));

    expect(await group()).toBeInTheDocument();
    expect(configRequests(fetchMock)).toBe(2);
    expect(catalogRequests(fetchMock)).toBe(0);
  });

  it("has no option to choose when the config has no known method", async () => {
    fakeCheckoutApi({ config: { ...checkoutConfig, paymentMethods: ["crypto"] } });
    renderCard();

    expect(
      await screen.findByText("No payment method is available right now."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
  });

  it("has no accessibility violation in the error state", async () => {
    fakeCheckoutApi({ configMode: "fail" });
    const { container } = renderCard();
    await screen.findByRole("alert");

    expect(await accessibilityViolations(container)).toEqual([]);
  });
});
