import { useState } from "react";

import { coffeeImages, COFFEE_SLUGS, type CoffeeSlug } from "../../../assets";
import { Button } from "../../../components/button/Button";
import { Counter, MIN_QUANTITY } from "../../../components/counter/Counter";
import { Tag } from "../../../components/tag/Tag";
import { formatMoneyParts } from "../../../lib/format-money";
import { useCart } from "../../cart/cart-context";
import type { Coffee } from "../api";

function hasPhoto(slug: string): slug is CoffeeSlug {
  return (COFFEE_SLUGS as readonly string[]).includes(slug);
}

// The photo is 120 px round and sits 20 px above the top edge of the card.
const photo = "-mt-5 size-30 shrink-0 rounded-round";

/**
 * A coffee of the catalog: photo, tags, name, description, and a purchase row with the price, the
 * quantity counter, and the cart button. The card is 256 by 310. The counter value belongs to the
 * card (it is not the cart): adding puts that quantity in the cart and sets the counter back to 1.
 */
export function CoffeeCard({ coffee }: { coffee: Coffee }) {
  const { symbol, amount } = formatMoneyParts(coffee.priceInCents);
  const headingId = `coffee-${coffee.slug}`;
  const { add } = useCart();
  const [quantity, setQuantity] = useState(MIN_QUANTITY);
  // `repeat` flips on every addition. A live region speaks a change of text, so the same words twice
  // would stay silent; a trailing no-break space makes the second one a change.
  const [announcement, setAnnouncement] = useState({ text: "", repeat: false });

  function addToCart() {
    add(coffee.id, quantity);
    setAnnouncement((previous) => ({
      text: `Added ${quantity} × ${coffee.name} to cart`,
      repeat: !previous.repeat,
    }));
    setQuantity(MIN_QUANTITY);
  }

  return (
    <article
      aria-labelledby={headingId}
      className="flex h-77.5 w-64 flex-col items-center rounded-coffee-card bg-card px-5 pb-5"
    >
      {hasPhoto(coffee.slug) ? (
        <img
          src={coffeeImages[coffee.slug]}
          alt={coffee.name}
          width={120}
          height={120}
          className={photo}
        />
      ) : (
        <div data-photo-placeholder aria-hidden="true" className={`${photo} bg-hover`} />
      )}
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
          <Button
            variant="icon"
            icon="shopping-cart-fill"
            aria-label={`Add ${coffee.name} to cart`}
            onClick={addToCart}
          />
        </div>
      </div>
      <p aria-live="polite" className="sr-only">
        {announcement.text}
        {announcement.repeat ? " " : ""}
      </p>
    </article>
  );
}
