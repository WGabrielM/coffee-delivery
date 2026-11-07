import { z } from "zod";

import { addressSchema } from "../address-schema";

/**
 * Everything the checkout sends, in the shape of `POST /api/v1/orders` (without the items, which
 * are the cart). The address card is the first part; the payment choice joins it in spec 024.
 */
export const checkoutFormSchema = z.object({ address: addressSchema });

/** What the person types. */
export type CheckoutFormValues = z.input<typeof checkoutFormSchema>;
/** What a valid form gives: the text is trimmed. */
export type CheckoutFormData = z.output<typeof checkoutFormSchema>;

export const emptyCheckoutForm: CheckoutFormValues = {
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
