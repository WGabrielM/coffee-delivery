import type { Path } from "react-hook-form";

import { ApiError } from "../../../api";
import type { CheckoutFormValues } from "./checkout-form-schema";

export const CHECK_ORDER_MESSAGE = "Please review your order and try again.";
export const NO_LONGER_AVAILABLE_MESSAGE =
  "Some coffees are no longer available. Please review your cart.";
export const TRY_AGAIN_MESSAGE = "We couldn't place your order. Please try again.";

/** The fields of the form that the server can name in a `400`, by their JSON path. */
const FORM_FIELDS = new Set<string>([
  "address.zipCode",
  "address.street",
  "address.number",
  "address.complement",
  "address.neighborhood",
  "address.city",
  "address.state",
  "paymentMethod",
]);

function isFormField(key: string): key is Path<CheckoutFormValues> {
  return FORM_FIELDS.has(key);
}

export type OrderFailure = {
  /** The messages of the server for the fields the form has, by field path. */
  fieldErrors: Partial<Record<Path<CheckoutFormValues>, string>>;
  /** What to tell the person above the Confirm order button, when a field cannot say it. */
  alert?: string | undefined;
};

/**
 * What a failed `POST /api/v1/orders` means for the form. A `400` puts each message under its field
 * (`address.*` and `paymentMethod`); any other key, or no key, gets the alert to review the order. A
 * `422` means a coffee left the catalog. Anything else (a network error, a `5xx`) is a plain "try
 * again". The server's own messages are fixed sentences, so the field ones are shown as they are.
 */
export function mapOrderError(error: unknown): OrderFailure {
  if (!(error instanceof ApiError)) return { fieldErrors: {}, alert: TRY_AGAIN_MESSAGE };

  if (error.status === 422) return { fieldErrors: {}, alert: NO_LONGER_AVAILABLE_MESSAGE };

  if (error.status === 400) {
    const fieldErrors: OrderFailure["fieldErrors"] = {};
    let unknownKey = error.fields === undefined || Object.keys(error.fields).length === 0;
    for (const [key, message] of Object.entries(error.fields ?? {})) {
      if (isFormField(key)) fieldErrors[key] = message;
      else unknownKey = true;
    }
    return unknownKey ? { fieldErrors, alert: CHECK_ORDER_MESSAGE } : { fieldErrors };
  }

  return { fieldErrors: {}, alert: TRY_AGAIN_MESSAGE };
}
