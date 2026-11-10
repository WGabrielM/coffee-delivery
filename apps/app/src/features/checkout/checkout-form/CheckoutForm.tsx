import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState, type ReactNode } from "react";
import { FormProvider, useForm, type Path } from "react-hook-form";
import { useNavigate } from "react-router";

import { useCart } from "../../cart/cart-context";
import { useCreateOrder, type Order } from "../api";
import {
  checkoutFormSchema,
  emptyCheckoutForm,
  type CheckoutFormData,
  type CheckoutFormValues,
} from "./checkout-form-schema";
import { createIdempotencyKeys } from "./idempotency-keys";
import { buildOrderRequest } from "./order-request";
import { mapOrderError } from "./submit-errors";
import { SubmitStateContext } from "./submit-state";

/**
 * The one form of the checkout. It owns the values and the validation (React Hook Form and the Zod
 * schema), shares them with every card inside it through the form context, and sends the order:
 * the address card, the payment card, and the Confirm order button of the summary are parts of it.
 *
 * A field is checked when it loses focus, then on every change; a submit checks all of them and
 * moves the focus to the first invalid one, and sends nothing. A valid submit posts the cart lines,
 * the address, and the payment code once. On success it opens the order page, replacing the
 * checkout in the history, and only then clears the cart. On a failure the cart and the values stay:
 * the messages of the server go under their fields, and what no field can say becomes the alert of
 * the summary (see `mapOrderError`). The request is never repeated by itself, but a try again with
 * the same request carries the same `Idempotency-Key`, so a lost answer never makes a second order.
 *
 * The browser's own validation is off (`noValidate`): the messages are the ones of the schema.
 */
export function CheckoutForm({ children }: { children: ReactNode }) {
  const { lines, clear } = useCart();
  const navigate = useNavigate();
  const createOrder = useCreateOrder();
  const [alertMessage, setAlertMessage] = useState<string | undefined>(undefined);
  const [idempotencyKeys] = useState(() => createIdempotencyKeys());

  const methods = useForm<CheckoutFormValues, unknown, CheckoutFormData>({
    resolver: zodResolver(checkoutFormSchema),
    mode: "onTouched",
    defaultValues: emptyCheckoutForm,
  });
  const { isSubmitting } = methods.formState;

  const submit = methods.handleSubmit(async (values) => {
    setAlertMessage(undefined);
    let order: Order;
    try {
      const request = buildOrderRequest(lines, values);
      order = await createOrder.mutateAsync({
        request,
        idempotencyKey: idempotencyKeys.keyFor(request),
      });
    } catch (error) {
      const failure = mapOrderError(error);
      const fieldErrors = Object.entries(failure.fieldErrors) as [
        Path<CheckoutFormValues>,
        string,
      ][];
      fieldErrors.forEach(([path, message], index) => {
        methods.setError(path, { type: "server", message }, { shouldFocus: index === 0 });
      });
      setAlertMessage(failure.alert);
      return;
    }
    // The cart is cleared after the page has changed, so the checkout never shows an empty cart on
    // its way out.
    idempotencyKeys.reset();
    await navigate(`/orders/${order.id}`, { replace: true });
    clear();
  });

  const submitState = useMemo(() => ({ isSubmitting, alertMessage }), [isSubmitting, alertMessage]);

  return (
    <FormProvider {...methods}>
      <SubmitStateContext value={submitState}>
        <form noValidate onSubmit={submit}>
          {children}
        </form>
      </SubmitStateContext>
    </FormProvider>
  );
}
