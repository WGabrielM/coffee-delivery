import type { IconName } from "../../assets";
import { MAX_QUANTITY, MIN_QUANTITY } from "../../lib/quantity-limits";
import { Icon } from "../icon/Icon";

type CounterProps = {
  /** The accessible name of the group, for example "Quantity of Latte". */
  label: string;
  value: number;
  /** Called with the new value. The counter does not keep the value: the parent owns it. */
  onChange: (value: number) => void;
  /** `default` is 72×38 (the coffee card); `compact` is 72×32 (the cart row). */
  size?: "default" | "compact";
};

type StepProps = {
  label: string;
  icon: IconName;
  disabled: boolean;
  onClick: () => void;
};

// 24×24 is the smallest target WCAG 2.2 allows (2.5.8); the icon inside is 14 px.
// At a limit the button is `aria-disabled`, not `disabled`: a disabled button drops the keyboard
// focus, so a person who presses Enter on "Increase" up to the maximum would be thrown back to the page.
function Step({ label, icon, disabled, onClick }: StepProps) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-disabled={disabled || undefined}
      onClick={disabled ? undefined : onClick}
      className={
        "inline-flex size-6 items-center justify-center rounded-button text-purple transition-[color,background-color,border-color] motion-reduce:transition-none " +
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple " +
        "not-aria-disabled:hover:bg-hover aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
      }
    >
      <Icon name={icon} className="size-3.5" />
    </button>
  );
}

/** The quantity control of the coffee card and the cart row. */
export function Counter({ label, value, onChange, size = "default" }: CounterProps) {
  const height = size === "compact" ? "h-8" : "h-9.5";
  return (
    <fieldset
      aria-label={label}
      className={`inline-flex w-18 items-center justify-between rounded-button bg-button ${height}`}
    >
      <Step
        label="Decrease quantity"
        icon="minus-bold"
        disabled={value <= MIN_QUANTITY}
        onClick={() => onChange(value - 1)}
      />
      {/* An output is a polite live region: a screen reader hears the new quantity. */}
      <output className="type-text-regular-m text-title tabular-nums">{value}</output>
      <Step
        label="Increase quantity"
        icon="plus-bold"
        disabled={value >= MAX_QUANTITY}
        onClick={() => onChange(value + 1)}
      />
    </fieldset>
  );
}
