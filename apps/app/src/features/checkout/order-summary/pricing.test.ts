import { describe, expect, it } from "vitest";

import { cuban, latte, traditionalEspresso } from "../../../test/coffees";
import { priceOrder } from "./pricing";

const catalog = [traditionalEspresso, cuban, latte];

describe("priceOrder", () => {
  it("prices Latte × 2 and Traditional Espresso × 1: 19.80 and 9.90, items 29.70, total 33.20", () => {
    const order = priceOrder(
      [
        { coffeeId: latte.id, quantity: 2 },
        { coffeeId: traditionalEspresso.id, quantity: 1 },
      ],
      catalog,
      350,
    );

    expect(order.rows.map((row) => [row.coffee.name, row.quantity, row.lineTotalInCents])).toEqual([
      ["Latte", 2, 1980],
      ["Traditional Espresso", 1, 990],
    ]);
    expect(order.itemsTotalInCents).toBe(2970);
    expect(order.deliveryFeeInCents).toBe(350);
    expect(order.totalInCents).toBe(3320);
  });

  it("keeps the order of the cart lines, not the order of the catalog", () => {
    const order = priceOrder(
      [
        { coffeeId: latte.id, quantity: 1 },
        { coffeeId: traditionalEspresso.id, quantity: 1 },
      ],
      catalog,
      350,
    );

    expect(order.rows.map((row) => row.coffee.name)).toEqual(["Latte", "Traditional Espresso"]);
  });

  it("multiplies the unit price by the quantity, with the price of the catalog", () => {
    const order = priceOrder([{ coffeeId: cuban.id, quantity: 3 }], catalog, 350);

    expect(order.rows[0]?.lineTotalInCents).toBe(3750);
    expect(order.itemsTotalInCents).toBe(3750);
    expect(order.totalInCents).toBe(4100);
  });

  it("skips a line whose coffee is not in the catalog", () => {
    const order = priceOrder(
      [
        { coffeeId: "gone", quantity: 5 },
        { coffeeId: latte.id, quantity: 1 },
      ],
      catalog,
      350,
    );

    expect(order.rows.map((row) => row.coffee.name)).toEqual(["Latte"]);
    expect(order.itemsTotalInCents).toBe(990);
  });

  it("has no rows and no items total for an empty cart; the total is then the fee", () => {
    const order = priceOrder([], catalog, 350);

    expect(order.rows).toEqual([]);
    expect(order.itemsTotalInCents).toBe(0);
    expect(order.totalInCents).toBe(350);
  });

  it("uses the fee it is given", () => {
    expect(priceOrder([{ coffeeId: latte.id, quantity: 1 }], catalog, 0).totalInCents).toBe(990);
  });
});
