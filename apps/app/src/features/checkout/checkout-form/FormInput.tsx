import type { ComponentProps } from "react";
import { useController, type Path } from "react-hook-form";

import { Input } from "../../../components/input/Input";
import type { CheckoutFormValues } from "./checkout-form-schema";

type FormInputProps = {
  /** The path of the value in the form, for example `address.zipCode`. */
  name: Path<CheckoutFormValues>;
  /** The accessible name, and the placeholder the design draws. */
  label: string;
  /** The width of the field in the design, as a class: `w-50`, `w-full`. */
  width: string;
  hint?: string;
  /** Turns what was typed into what is kept, for example the ZIP code mask. */
  mask?: (typed: string) => string;
  inputMode?: ComponentProps<typeof Input>["inputMode"];
  autoComplete?: string;
};

/**
 * A text field of the checkout form: the base `Input`, connected to the form by name. The message
 * of the schema shows below the field once it has been touched or the form was submitted.
 */
export function FormInput({
  name,
  label,
  width,
  hint,
  mask,
  inputMode,
  autoComplete,
}: FormInputProps) {
  const { field, fieldState } = useController<CheckoutFormValues>({ name });

  return (
    <div data-field className={width}>
      <Input
        {...field}
        value={typeof field.value === "string" ? field.value : ""}
        onChange={(event) => field.onChange(mask ? mask(event.target.value) : event.target.value)}
        label={label}
        placeholder={label}
        hint={hint}
        error={fieldState.error?.message}
        inputMode={inputMode}
        autoComplete={autoComplete}
      />
    </div>
  );
}
