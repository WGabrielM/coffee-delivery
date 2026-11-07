import { describe, expect, it } from "vitest";

import { paymentOptions, PAYMENT_METHODS } from "./payment-methods";

describe("payment methods", () => {
  it("names the three methods of the API with their label and icon", () => {
    expect(PAYMENT_METHODS).toEqual({
      credit_card: { label: "Credit card", icon: "credit-card" },
      debit_card: { label: "Debit card", icon: "bank" },
      cash: { label: "Cash", icon: "money" },
    });
  });

  it("turns the codes of the config into options, in the order of the config", () => {
    expect(paymentOptions(["cash", "credit_card", "debit_card"])).toEqual([
      { value: "cash", label: "Cash", icon: "money" },
      { value: "credit_card", label: "Credit card", icon: "credit-card" },
      { value: "debit_card", label: "Debit card", icon: "bank" },
    ]);
  });

  it("ignores a code the app does not know", () => {
    expect(paymentOptions(["credit_card", "crypto", "cash"]).map((option) => option.value)).toEqual(
      ["credit_card", "cash"],
    );
  });

  it("gives no option for an empty list", () => {
    expect(paymentOptions([])).toEqual([]);
  });

  it("keeps a method once when the config repeats it", () => {
    expect(paymentOptions(["cash", "cash"])).toHaveLength(1);
  });
});
