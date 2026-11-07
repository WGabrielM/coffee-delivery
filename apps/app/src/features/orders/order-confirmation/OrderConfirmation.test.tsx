import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { deliveryIllustration } from "../../../assets";
import { accessibilityViolations } from "../../../test/axe";
import { sampleOrder } from "../../../test/orders";
import type { Order } from "../../checkout/api";
import { OrderConfirmation } from "./OrderConfirmation";

function renderOrder(order: Order = sampleOrder) {
  return render(<OrderConfirmation order={order} />);
}

const details = () => screen.getByRole("list", { name: "Order details" });
const row = (index: number) => within(details()).getAllByRole("listitem")[index]!;

describe("OrderConfirmation", () => {
  it("has the h1 Uhu! Order confirmed in Baloo 2 ExtraBold 32 and the yellow-dark color", () => {
    renderOrder();

    const title = screen.getByRole("heading", { level: 1, name: "Uhu! Order confirmed" });

    expect(title).toHaveClass("type-title-l", "text-yellow-dark");
  });

  it("has the subtitle in Roboto 20 and the subtitle color", () => {
    renderOrder();

    expect(screen.getByText("Now just wait and your coffee will soon be with you")).toHaveClass(
      "type-text-regular-l",
      "text-subtitle",
    );
  });

  it("shows the street and number in bold, then the neighborhood, city, and state", () => {
    renderOrder();

    const delivery = row(0);

    expect(delivery).toHaveTextContent(
      "Delivery to Rua João Daniel Martinelli, 102Farrapos - Porto Alegre, RS",
    );
    const bold = within(delivery).getByText("Rua João Daniel Martinelli, 102");
    expect(bold).toHaveClass("type-text-bold-m");
  });

  it("does not show the complement", () => {
    renderOrder({ ...sampleOrder, address: { ...sampleOrder.address, complement: "Apt 12" } });

    expect(screen.queryByText(/Apt 12/)).not.toBeInTheDocument();
  });

  it("shows the estimate from estimatedDeliveryMinutes in bold", () => {
    renderOrder({ ...sampleOrder, estimatedDeliveryMinutes: { min: 15, max: 25 } });

    const estimate = row(1);

    expect(estimate).toHaveTextContent("Estimated delivery15 min - 25 min");
    expect(within(estimate).getByText("15 min - 25 min")).toHaveClass("type-text-bold-m");
  });

  it.each([
    ["credit_card", "Credit card"],
    ["debit_card", "Debit card"],
    ["cash", "Cash"],
  ])("shows %s as %s, in bold, after Payment on delivery", (paymentMethod, label) => {
    renderOrder({ ...sampleOrder, paymentMethod });

    const payment = row(2);

    expect(payment).toHaveTextContent(`Payment on delivery${label}`);
    expect(within(payment).getByText(label)).toHaveClass("type-text-bold-m");
  });

  it("shows a payment method the app does not know as it came, so nothing is hidden", () => {
    renderOrder({ ...sampleOrder, paymentMethod: "crypto" });

    expect(row(2)).toHaveTextContent("Payment on deliverycrypto");
  });

  it("has three rows, each with a 32 px round icon: purple, yellow, and yellow-dark", () => {
    renderOrder();

    const icons = [0, 1, 2].map((index) => row(index).querySelector("[data-icon-circle]"));

    for (const icon of icons) expect(icon).toHaveClass("size-8", "rounded-round", "text-white");
    expect(icons[0]).toHaveClass("bg-purple");
    expect(icons[1]).toHaveClass("bg-yellow");
    expect(icons[2]).toHaveClass("bg-yellow-dark");
    expect(details().querySelectorAll("svg")).toHaveLength(3);
  });

  it("draws the card with a 1 px gradient border from yellow to purple and the corners 6/36/6/36", () => {
    renderOrder();

    const border = details().parentElement!;

    expect(border).toHaveClass(
      "rounded-order-card",
      "p-px",
      "bg-linear-to-br",
      "from-yellow",
      "to-purple",
    );
    expect(details()).toHaveClass("bg-background", "p-10");
  });

  it("shows no price, item, or total", () => {
    renderOrder();

    expect(screen.queryByText(/\$|Latte|Total|Items/)).not.toBeInTheDocument();
  });

  it("has the illustration with an empty alt text", () => {
    const { container } = renderOrder();

    const image = container.querySelector("img");

    expect(image).toHaveAttribute("src", deliveryIllustration);
    expect(image).toHaveAttribute("alt", "");
    expect(image).toHaveAttribute("width", "492");
    expect(image).toHaveAttribute("height", "293");
  });

  it("has no accessibility violation", async () => {
    const { container } = renderOrder();

    expect(await accessibilityViolations(container)).toEqual([]);
  });
});
