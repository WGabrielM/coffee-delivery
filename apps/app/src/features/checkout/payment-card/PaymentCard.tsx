import { useController } from "react-hook-form";

import { Button } from "../../../components/button/Button";
import { SelectOptionGroup } from "../../../components/select-option/SelectOptionGroup";
import { useCheckoutConfig } from "../api";
import { FormCard } from "../checkout-form/FormCard";
import type { CheckoutFormValues } from "../checkout-form/checkout-form-schema";
import { paymentOptions } from "../payment-methods";

/** The group of options, connected to the form. It shows the message of the schema after a submit. */
function PaymentOptions({ codes }: { codes: readonly string[] }) {
  const { field, fieldState } = useController<CheckoutFormValues, "paymentMethod">({
    name: "paymentMethod",
  });
  const options = paymentOptions(codes);

  if (options.length === 0) {
    return (
      <p className="type-text-regular-m text-text">No payment method is available right now.</p>
    );
  }

  // `onBlur` is not passed on: leaving the group without a choice is not an error, only a submit is.
  return (
    <SelectOptionGroup
      label="Payment method"
      name={field.name}
      options={options}
      value={field.value}
      onChange={field.onChange}
      error={fieldState.error?.message}
    />
  );
}

/**
 * The payment card: how the customer will pay on delivery. The methods come from the checkout config
 * of the server, so the card does not list them itself; the value in the form is the API code of the
 * chosen method. Nothing about the payment is collected: it is made on delivery.
 */
export function PaymentCard() {
  const config = useCheckoutConfig();

  return (
    <FormCard
      icon="currency-dollar"
      tone="purple"
      title="Payment"
      description="Payment is made on delivery. Choose the way you want to pay"
    >
      {config.data ? (
        <PaymentOptions codes={config.data.paymentMethods} />
      ) : config.isError ? (
        <div role="alert" className="flex flex-col items-start gap-4">
          <p className="type-text-regular-m text-text">We couldn't load the payment methods.</p>
          <Button variant="secondary" onClick={() => void config.refetch()}>
            Try again
          </Button>
        </div>
      ) : (
        <output className="flex items-center gap-3 type-text-regular-m text-text">
          <span
            data-spinner
            aria-hidden="true"
            className="size-6 animate-spin rounded-round border-2 border-button border-t-purple motion-reduce:animate-none"
          />
          Loading payment methods…
        </output>
      )}
    </FormCard>
  );
}
