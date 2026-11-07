import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";

import { useCart } from "../features/cart/cart-context";
import { AddressCard } from "../features/checkout/address-card/AddressCard";
import { CheckoutForm } from "../features/checkout/checkout-form/CheckoutForm";
import { PaymentCard } from "../features/checkout/payment-card/PaymentCard";
import { OrderSummary } from "../features/checkout/order-summary/OrderSummary";

/**
 * What the page shows when there is nothing to buy. `moveFocus` is true when the cart has just been
 * emptied on this page (the focused Remove button is gone), so the focus goes to the message.
 */
function EmptyCart({ moveFocus }: { moveFocus: boolean }) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (moveFocus) heading.current?.focus();
  }, [moveFocus]);

  return (
    <section aria-labelledby="empty-cart-heading" className="flex flex-col items-start gap-4 py-10">
      <h2
        id="empty-cart-heading"
        ref={heading}
        tabIndex={-1}
        className="type-title-m text-subtitle focus:outline-none"
      >
        Your cart is empty
      </h2>
      <Link
        to="/"
        className="type-button-g text-purple-dark underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple"
      >
        Browse coffees
      </Link>
    </section>
  );
}

/**
 * The checkout: the form on the left (the address card, spec 023, and the payment card, spec 024), 640 px wide at x=160, and the summary of the cart on the right, 448 px wide at x=832, at
 * 1440 px. Both columns are inside one form, so the summary's Confirm order button can submit it
 * (spec 025). An empty cart shows only a message and a link to the coffees, and no form. Tablet and
 * mobile layouts are spec 027.
 */
export function CheckoutPage() {
  const { lines } = useCart();
  const hasLines = lines.length > 0;
  // True once the page has shown a cart with coffees: an empty cart after that was emptied here.
  const [hadLines, setHadLines] = useState(hasLines);
  if (hasLines && !hadLines) setHadLines(true);

  return (
    <div className="px-page pt-10 pb-20">
      <div className="mx-auto max-w-content">
        <h1 className="sr-only">Checkout</h1>
        {hasLines ? (
          <CheckoutForm>
            <div className="grid grid-cols-[640px_448px] gap-x-8">
              <section aria-labelledby="complete-order-heading" className="flex flex-col gap-4">
                <h2 id="complete-order-heading" className="type-title-xs text-subtitle">
                  Complete your order
                </h2>
                <div className="flex flex-col gap-3">
                  <AddressCard />
                  <PaymentCard />
                </div>
              </section>
              <OrderSummary />
            </div>
          </CheckoutForm>
        ) : (
          <EmptyCart moveFocus={hadLines} />
        )}
      </div>
    </div>
  );
}
