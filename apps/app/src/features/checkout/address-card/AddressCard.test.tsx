import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { accessibilityViolations } from "../../../test/axe";
import { renderCheckoutPage } from "../../../test/checkout";
import { CheckoutForm } from "../checkout-form/CheckoutForm";
import { AddressCard } from "./AddressCard";

function renderCard() {
  return renderCheckoutPage(
    <CheckoutForm>
      <AddressCard />
      <button type="submit">Send</button>
    </CheckoutForm>,
  );
}

const field = (name: string) => screen.getByRole("textbox", { name });

const FIELDS = [
  "ZIP code",
  "Street",
  "Number",
  "Complement",
  "Neighborhood",
  "City",
  "State",
] as const;

describe("AddressCard", () => {
  it("is a group named Delivery address, with a level 3 heading in Roboto 16", () => {
    renderCard();

    const group = screen.getByRole("group", { name: "Delivery address" });
    const heading = within(group).getByRole("heading", { level: 3, name: "Delivery address" });

    expect(heading).toHaveClass("type-text-regular-m", "text-subtitle");
    expect(
      within(group).getByText("Enter the address where you want to receive your order"),
    ).toHaveClass("type-text-regular-s", "text-text");
  });

  it("is a 640 px wide card of the design: card color, radius 6, 40 px padding, a yellow-dark pin", () => {
    renderCard();

    const group = screen.getByRole("group", { name: "Delivery address" });

    expect(group).toHaveClass("bg-card", "rounded-button", "p-10");
    expect(group.querySelector("svg")?.parentElement).toHaveClass("text-yellow-dark");
  });

  it("has the seven fields, each named and with its placeholder", () => {
    renderCard();

    for (const name of FIELDS) {
      expect(field(name)).toHaveAttribute("placeholder", name);
    }
    expect(screen.getAllByRole("textbox")).toHaveLength(7);
  });

  it("marks only the Complement as Optional", () => {
    renderCard();

    expect(screen.getAllByText("Optional")).toHaveLength(1);
    expect(field("Complement")).toHaveAccessibleDescription("Optional");
  });

  it("puts the fields in the visual order, so Tab follows it", async () => {
    const user = userEvent.setup({ delay: null });
    renderCard();

    const order: string[] = [];
    for (let step = 0; step < FIELDS.length; step += 1) {
      await user.tab();
      order.push((document.activeElement as HTMLInputElement).placeholder);
    }

    expect(order).toEqual([...FIELDS]);
  });

  it("gives each field the width of the design", () => {
    renderCard();

    const widths = Object.fromEntries(
      FIELDS.map((name) => [name, field(name).closest("[data-field]")?.className]),
    );

    expect(widths["ZIP code"]).toContain("w-50");
    expect(widths["Street"]).toContain("w-full");
    expect(widths["Number"]).toContain("w-50");
    expect(widths["Complement"]).toContain("w-87");
    expect(widths["Neighborhood"]).toContain("w-50");
    expect(widths["City"]).toContain("w-69");
    expect(widths["State"]).toContain("w-15");
  });

  describe("the ZIP code mask", () => {
    it("adds the hyphen after the fifth digit and ignores the extra digits", async () => {
      const user = userEvent.setup({ delay: null });
      renderCard();

      await user.type(field("ZIP code"), "902504409999");

      expect(field("ZIP code")).toHaveValue("90250-440");
    });

    it("ignores letters and asks for a numeric keyboard", async () => {
      const user = userEvent.setup({ delay: null });
      renderCard();

      await user.type(field("ZIP code"), "9a0");

      expect(field("ZIP code")).toHaveValue("90");
      expect(field("ZIP code")).toHaveAttribute("inputmode", "numeric");
    });

    it("lets the person delete back over the hyphen, one digit at a time", async () => {
      const user = userEvent.setup({ delay: null });
      renderCard();

      await user.type(field("ZIP code"), "902504");
      await user.keyboard("{Backspace}");
      expect(field("ZIP code")).toHaveValue("90250");

      await user.keyboard("{Backspace}");
      expect(field("ZIP code")).toHaveValue("9025");
    });
  });

  describe("the State mask", () => {
    it("turns letters into capitals and stops at two letters", async () => {
      const user = userEvent.setup({ delay: null });
      renderCard();

      await user.type(field("State"), "rsp");

      expect(field("State")).toHaveValue("RS");
    });

    it("ignores digits", async () => {
      const user = userEvent.setup({ delay: null });
      renderCard();

      await user.type(field("State"), "1r");

      expect(field("State")).toHaveValue("R");
    });
  });

  describe("validation", () => {
    it("shows no message before the person leaves a field", async () => {
      const user = userEvent.setup({ delay: null });
      renderCard();

      await user.type(field("Street"), " ");

      expect(screen.queryByText("Street is required")).not.toBeInTheDocument();
      expect(field("Street")).not.toHaveAttribute("aria-invalid");
    });

    it("shows the message when an invalid field loses focus", async () => {
      const user = userEvent.setup({ delay: null });
      renderCard();

      await user.click(field("Street"));
      await user.tab();

      expect(await screen.findByText("Street is required")).toBeInTheDocument();
    });

    it("shows the message of the ZIP code on blur when it is incomplete", async () => {
      const user = userEvent.setup({ delay: null });
      renderCard();

      await user.type(field("ZIP code"), "1234");
      await user.tab();

      expect(await screen.findByText("Enter a ZIP code like 12345-678")).toBeInTheDocument();
    });

    it("marks an invalid field: the error border, aria-invalid, and a linked message", async () => {
      const user = userEvent.setup({ delay: null });
      renderCard();

      await user.type(field("City"), "   ");
      await user.tab();
      const message = await screen.findByText("City is required");

      expect(field("City")).toHaveAttribute("aria-invalid", "true");
      expect(field("City")).toHaveClass("border-error");
      expect(field("City")).toHaveAttribute(
        "aria-describedby",
        expect.stringContaining(message.id),
      );
      expect(field("City")).toHaveAccessibleDescription("City is required");
      expect(message).toHaveClass("text-error");
    });

    it("keeps the Optional hint and the message together on the Complement", async () => {
      const user = userEvent.setup({ delay: null });
      renderCard();

      await user.type(field("Complement"), "a".repeat(61));
      await user.tab();

      expect(
        await screen.findByText("Complement must have at most 60 characters"),
      ).toBeInTheDocument();
      expect(field("Complement")).toHaveAccessibleDescription(
        "Optional Complement must have at most 60 characters",
      );
    });

    it("clears the message as soon as the value is right", async () => {
      const user = userEvent.setup({ delay: null });
      renderCard();
      await user.click(field("Street"));
      await user.tab();
      await screen.findByText("Street is required");

      await user.type(field("Street"), "Rua João Daniel Martinelli");

      expect(screen.queryByText("Street is required")).not.toBeInTheDocument();
      expect(field("Street")).not.toHaveAttribute("aria-invalid");
    });

    it("shows no error for the sample of the design", async () => {
      const user = userEvent.setup({ delay: null });
      renderCard();

      await user.type(field("ZIP code"), "90250440");
      await user.type(field("Street"), "Rua João Daniel Martinelli");
      await user.type(field("Number"), "102");
      await user.type(field("Neighborhood"), "Farrapos");
      await user.type(field("City"), "Porto Alegre");
      await user.type(field("State"), "rs");
      await user.click(screen.getByRole("button", { name: "Send" }));

      expect(field("State")).toHaveValue("RS");
      expect(
        screen.queryByText(/is required|Enter a ZIP|Enter the 2-letter|must have/),
      ).not.toBeInTheDocument();
      for (const name of FIELDS) expect(field(name)).not.toHaveAttribute("aria-invalid");
    });
  });

  it("uses the autocomplete tokens a browser can fill from", () => {
    renderCard();

    expect(field("ZIP code")).toHaveAttribute("autocomplete", "postal-code");
    expect(field("Street")).toHaveAttribute("autocomplete", "address-line1");
    expect(field("Complement")).toHaveAttribute("autocomplete", "address-line2");
    expect(field("City")).toHaveAttribute("autocomplete", "address-level2");
    expect(field("State")).toHaveAttribute("autocomplete", "address-level1");
  });

  it("has no accessibility violation, empty or with every message shown", async () => {
    const user = userEvent.setup({ delay: null });
    const { container } = renderCard();
    expect(await accessibilityViolations(container)).toEqual([]);

    await user.click(screen.getByRole("button", { name: "Send" }));
    await screen.findByText("City is required");

    expect(await accessibilityViolations(container)).toEqual([]);
  });
});
