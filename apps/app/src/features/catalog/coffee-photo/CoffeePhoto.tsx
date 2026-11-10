import { coffeeImages, COFFEE_SLUGS, type CoffeeSlug } from "../../../assets";

function hasPhoto(slug: string): slug is CoffeeSlug {
  return (COFFEE_SLUGS as readonly string[]).includes(slug);
}

type CoffeePhotoProps = {
  slug: string;
  /** The alt text of the photo. */
  name: string;
  /** The side of the square in px, set as `width` and `height` so the page does not jump. */
  size: number;
  /** The size and shape classes of the place that shows it (a round 120 px photo, a 64 px one). */
  className: string;
};

/**
 * The round photo of a coffee. A coffee the app has no photo for (a new one in the catalog) keeps
 * its place with an empty round placeholder, so the layout does not break. The photo is lazy and
 * decoded off the main thread: the first screen never waits for the cards below it, and the size
 * attributes keep the place, so nothing jumps when it loads.
 */
export function CoffeePhoto({ slug, name, size, className }: CoffeePhotoProps) {
  if (!hasPhoto(slug)) {
    return <div data-photo-placeholder aria-hidden="true" className={`${className} bg-hover`} />;
  }
  return (
    <img
      src={coffeeImages[slug]}
      alt={name}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      className={className}
    />
  );
}
