import { useEffect, useRef } from "react";

import { Button } from "../../../components/button/Button";
import { Counter } from "../../../components/counter/Counter";
import { formatMoney } from "../../../lib/format-money";
import { useCart } from "../../cart/cart-context";
import { useCoffees } from "../../catalog/api";
import { CoffeePhoto } from "../../catalog/coffee-photo/CoffeePhoto";
import { useCheckoutConfig } from "../api";
import { useSubmitState } from "../checkout-form/submit-state";
import { priceOrder, type PricedRow } from "./pricing";

type RowProps = {
  row: PricedRow;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
};

/**
 * One coffee of the cart: photo, name, counter, Remove, and the line price at the right. The row is
 * 80 px high (a 64 px photo with 8 px above and below), then 24 px, the 1 px divider, and 23 px
 * before the next row: the rows of the design are 128 px apart. The text and the controls sit 2 px
 * lower than the photo's top, as in the design.
 */
function SummaryRow({ row, onQuantityChange, onRemove }: RowProps) {
  const { coffee, quantity, lineTotalInCents } = row;
  const nameId = `summary-${coffee.slug}`;
  return (
    <li
      aria-labelledby={nameId}
      className="flex gap-3 border-b border-button px-1 pt-2 pb-8 not-first:mt-5.75 sm:gap-5"
    >
      <CoffeePhoto
        slug={coffee.slug}
        name={coffee.name}
        size={64}
        className="size-16 shrink-0 rounded-round"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-2 pt-0.5">
        <h3 id={nameId} className="type-text-regular-m text-subtitle">
          {coffee.name}
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          <Counter
            size="compact"
            label={`Quantity of ${coffee.name}`}
            value={quantity}
            onChange={onQuantityChange}
          />
          <Button
            variant="secondary"
            icon="trash"
            aria-label={`Remove ${coffee.name}`}
            onClick={onRemove}
          >
            Remove
          </Button>
        </div>
      </div>
      <p className="shrink-0 pt-0.5 type-text-bold-m text-text">{formatMoney(lineTotalInCents)}</p>
    </li>
  );
}

/** The message after a failed order. It takes the focus: the Confirm order button had it. */
function SubmitAlert({ message }: { message: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);
  return (
    <div
      role="alert"
      ref={ref}
      tabIndex={-1}
      className="mt-6 type-text-regular-m text-error focus:outline-none"
    >
      {message}
    </div>
  );
}

function Totals({
  itemsTotalInCents,
  deliveryFeeInCents,
  totalInCents,
}: {
  itemsTotalInCents: number;
  deliveryFeeInCents: number;
  totalInCents: number;
}) {
  return (
    <dl className="mt-6 flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <dt className="type-text-regular-s text-text">Items total</dt>
        <dd className="type-text-regular-m text-text">{formatMoney(itemsTotalInCents)}</dd>
      </div>
      <div className="flex items-baseline justify-between">
        <dt className="type-text-regular-s text-text">Delivery</dt>
        <dd className="type-text-regular-m text-text">{formatMoney(deliveryFeeInCents)}</dd>
      </div>
      <div className="-mt-px flex items-baseline justify-between">
        <dt className="type-text-bold-l text-subtitle">Total</dt>
        {/* An output is a polite live region: a screen reader hears the new total. */}
        <dd>
          <output className="type-text-bold-l text-subtitle">{formatMoney(totalInCents)}</output>
        </dd>
      </div>
    </dl>
  );
}

/**
 * The right column of the checkout: the coffees of the cart with their quantities, the items total,
 * the delivery fee of the server, the total, and the Confirm order button, which submits the checkout
 * form around it (it does nothing outside a form). Names and prices come from the catalog, so a line whose coffee the catalog no longer
 * has is removed from the cart once the catalog has loaded.
 */
export function OrderSummary() {
  const { lines, setQuantity, remove } = useCart();
  const catalog = useCoffees();
  const config = useCheckoutConfig();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const { isSubmitting, alertMessage } = useSubmitState();

  const coffees = catalog.data;
  const deliveryFee = config.data?.deliveryFeeInCents;

  // Only a finished request is trusted: a cached list that is being refreshed may be out of date.
  const catalogIsFresh = coffees !== undefined && !catalog.isFetching;
  useEffect(() => {
    if (!catalogIsFresh) return;
    const known = new Set(coffees.map((coffee) => coffee.id));
    for (const line of lines) if (!known.has(line.coffeeId)) remove(line.coffeeId);
  }, [catalogIsFresh, coffees, lines, remove]);

  const order =
    coffees !== undefined && deliveryFee !== undefined
      ? priceOrder(lines, coffees, deliveryFee)
      : undefined;
  const failed = order === undefined && (catalog.isError || config.isError);
  const loading = order === undefined && !failed;

  function retry() {
    if (catalog.isError) void catalog.refetch();
    if (config.isError) void config.refetch();
  }

  // The row that has the focus goes away with Remove, so the focus moves to the heading first.
  function removeRow(coffeeId: string) {
    headingRef.current?.focus();
    remove(coffeeId);
  }

  return (
    <section aria-labelledby="summary-heading" aria-busy={loading}>
      <h2
        id="summary-heading"
        ref={headingRef}
        tabIndex={-1}
        className="type-title-xs text-subtitle focus:outline-none"
      >
        Selected coffees
      </h2>
      <div className="mt-4 rounded-summary-card bg-card p-6 sm:p-10">
        {order ? (
          <>
            <ul>
              {order.rows.map((row) => (
                <SummaryRow
                  key={row.coffee.id}
                  row={row}
                  onQuantityChange={(quantity) => setQuantity(row.coffee.id, quantity)}
                  onRemove={() => removeRow(row.coffee.id)}
                />
              ))}
            </ul>
            <Totals
              itemsTotalInCents={order.itemsTotalInCents}
              deliveryFeeInCents={order.deliveryFeeInCents}
              totalInCents={order.totalInCents}
            />
          </>
        ) : failed ? (
          <div role="alert" className="flex flex-col items-start gap-4">
            <p className="type-text-regular-m text-text">We couldn't load your order.</p>
            <Button variant="secondary" onClick={retry}>
              Try again
            </Button>
          </div>
        ) : (
          <output className="flex items-center gap-3 type-text-regular-m text-text">
            <span
              data-spinner
              aria-hidden="true"
              className="size-6 animate-spin rounded-round border-2 border-button border-t-purple motion-reduce:animate-none"
            />
            Loading your order…
          </output>
        )}
        {alertMessage === undefined ? null : <SubmitAlert message={alertMessage} />}
        <div className="mt-6">
          <Button
            type="submit"
            fullWidth
            disabled={order === undefined || order.rows.length === 0 || isSubmitting}
            aria-busy={isSubmitting || undefined}
          >
            Confirm order
          </Button>
        </div>
      </div>
    </section>
  );
}
