import { useState } from "react";

import { Badge } from "../../../components/badge/Badge";
import { Button } from "../../../components/button/Button";
import { Counter } from "../../../components/counter/Counter";
import { MAX_QUANTITY, MIN_QUANTITY } from "../../../lib/quantity-limits";
import { Tag } from "../../../components/tag/Tag";
import { formatMoneyParts } from "../../../lib/format-money";
import { useCart } from "../../cart/cart-context";
import type { Coffee } from "../api";
import { CoffeePhoto } from "../coffee-photo/CoffeePhoto";

// The photo is 120 px round and sits 20 px above the top edge of the card.
const photo = "-mt-5 size-30 shrink-0 rounded-round";

/**
 * A coffee of the catalog: photo, tags, name, description, and a purchase row with the price, the
 * quantity counter, and the cart button. The card is 256 by 310. The counter value belongs to the
 * card (it is not the cart): adding puts that quantity in the cart and the counter keeps its value,
 * so the visitor sees what was just added. A badge on the cart button says how many of this coffee
 * are in the cart now (nothing while there are none), so adding again is a choice and not a surprise.
 */
export function CoffeeCard({ coffee }: { coffee: Coffee }) {
  const { symbol, amount } = formatMoneyParts(coffee.priceInCents);
  const headingId = `coffee-${coffee.slug}`;
  const { add, lines } = useCart();
  const inCart = lines.find((line) => line.coffeeId === coffee.id)?.quantity ?? 0;
  const [quantity, setQuantity] = useState(MIN_QUANTITY);
  // `repeat` flips on every addition. A live region speaks a change of text, so the same words twice
  // would stay silent; a trailing no-break space makes the second one a change.
  const [announcement, setAnnouncement] = useState({ text: "", repeat: false });

  function addToCart() {
    add(coffee.id, quantity);
    const now = Math.min(inCart + quantity, MAX_QUANTITY);
    setAnnouncement((previous) => ({
      text: `Added ${quantity} × ${coffee.name} to cart. ${now} in the cart.`,
      repeat: !previous.repeat,
    }));
  }

  return (
    <article
      aria-labelledby={headingId}
      className="flex h-77.5 w-64 flex-col items-center rounded-coffee-card bg-card px-6 pb-5"
    >
      <CoffeePhoto slug={coffee.slug} name={coffee.name} size={120} className={photo} />
      <div className="mt-3 flex min-h-5 flex-wrap justify-center gap-1">
        {coffee.tags.map((tag) => (
          <Tag key={tag.slug}>{tag.name}</Tag>
        ))}
      </div>
      <h3 id={headingId} className="mt-4 text-center type-title-s text-subtitle">
        {coffee.name}
      </h3>
      <p className="mt-2 text-center type-text-regular-s text-label">{coffee.description}</p>
      <div className="mt-auto flex min-h-9.5 w-full items-center justify-between">
        <p className="flex items-baseline gap-0.5">
          <span className="type-text-regular-s text-text">{symbol}</span>
          <span className="type-subtitle-xl text-text">{amount}</span>
        </p>
        <div className="flex items-center gap-2">
          <Counter label={`Quantity of ${coffee.name}`} value={quantity} onChange={setQuantity} />
          {/* The badge sits on the corner of the button, out of the flow, so the card keeps its size. */}
          <span className="relative inline-flex">
            <Button
              variant="icon"
              icon="shopping-cart-fill"
              aria-label={`Add ${coffee.name} to cart`}
              aria-describedby={inCart > 0 ? `${headingId}-in-cart` : undefined}
              onClick={addToCart}
            />
            {inCart > 0 ? (
              <span
                data-in-cart
                aria-hidden="true"
                className="pointer-events-none absolute -top-2 -right-2"
              >
                <Badge count={inCart} />
              </span>
            ) : null}
            {inCart > 0 ? (
              <span id={`${headingId}-in-cart`} className="sr-only">
                {inCart} in the cart
              </span>
            ) : null}
          </span>
        </div>
      </div>
      <p aria-live="polite" className="sr-only">
        {announcement.text}
        {announcement.repeat ? " " : ""}
      </p>
    </article>
  );
}
