import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { fakeCheckoutApi } from "../../../test/checkout";
import { createTestQueryClient } from "../../../test/coffees";
import { AddressCard } from "../address-card/AddressCard";
import { PaymentCard } from "../payment-card/PaymentCard";
import { CheckoutForm } from "./CheckoutForm";

beforeEach(() => {
  fakeCheckoutApi();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// A submit button stands in for the Confirm order button of spec 025, which lives in the summary.
function Page({ onSubmit }: { onSubmit?: (values: unknown) => void }) {
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      <CheckoutForm {...(onSubmit ? { onSubmit } : {})}>
        <AddressCard />
        <PaymentCard />
        <button type="submit">Send</button>
      </CheckoutForm>
    </QueryClientProvider>
  );
}

async function fillTheSample(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByRole("textbox", { name: "ZIP code" }), "90250440");
  await user.type(screen.getByRole("textbox", { name: "Street" }), "  Rua João Daniel Martinelli ");
  await user.type(screen.getByRole("textbox", { name: "Number" }), "102");
  await user.type(screen.getByRole("textbox", { name: "Neighborhood" }), "Farrapos");
  await user.type(screen.getByRole("textbox", { name: "City" }), "Porto Alegre");
  await user.type(screen.getByRole("textbox", { name: "State" }), "rs");
  await user.click(await screen.findByRole("radio", { name: "Credit card" }));
}

describe("CheckoutForm", () => {
  it("is a form that leaves the validation to the schema, not to the browser", () => {
    const { container } = render(<Page />);

    const form = container.querySelector("form");

    expect(form).toBeInTheDocument();
    expect(form).toHaveAttribute("novalidate");
  });

  it("shows the message of every invalid field on submit, and sends nothing", async () => {
    const onSubmit = vi.fn<(values: unknown) => void>();
    const user = userEvent.setup({ delay: null });
    render(<Page onSubmit={onSubmit} />);

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
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("moves the focus to the first invalid field on submit", async () => {
    const user = userEvent.setup({ delay: null });
    render(<Page />);

    await user.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => expect(screen.getByRole("textbox", { name: "ZIP code" })).toHaveFocus());
  });

  it("sends the address, trimmed and masked, and the payment code when it is valid", async () => {
    const onSubmit = vi.fn<(values: unknown) => void>();
    const user = userEvent.setup({ delay: null });
    render(<Page onSubmit={onSubmit} />);

    await fillTheSample(user);
    await user.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith({
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
  });

  it("accepts a submit with no handler: it validates and sends nothing", async () => {
    const user = userEvent.setup({ delay: null });
    render(<Page />);
    await fillTheSample(user);

    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(
      screen.queryByText(/is required|Enter a ZIP|Enter the 2-letter|Choose a payment/),
    ).not.toBeInTheDocument();
  });
});
