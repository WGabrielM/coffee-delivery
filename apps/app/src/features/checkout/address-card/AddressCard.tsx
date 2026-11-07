import { maskState, maskZipCode } from "../address-masks";
import { FormCard } from "../checkout-form/FormCard";
import { FormInput } from "../checkout-form/FormInput";

/**
 * The delivery address: seven fields in the sizes of the design (the card is 640 px wide with 40 px
 * of padding, so the rows are 560 px, with 12 px between columns and 16 px between rows). The fields
 * belong to the checkout form around the card; this card holds no state of its own.
 */
export function AddressCard() {
  return (
    <FormCard
      icon="map-pin-line"
      tone="yellow"
      title="Delivery address"
      description="Enter the address where you want to receive your order"
    >
      <div className="flex flex-col gap-4">
        <FormInput
          name="address.zipCode"
          label="ZIP code"
          width="w-50"
          mask={maskZipCode}
          inputMode="numeric"
          autoComplete="postal-code"
        />
        <FormInput
          name="address.street"
          label="Street"
          width="w-full"
          autoComplete="address-line1"
        />
        <div className="flex gap-3">
          <FormInput name="address.number" label="Number" width="w-50" />
          <FormInput
            name="address.complement"
            label="Complement"
            width="w-87"
            hint="Optional"
            autoComplete="address-line2"
          />
        </div>
        <div className="flex gap-3">
          <FormInput name="address.neighborhood" label="Neighborhood" width="w-50" />
          <FormInput name="address.city" label="City" width="w-69" autoComplete="address-level2" />
          <FormInput
            name="address.state"
            label="State"
            width="w-15"
            mask={maskState}
            autoComplete="address-level1"
          />
        </div>
      </div>
    </FormCard>
  );
}
