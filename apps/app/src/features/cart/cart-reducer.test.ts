import { describe, expect, it } from "vitest";

import { cartReducer, totalQuantity, type CartLine } from "./cart-reducer";

const latte = "0b0d6a3e-6f1c-4a52-8a7c-3d1f4f0f8c11";
const espresso = "2f6ffcd1-99dc-4734-83ea-6f17e7929870";

function cartWith(...lines: CartLine[]): CartLine[] {
  return lines;
}

describe("add", () => {
  it("creates a line for a coffee that is not in the cart", () => {
    const next = cartReducer([], { type: "add", coffeeId: latte, quantity: 2 });

    expect(next).toEqual([{ coffeeId: latte, quantity: 2 }]);
  });

  it("adds to the line of a coffee that is already in the cart, without a second line", () => {
    const state = cartWith({ coffeeId: latte, quantity: 2 });

    const next = cartReducer(state, { type: "add", coffeeId: latte, quantity: 3 });

    expect(next).toEqual([{ coffeeId: latte, quantity: 5 }]);
  });

  it("keeps the lines in insertion order", () => {
    let state: readonly CartLine[] = [];
    state = cartReducer(state, { type: "add", coffeeId: latte, quantity: 1 });
    state = cartReducer(state, { type: "add", coffeeId: espresso, quantity: 1 });
    state = cartReducer(state, { type: "add", coffeeId: latte, quantity: 1 });

    expect(state.map((line) => line.coffeeId)).toEqual([latte, espresso]);
  });

  it("never goes over 99 and drops the extra", () => {
    const state = cartWith({ coffeeId: latte, quantity: 98 });

    expect(cartReducer(state, { type: "add", coffeeId: latte, quantity: 5 })).toEqual([
      { coffeeId: latte, quantity: 99 },
    ]);
    expect(cartReducer([], { type: "add", coffeeId: espresso, quantity: 150 })).toEqual([
      { coffeeId: espresso, quantity: 99 },
    ]);
  });

  it("ignores a quantity that adds nothing: zero, negative, or not a number", () => {
    const state = cartWith({ coffeeId: latte, quantity: 2 });

    for (const quantity of [0, -3, 0.4, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(cartReducer(state, { type: "add", coffeeId: latte, quantity })).toBe(state);
    }
  });

  it("cuts a quantity with decimals to a whole number", () => {
    expect(cartReducer([], { type: "add", coffeeId: latte, quantity: 2.9 })).toEqual([
      { coffeeId: latte, quantity: 2 },
    ]);
  });

  it("ignores an empty coffee id, because the storage would drop that line", () => {
    const state: CartLine[] = [];

    expect(cartReducer(state, { type: "add", coffeeId: "", quantity: 1 })).toBe(state);
  });

  it("does not change the state it received", () => {
    const state = Object.freeze([Object.freeze({ coffeeId: latte, quantity: 1 })]);

    const next = cartReducer(state, { type: "add", coffeeId: latte, quantity: 1 });

    expect(next).not.toBe(state);
    expect(state).toEqual([{ coffeeId: latte, quantity: 1 }]);
  });
});

describe("setQuantity", () => {
  it("sets the quantity of a line, keeping its place", () => {
    const state = cartWith({ coffeeId: latte, quantity: 1 }, { coffeeId: espresso, quantity: 4 });

    expect(cartReducer(state, { type: "setQuantity", coffeeId: latte, quantity: 7 })).toEqual([
      { coffeeId: latte, quantity: 7 },
      { coffeeId: espresso, quantity: 4 },
    ]);
  });

  it("clamps the quantity between 1 and 99", () => {
    const state = cartWith({ coffeeId: latte, quantity: 5 });

    expect(cartReducer(state, { type: "setQuantity", coffeeId: latte, quantity: 0 })).toEqual([
      { coffeeId: latte, quantity: 1 },
    ]);
    expect(cartReducer(state, { type: "setQuantity", coffeeId: latte, quantity: -8 })).toEqual([
      { coffeeId: latte, quantity: 1 },
    ]);
    expect(cartReducer(state, { type: "setQuantity", coffeeId: latte, quantity: 100 })).toEqual([
      { coffeeId: latte, quantity: 99 },
    ]);
  });

  it("does nothing for a coffee that is not in the cart", () => {
    const state = cartWith({ coffeeId: latte, quantity: 5 });

    expect(cartReducer(state, { type: "setQuantity", coffeeId: espresso, quantity: 2 })).toBe(
      state,
    );
  });

  it("does nothing when the quantity is not a number, or when it already is that quantity", () => {
    const state = cartWith({ coffeeId: latte, quantity: 5 });

    expect(cartReducer(state, { type: "setQuantity", coffeeId: latte, quantity: Number.NaN })).toBe(
      state,
    );
    expect(cartReducer(state, { type: "setQuantity", coffeeId: latte, quantity: 5 })).toBe(state);
  });
});

describe("remove and clear", () => {
  it("removes the line of a coffee and keeps the others in order", () => {
    const state = cartWith({ coffeeId: latte, quantity: 1 }, { coffeeId: espresso, quantity: 2 });

    expect(cartReducer(state, { type: "remove", coffeeId: latte })).toEqual([
      { coffeeId: espresso, quantity: 2 },
    ]);
  });

  it("does nothing when the coffee is not in the cart", () => {
    const state = cartWith({ coffeeId: latte, quantity: 1 });

    expect(cartReducer(state, { type: "remove", coffeeId: espresso })).toBe(state);
  });

  it("empties the cart", () => {
    const state = cartWith({ coffeeId: latte, quantity: 1 }, { coffeeId: espresso, quantity: 2 });

    expect(cartReducer(state, { type: "clear" })).toEqual([]);
  });

  it("keeps the same empty cart when it is already empty", () => {
    const state: CartLine[] = [];

    expect(cartReducer(state, { type: "clear" })).toBe(state);
  });
});

describe("totalQuantity", () => {
  it("is the sum of all quantities", () => {
    const state = cartWith({ coffeeId: latte, quantity: 2 }, { coffeeId: espresso, quantity: 1 });

    expect(totalQuantity(state)).toBe(3);
  });

  it("is zero for an empty cart", () => {
    expect(totalQuantity([])).toBe(0);
  });
});
