import type { ReactNode } from "react";

type LabelTagProps = {
  variant?: "label";
  children: ReactNode;
};

type FilterTagProps = {
  variant: "filter";
  /** Whether the filter is on. */
  pressed: boolean;
  /** Called with the opposite of `pressed` when the chip is clicked or activated from the keyboard. */
  onPressedChange: (pressed: boolean) => void;
  children: ReactNode;
};

type TagProps = LabelTagProps | FilterTagProps;

/**
 * The coffee tag (a label on the card) and the filter chip (a toggle button above the list). The text
 * keeps its case; the uppercase look comes from the `type-tag` styles.
 */
export function Tag(props: TagProps) {
  if (props.variant === "filter") {
    const { pressed, onPressedChange, children } = props;
    return (
      <button
        type="button"
        aria-pressed={pressed}
        onClick={() => onPressedChange(!pressed)}
        className={
          "inline-flex min-h-6 items-center rounded-tag border border-yellow px-3 type-tag-l transition-[color,background-color,border-color] motion-reduce:transition-none " +
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple " +
          (pressed
            ? "bg-yellow text-white"
            : "bg-transparent text-yellow-dark hover:bg-yellow-light")
        }
      >
        {children}
      </button>
    );
  }

  return (
    <span className="inline-flex rounded-tag bg-yellow-light px-2 py-1 type-tag text-yellow-dark">
      {props.children}
    </span>
  );
}
