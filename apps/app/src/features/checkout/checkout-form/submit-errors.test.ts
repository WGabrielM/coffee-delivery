import { describe, expect, it } from "vitest";

import { ApiError } from "../../../api";
import {
  CHECK_ORDER_MESSAGE,
  mapOrderError,
  NO_LONGER_AVAILABLE_MESSAGE,
  TRY_AGAIN_MESSAGE,
} from "./submit-errors";

const validation = (fields?: Record<string, string>) =>
  new ApiError({
    status: 400,
    code: "validation_failed",
    message: "The request has invalid fields.",
    fields,
  });

describe("mapOrderError", () => {
  it("has the three messages of the spec", () => {
    expect(CHECK_ORDER_MESSAGE).toBe("Please review your order and try again.");
    expect(NO_LONGER_AVAILABLE_MESSAGE).toBe(
      "Some coffees are no longer available. Please review your cart.",
    );
    expect(TRY_AGAIN_MESSAGE).toBe("We couldn't place your order. Please try again.");
  });

  describe("400 validation_failed", () => {
    it("sets the field errors for keys that start with address. and for paymentMethod", () => {
      const result = mapOrderError(
        validation({
          "address.zipCode": "Enter a ZIP code like 12345-678.",
          "address.city": "Enter the city.",
          paymentMethod: "Choose a payment method.",
        }),
      );

      expect(result.fieldErrors).toEqual({
        "address.zipCode": "Enter a ZIP code like 12345-678.",
        "address.city": "Enter the city.",
        paymentMethod: "Choose a payment method.",
      });
      expect(result.alert).toBeUndefined();
    });

    it("maps all seven address fields", () => {
      const fields = Object.fromEntries(
        ["zipCode", "street", "number", "complement", "neighborhood", "city", "state"].map(
          (name) => [`address.${name}`, `Problem with ${name}.`],
        ),
      );

      expect(Object.keys(mapOrderError(validation(fields)).fieldErrors)).toHaveLength(7);
    });

    it("shows the alert for any other key, such as items", () => {
      const result = mapOrderError(validation({ items: "Add at least one coffee." }));

      expect(result.fieldErrors).toEqual({});
      expect(result.alert).toBe(CHECK_ORDER_MESSAGE);
    });

    it("sets the fields it knows and also shows the alert for the keys it does not", () => {
      const result = mapOrderError(
        validation({ "address.state": "Enter the state.", "items[0].quantity": "Too many." }),
      );

      expect(result.fieldErrors).toEqual({ "address.state": "Enter the state." });
      expect(result.alert).toBe(CHECK_ORDER_MESSAGE);
    });

    it("treats an address key the form has no field for as an unknown key", () => {
      const result = mapOrderError(validation({ "address.country": "Not accepted." }));

      expect(result.fieldErrors).toEqual({});
      expect(result.alert).toBe(CHECK_ORDER_MESSAGE);
    });

    it("shows the alert when the answer has no fields at all", () => {
      const result = mapOrderError(validation(undefined));

      expect(result.fieldErrors).toEqual({});
      expect(result.alert).toBe(CHECK_ORDER_MESSAGE);
    });

    it("shows the alert for the key body (a body that is not valid JSON)", () => {
      expect(mapOrderError(validation({ body: "The request body is not valid JSON." })).alert).toBe(
        CHECK_ORDER_MESSAGE,
      );
    });
  });

  describe("422 unprocessable_content", () => {
    it("shows the alert about coffees that are no longer available and sets no field", () => {
      const result = mapOrderError(
        new ApiError({
          status: 422,
          code: "unprocessable_content",
          message: "The order cannot be processed.",
          fields: { items: "Unknown coffee." },
        }),
      );

      expect(result).toEqual({ fieldErrors: {}, alert: NO_LONGER_AVAILABLE_MESSAGE });
    });
  });

  describe("everything else", () => {
    it.each([
      ["a network error", new ApiError({ status: 0, code: "network_error", message: "Offline." })],
      [
        "a 500",
        new ApiError({ status: 500, code: "unexpected_error", message: "Something went wrong." }),
      ],
      ["a 503", new ApiError({ status: 503, code: "unexpected_error", message: "Down." })],
      ["a 404", new ApiError({ status: 404, code: "not_found", message: "Not found." })],
      ["an error that is not an ApiError", new TypeError("boom")],
      ["a value that is not an error", "text"],
    ])("shows the try again alert for %s", (_name, error) => {
      expect(mapOrderError(error)).toEqual({ fieldErrors: {}, alert: TRY_AGAIN_MESSAGE });
    });
  });
});
