/**
 * The five tags of the catalog, in the order of the chips (the order of the API's tags). The app
 * keeps them as a constant, because the product decided not to add an endpoint that lists tags; a
 * test checks that this list is the one of the catalog seed.
 */
export const COFFEE_TAGS = [
  { slug: "traditional", name: "Traditional" },
  { slug: "special", name: "Special" },
  { slug: "with-milk", name: "With milk" },
  { slug: "alcoholic", name: "Alcoholic" },
  { slug: "iced", name: "Iced" },
] as const;

/** The slugs in the order of the chips, each once; a slug that is not a chip is dropped. */
export function orderTags(slugs: readonly string[]): string[] {
  return COFFEE_TAGS.map((tag): string => tag.slug).filter((slug) => slugs.includes(slug));
}
