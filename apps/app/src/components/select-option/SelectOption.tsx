import type { IconName } from "../../assets";
import { Icon } from "../icon/Icon";

type SelectOptionProps = {
  label: string;
  icon: IconName;
  /** The name shared by the options of one group, so the browser treats them as one radio group. */
  name: string;
  value: string;
  checked: boolean;
  onSelect: () => void;
};

/**
 * One choice of a group, such as a payment method: a native radio button inside a label drawn as the
 * option of the design. Use it through `SelectOptionGroup`, which owns the selection. The browser
 * gives the radio its keyboard behavior (one tab stop, arrow keys that move the selection and wrap).
 */
export function SelectOption({ label, icon, name, value, checked, onSelect }: SelectOptionProps) {
  return (
    <label
      className={
        "relative flex h-12.75 w-full cursor-pointer items-center gap-3 rounded-button border px-4 type-button-s text-text transition-[color,background-color,border-color] motion-reduce:transition-none " +
        "has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-purple " +
        (checked ? "border-purple bg-purple-light" : "border-button bg-button hover:bg-hover")
      }
    >
      {/* Visually hidden, not display:none, so it keeps the focus and the screen reader role. */}
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        aria-checked={checked}
        onChange={onSelect}
        className="sr-only"
      />
      <Icon name={icon} className="size-4 text-purple" />
      <span>{label}</span>
    </label>
  );
}
