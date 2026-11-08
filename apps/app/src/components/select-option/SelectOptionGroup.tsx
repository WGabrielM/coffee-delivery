import { type KeyboardEvent, useId } from "react";

import type { IconName } from "../../assets";
import { SelectOption } from "./SelectOption";

export type SelectOptionItem<T extends string> = {
  value: T;
  label: string;
  icon: IconName;
};

type SelectOptionGroupProps<T extends string> = {
  /** The accessible name of the group, for example "Payment method". */
  label: string;
  options: readonly SelectOptionItem<T>[];
  /** The selected value, or `undefined` when nothing is selected yet. The parent owns it. */
  value: T | undefined;
  onChange: (value: T) => void;
  /** The form field name, for example `paymentMethod`. A unique name is generated when omitted. */
  name?: string;
  /** The message shown below the options. Setting it marks the group invalid (`aria-invalid`). */
  error?: string | undefined;
};

/**
 * A radio group of single-choice options (the payment methods). At most one option is selected. The
 * options are native radio buttons with one name, so the browser does the keyboard work: Tab enters
 * the group once (on the selected option, or the first when none is selected), and the arrow keys
 * move the selection and the focus, wrapping at the ends. Home and End jump to the first and last.
 * The options share one row from 640 px and stack below it.
 */
export function SelectOptionGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  name,
  error,
}: SelectOptionGroupProps<T>) {
  const generatedName = useId();
  const errorId = useId();

  // Native radios have the arrow keys but not Home and End, which the ARIA radio group pattern adds.
  function jumpToEnd(event: KeyboardEvent<HTMLFieldSetElement>) {
    if (event.key !== "Home" && event.key !== "End") return;
    if (options.length === 0) return;
    const radios = event.currentTarget.querySelectorAll<HTMLInputElement>("input[type='radio']");
    const target = event.key === "Home" ? radios[0] : radios[radios.length - 1];
    const option = event.key === "Home" ? options[0] : options[options.length - 1];
    if (!target || !option) return;
    event.preventDefault();
    target.focus();
    if (option.value !== value) onChange(option.value);
  }

  return (
    <div>
      <fieldset
        role="radiogroup"
        aria-label={label}
        aria-invalid={error === undefined ? undefined : true}
        aria-describedby={error === undefined ? undefined : errorId}
        onKeyDown={jumpToEnd}
        className="grid min-w-0 grid-cols-1 gap-3 sm:auto-cols-fr sm:grid-flow-col sm:grid-cols-none"
      >
        {options.map((option) => (
          <SelectOption
            key={option.value}
            name={name ?? generatedName}
            value={option.value}
            label={option.label}
            icon={option.icon}
            checked={option.value === value}
            onSelect={() => onChange(option.value)}
          />
        ))}
      </fieldset>
      {error === undefined ? null : (
        <p id={errorId} aria-live="polite" className="mt-1 type-text-regular-s text-error">
          {error}
        </p>
      )}
    </div>
  );
}
