import { describe, expect, it } from "vitest";

import type { OrderRequest } from "../api";
import { createIdempotencyKeys } from "./idempotency-keys";

const request: OrderRequest = {
  items: [{ coffeeId: "latte", quantity: 1 }],
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

function counter() {
  let next = 0;
  return () => `key-${++next}`;
}

describe("createIdempotencyKeys", () => {
  it("gives a new key to the first request", () => {
    const keys = createIdempotencyKeys(counter());

    expect(keys.keyFor(request)).toBe("key-1");
  });

  it("keeps the key while the request is the same, even as another object", () => {
    const keys = createIdempotencyKeys(counter());

    const first = keys.keyFor(request);
    const again = keys.keyFor(structuredClone(request));

    expect(again).toBe(first);
  });

  it("gives a new key when the items, the address or the payment change", () => {
    const keys = createIdempotencyKeys(counter());
    const first = keys.keyFor(request);

    const moreCoffee = keys.keyFor({ ...request, items: [{ coffeeId: "latte", quantity: 2 }] });
    const otherAddress = keys.keyFor({ ...request, address: { ...request.address, number: "1" } });
    const otherPayment = keys.keyFor({ ...request, paymentMethod: "cash" });

    expect(new Set([first, moreCoffee, otherAddress, otherPayment]).size).toBe(4);
  });

  it("gives a new key after reset", () => {
    const keys = createIdempotencyKeys(counter());
    const first = keys.keyFor(request);

    keys.reset();

    expect(keys.keyFor(request)).not.toBe(first);
  });

  it("makes a UUID by default", () => {
    expect(createIdempotencyKeys().keyFor(request)).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });
});
