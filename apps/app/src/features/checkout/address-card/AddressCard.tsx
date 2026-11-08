import { maskState, maskZipCode } from "../address-masks";
import { FormCard } from "../checkout-form/FormCard";
import { FormInput } from "../checkout-form/FormInput";

/**
 * The delivery address: seven fields in the sizes of the design (the card is 640 px wide with 40 px
 * of padding, so the rows are 560 px, with 12 px between columns and 16 px between rows). The
 * columns are fractions that equal the design's pixels at 560 px (200, 348, 276, 60) and shrink with
 * the card; below 640 px every field has its own row. The fields belong to the checkout form around
 * the card; this card holds no state of its own.
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,200fr)_minmax(0,348fr)] sm:gap-x-3">
          <FormInput
            name="address.zipCode"
            label="ZIP code"
            width="w-full"
            mask={maskZipCode}
            inputMode="numeric"
            autoComplete="postal-code"
          />
        </div>
        <FormInput
          name="address.street"
          label="Street"
          width="w-full"
          autoComplete="address-line1"
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,200fr)_minmax(0,348fr)] sm:gap-x-3">
          <FormInput name="address.number" label="Number" width="w-full" />
          <FormInput
            name="address.complement"
            label="Complement"
            width="w-full"
            hint="Optional"
            autoComplete="address-line2"
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,200fr)_minmax(0,276fr)_minmax(3.75rem,60fr)] sm:gap-x-3">
          <FormInput name="address.neighborhood" label="Neighborhood" width="w-full" />
          <FormInput
            name="address.city"
            label="City"
            width="w-full"
            autoComplete="address-level2"
          />
          <FormInput
            name="address.state"
            label="State"
            width="w-full"
            mask={maskState}
            autoComplete="address-level1"
          />
        </div>
      </div>
    </FormCard>
  );
}
