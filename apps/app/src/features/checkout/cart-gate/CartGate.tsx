import { useEffect, useRef, useState, type ReactNode } from "react";

import { TextLink } from "../../../components/text-link/TextLink";
import { useCart } from "../../cart/cart-context";

/**
 * What the checkout shows when there is nothing to buy. `moveFocus` is true when the cart has just
 * been emptied on this page (the focused Remove button is gone), so the focus goes to the message.
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
      <TextLink to="/">Browse coffees</TextLink>
    </section>
  );
}

/**
 * Shows its children (the checkout) when the cart has coffees, and the empty cart with a link to the
 * coffees when it has none. When the last coffee is removed on this page, the focus moves to the
 * message.
 */
export function CartGate({ children }: { children: ReactNode }) {
  const { lines } = useCart();
  const hasLines = lines.length > 0;
  // True once the gate has shown a cart with coffees: an empty cart after that was emptied here.
  const [hadLines, setHadLines] = useState(hasLines);
  if (hasLines && !hadLines) setHadLines(true);

  return hasLines ? children : <EmptyCart moveFocus={hadLines} />;
}
