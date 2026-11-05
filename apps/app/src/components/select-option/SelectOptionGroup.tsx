import { useId } from "react";

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
};

/**
 * A radio group of single-choice options (the payment methods). At most one option is selected. The
 * options are native radio buttons with one name, so the browser does the keyboard work: Tab enters
 * the group once (on the selected option, or the first when none is selected), and the arrow keys
 * move the selection and the focus, wrapping at the ends.
 */
export function SelectOptionGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  name,
}: SelectOptionGroupProps<T>) {
  const generatedName = useId();

  return (
    <fieldset
      role="radiogroup"
      aria-label={label}
      className="grid min-w-0 auto-cols-fr grid-flow-col gap-3"
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
  );
}
