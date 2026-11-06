import { afterEach, describe, expect, it, vi } from "vitest";

import { CART_STORAGE_KEY, loadCart, saveCart } from "./cart-storage";

const latte = "0b0d6a3e-6f1c-4a52-8a7c-3d1f4f0f8c11";
const espresso = "2f6ffcd1-99dc-4734-83ea-6f17e7929870";

function store(value: unknown): void {
  localStorage.setItem(CART_STORAGE_KEY, typeof value === "string" ? value : JSON.stringify(value));
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("CART_STORAGE_KEY", () => {
  it("is the versioned key of the product", () => {
    expect(CART_STORAGE_KEY).toBe("coffee-delivery:cart:v1");
  });
});

describe("saveCart and loadCart", () => {
  it("round-trips the lines in order", () => {
    const lines = [
      { coffeeId: espresso, quantity: 1 },
      { coffeeId: latte, quantity: 99 },
    ];

    saveCart(lines);

    expect(JSON.parse(localStorage.getItem(CART_STORAGE_KEY) ?? "null")).toEqual(lines);
    expect(loadCart()).toEqual(lines);
  });

  it("loads an empty cart when nothing was saved", () => {
    expect(loadCart()).toEqual([]);
  });
});

describe("loadCart with corrupt data", () => {
  it.each([
    ["text that is not JSON", "{not json"],
    ["an empty string", ""],
    ["an object", { coffeeId: latte, quantity: 1 }],
    ["a number", 3],
    ["null", null],
    ["a string", "coffee"],
  ])("returns an empty cart for %s", (_name, value) => {
    store(value);

    expect(loadCart()).toEqual([]);
  });

  it("ignores each invalid line and keeps the valid ones", () => {
    store([
      { coffeeId: latte, quantity: 2 },
      { coffeeId: "", quantity: 1 },
      { coffeeId: espresso, quantity: 0 },
      { coffeeId: espresso, quantity: 100 },
      { coffeeId: espresso, quantity: 1.5 },
      { coffeeId: espresso, quantity: "3" },
      { coffeeId: espresso, quantity: null },
      { coffeeId: 7, quantity: 1 },
      { quantity: 1 },
      { coffeeId: espresso },
      null,
      "line",
      42,
      [],
      { coffeeId: espresso, quantity: 99 },
    ]);

    expect(loadCart()).toEqual([
      { coffeeId: latte, quantity: 2 },
      { coffeeId: espresso, quantity: 99 },
    ]);
  });

  it("keeps only the coffee id and the quantity of a line, never a stored price or name", () => {
    store([{ coffeeId: latte, quantity: 1, priceInCents: 1, name: "Cheap latte" }]);

    expect(loadCart()).toEqual([{ coffeeId: latte, quantity: 1 }]);
  });

  it("keeps the first line of a coffee that appears twice", () => {
    store([
      { coffeeId: latte, quantity: 2 },
      { coffeeId: espresso, quantity: 1 },
      { coffeeId: latte, quantity: 5 },
    ]);

    expect(loadCart()).toEqual([
      { coffeeId: latte, quantity: 2 },
      { coffeeId: espresso, quantity: 1 },
    ]);
  });
});

describe("when localStorage throws", () => {
  it("loads an empty cart when reading throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("Denied", "SecurityError");
    });

    expect(loadCart()).toEqual([]);
  });

  it("does not throw when writing fails, for example a full storage", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Full", "QuotaExceededError");
    });

    expect(() => saveCart([{ coffeeId: latte, quantity: 1 }])).not.toThrow();
  });

  it("does not throw when the browser refuses access to localStorage itself", () => {
    vi.spyOn(window, "localStorage", "get").mockImplementation(() => {
      throw new DOMException("Denied", "SecurityError");
    });

    expect(loadCart()).toEqual([]);
    expect(() => saveCart([{ coffeeId: latte, quantity: 1 }])).not.toThrow();
  });
});
