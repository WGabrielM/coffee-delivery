import { useController } from "react-hook-form";

import { ErrorState } from "../../../components/error-state/ErrorState";
import { LoadingState } from "../../../components/loading-state/LoadingState";
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
        <ErrorState
          message="We couldn't load the payment methods."
          onRetry={() => void config.refetch()}
        />
      ) : (
        <LoadingState text="Loading payment methods…" />
      )}
    </FormCard>
  );
}
