import { zodResolver } from "@hookform/resolvers/zod";
import type { ReactNode } from "react";
import { FormProvider, useForm } from "react-hook-form";

import {
  checkoutFormSchema,
  emptyCheckoutForm,
  type CheckoutFormData,
  type CheckoutFormValues,
} from "./checkout-form-schema";

type CheckoutFormProps = {
  children: ReactNode;
  /**
   * Called with the valid, trimmed values. Spec 025 passes the function that sends the order; until
   * then a submit only validates and shows the messages.
   */
  onSubmit?: (values: CheckoutFormData) => void;
};

/**
 * The one form of the checkout. It owns the values and the validation (React Hook Form and the Zod
 * schema) and shares them with every card inside it through the form context, so the address card,
 * the payment card (spec 024), and the Confirm order button (spec 025) are parts of the same form.
 * A field is checked when it loses focus, then on every change; a submit checks all of them and
 * moves the focus to the first invalid one. The browser's own validation is off (`noValidate`):
 * the messages are the ones of the schema.
 */
export function CheckoutForm({ children, onSubmit }: CheckoutFormProps) {
  const methods = useForm<CheckoutFormValues, unknown, CheckoutFormData>({
    resolver: zodResolver(checkoutFormSchema),
    mode: "onTouched",
    defaultValues: emptyCheckoutForm,
  });

  return (
    <FormProvider {...methods}>
      <form noValidate onSubmit={methods.handleSubmit((values) => onSubmit?.(values))}>
        {children}
      </form>
    </FormProvider>
  );
}
