import { describe, expect, it } from "vitest";

import { maskState } from "./address-masks";
import {
  addressSchema,
  MAX_COMPLEMENT_LENGTH,
  STATE_PATTERN,
  ZIP_CODE_PATTERN,
  type AddressValues,
} from "./address-schema";

// The address of the design (the Checkout Filled frame).
const sample: AddressValues = {
  zipCode: "90250-440",
  street: "Rua João Daniel Martinelli",
  number: "102",
  complement: "",
  neighborhood: "Farrapos",
  city: "Porto Alegre",
  state: "RS",
};

/** The messages by field of a failed parse, so a test names the field and the text. */
function errorsOf(values: Partial<Record<keyof AddressValues, string>>) {
  const result = addressSchema.safeParse({ ...sample, ...values });
  if (result.success) return {};
  return Object.fromEntries(
    result.error.issues.map((issue) => [issue.path.join("."), issue.message]),
  );
}

describe("addressSchema", () => {
  it("accepts the sample address of the design", () => {
    expect(addressSchema.safeParse(sample).success).toBe(true);
  });

  it("accepts a complement of up to 60 characters, and an empty one", () => {
    expect(errorsOf({ complement: "a".repeat(MAX_COMPLEMENT_LENGTH) })).toEqual({});
    expect(errorsOf({ complement: "" })).toEqual({});
    expect(errorsOf({ complement: "   " })).toEqual({});
  });

  it("names the shared limits: the ZIP pattern, the state pattern, and 60 characters", () => {
    expect(ZIP_CODE_PATTERN.source).toBe("^\\d{5}-\\d{3}$");
    expect(STATE_PATTERN.source).toBe("^[A-Z]{2}$");
    expect(MAX_COMPLEMENT_LENGTH).toBe(60);
  });

  describe("ZIP code", () => {
    it.each(["1234-567", "12345678", "12345-67", "12345-6789", "abcde-fgh", "12345 678", ""])(
      "rejects %j with the message of the design",
      (zipCode) => {
        expect(errorsOf({ zipCode })).toEqual({ zipCode: "Enter a ZIP code like 12345-678" });
      },
    );

    it("accepts the format 00000-000, also with spaces around it", () => {
      expect(errorsOf({ zipCode: "01310-100" })).toEqual({});
      expect(errorsOf({ zipCode: " 01310-100 " })).toEqual({});
    });
  });

  describe("State", () => {
    it.each(["R", "RSX", "rs", "R1", "1", ""])(
      "rejects %j with the message of the design",
      (state) => {
        expect(errorsOf({ state })).toEqual({ state: "Enter the 2-letter state, like RS" });
      },
    );

    it("accepts rs once the field has turned it into RS", () => {
      const state = maskState("rs");

      expect(state).toBe("RS");
      expect(errorsOf({ state })).toEqual({});
    });
  });

  describe("required text fields", () => {
    it.each([
      ["street", "Street is required"],
      ["number", "Number is required"],
      ["neighborhood", "Neighborhood is required"],
      ["city", "City is required"],
    ] as const)("rejects an empty %s", (field, message) => {
      expect(errorsOf({ [field]: "" })).toEqual({ [field]: message });
    });

    it.each(["street", "number", "neighborhood", "city"] as const)(
      "rejects a %s made only of spaces",
      (field) => {
        expect(errorsOf({ [field]: "     " })[field]).toMatch(/is required$/);
      },
    );
  });

  describe("Complement", () => {
    it("rejects 61 characters with the message of the design", () => {
      expect(errorsOf({ complement: "a".repeat(MAX_COMPLEMENT_LENGTH + 1) })).toEqual({
        complement: "Complement must have at most 60 characters",
      });
    });

    it("counts the characters after trimming, as the API does", () => {
      const padded = ` ${"a".repeat(MAX_COMPLEMENT_LENGTH)} `;

      expect(errorsOf({ complement: padded })).toEqual({});
    });
  });

  it("returns the text trimmed", () => {
    const result = addressSchema.parse({
      ...sample,
      street: "  Rua João Daniel Martinelli ",
      number: " 102 ",
      complement: " Apt 12 ",
      neighborhood: " Farrapos ",
      city: " Porto Alegre ",
    });

    expect(result).toEqual({ ...sample, complement: "Apt 12" });
  });

  it("reports every invalid field at once", () => {
    const errors = errorsOf({ zipCode: "1", street: "", city: "", state: "x" });

    expect(Object.keys(errors).toSorted()).toEqual(["city", "state", "street", "zipCode"]);
  });
});
