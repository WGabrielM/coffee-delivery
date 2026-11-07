import type { DefaultValues } from "react-hook-form";
import { z } from "zod";

import { addressSchema } from "../address-schema";
import { PAYMENT_METHOD_CODES } from "../payment-methods";

/**
 * Everything the checkout sends, in the shape of `POST /api/v1/orders` (without the items, which
 * are the cart): the address card and the payment choice, whose value is the API code of the method.
 */
export const checkoutFormSchema = z.object({
  address: addressSchema,
  paymentMethod: z.enum(PAYMENT_METHOD_CODES, { error: "Choose a payment method" }),
});

/** What the person types. */
export type CheckoutFormValues = z.input<typeof checkoutFormSchema>;
/** What a valid form gives: the text is trimmed. */
export type CheckoutFormData = z.output<typeof checkoutFormSchema>;

/** No payment method is selected at first, so `paymentMethod` starts unset. */
export const emptyCheckoutForm: DefaultValues<CheckoutFormValues> = {
  address: {
    zipCode: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
  },
};
