import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { fakeCheckoutApi, postedOrders, renderCheckoutPage } from "../../../test/checkout";
import { AddressCard } from "../address-card/AddressCard";
import { PaymentCard } from "../payment-card/PaymentCard";
import { CheckoutForm } from "./CheckoutForm";

let fetchMock: ReturnType<typeof fakeCheckoutApi>;

beforeEach(() => {
  fetchMock = fakeCheckoutApi();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// A submit button stands in for the Confirm order button of the summary.
function Page() {
  return (
    <CheckoutForm>
      <AddressCard />
      <PaymentCard />
      <button type="submit">Send</button>
    </CheckoutForm>
  );
}

describe("CheckoutForm", () => {
  it("is a form that leaves the validation to the schema, not to the browser", () => {
    const { container } = renderCheckoutPage(<Page />);

    const form = container.querySelector("form");

    expect(form).toBeInTheDocument();
    expect(form).toHaveAttribute("novalidate");
  });

  it("shows the message of every invalid field on submit, and sends nothing", async () => {
    const user = userEvent.setup({ delay: null });
    renderCheckoutPage(<Page />);
    await screen.findByRole("radiogroup", { name: "Payment method" });

    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(await screen.findByText("Enter a ZIP code like 12345-678")).toBeInTheDocument();
    expect(screen.getByText("Street is required")).toBeInTheDocument();
    expect(screen.getByText("Number is required")).toBeInTheDocument();
    expect(screen.getByText("Neighborhood is required")).toBeInTheDocument();
    expect(screen.getByText("City is required")).toBeInTheDocument();
    expect(screen.getByText("Enter the 2-letter state, like RS")).toBeInTheDocument();
    expect(screen.getByText("Choose a payment method")).toBeInTheDocument();
    expect(screen.queryByText(/Complement must have/)).not.toBeInTheDocument();
    expect(postedOrders(fetchMock)).toHaveLength(0);
  });

  it("moves the focus to the first invalid field on submit", async () => {
    const user = userEvent.setup({ delay: null });
    renderCheckoutPage(<Page />);

    await user.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => expect(screen.getByRole("textbox", { name: "ZIP code" })).toHaveFocus());
  });

  it("shows no alert when the form is only invalid", async () => {
    const user = userEvent.setup({ delay: null });
    renderCheckoutPage(<Page />);

    await user.click(screen.getByRole("button", { name: "Send" }));
    await screen.findByText("Street is required");

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
