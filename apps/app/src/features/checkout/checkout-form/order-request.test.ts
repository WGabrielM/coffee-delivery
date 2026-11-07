import { describe, expect, it } from "vitest";

import { latte, traditionalEspresso } from "../../../test/coffees";
import { buildOrderRequest } from "./order-request";
import type { CheckoutFormData } from "./checkout-form-schema";

const values: CheckoutFormData = {
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
};

/** Every key of a JSON value, at any depth, so a test can check that no price field is sent. */
function allKeys(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(allKeys);
  if (typeof value !== "object" || value === null) return [];
  return Object.entries(value).flatMap(([key, inner]) => [key, ...allKeys(inner)]);
}

describe("buildOrderRequest", () => {
  it("takes the items from the cart lines: only the coffee id and the quantity", () => {
    const request = buildOrderRequest(
      [
        { coffeeId: latte.id, quantity: 2 },
        { coffeeId: traditionalEspresso.id, quantity: 1 },
      ],
      values,
    );

    expect(request.items).toEqual([
      { coffeeId: latte.id, quantity: 2 },
      { coffeeId: traditionalEspresso.id, quantity: 1 },
    ]);
  });

  it("sends the address and the payment code as the form has them", () => {
    const request = buildOrderRequest([{ coffeeId: latte.id, quantity: 1 }], values);

    expect(request.address).toEqual(values.address);
    expect(request.paymentMethod).toBe("credit_card");
  });

  it("has exactly items, address, and paymentMethod, and no price field anywhere", () => {
    const request = buildOrderRequest([{ coffeeId: latte.id, quantity: 1 }], values);

    expect(Object.keys(request).toSorted()).toEqual(["address", "items", "paymentMethod"]);
    expect(
      allKeys(request).filter((key) => /price|total|fee|cents/i.test(key.replace("coffeeId", ""))),
    ).toEqual([]);
  });

  it("does not share the cart array, so a later change of the cart does not change the request", () => {
    const lines = [{ coffeeId: latte.id, quantity: 1 }];

    const request = buildOrderRequest(lines, values);

    expect(request.items).not.toBe(lines);
    expect(request.items[0]).not.toBe(lines[0]);
  });
});
