import { MAX_QUANTITY } from "../../lib/quantity-limits";

type BadgeProps = {
  /** The number of items. 0 (or anything that is not a positive whole number) draws nothing. */
  count: number;
};

/**
 * The 20×20 number on the cart button. It shows the maximum with a plus above it and nothing for 0. It has no label of
 * its own: the cart link names the count ("Cart, 3 items") so a screen reader hears it once.
 */
export function Badge({ count }: BadgeProps) {
  if (!Number.isInteger(count) || count < 1) return null;

  return (
    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-round bg-yellow-dark px-1 type-text-bold-s text-white tabular-nums">
      {count > MAX_QUANTITY ? `${MAX_QUANTITY}+` : count}
    </span>
  );
}
