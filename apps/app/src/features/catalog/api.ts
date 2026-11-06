import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { apiGet, type RequestOptions } from "../../api";

export interface CoffeeTag {
  slug: string;
  name: string;
}

/** A coffee as `GET /api/v1/coffees` returns it. The price is whole cents; the photo is found by `slug`. */
export interface Coffee {
  id: string;
  slug: string;
  name: string;
  description: string;
  priceInCents: number;
  /** In the order of the API (by tag position). */
  tags: CoffeeTag[];
}

interface CoffeesResponse {
  coffees: Coffee[];
}

/**
 * GET /api/v1/coffees: the catalog in the order of the API. With tags, the server keeps the coffees
 * that have all of them (`?tags=special,iced`); the app never filters by itself.
 */
export async function listCoffees(
  tags: readonly string[] = [],
  options?: RequestOptions,
): Promise<Coffee[]> {
  const query = tags.length > 0 ? `?tags=${tags.map(encodeURIComponent).join(",")}` : "";
  const { coffees } = await apiGet<CoffeesResponse>(`/coffees${query}`, options);
  return coffees;
}

const NO_TAGS: readonly string[] = [];

/**
 * The coffees that have all the given tags (all of them for an empty list). The cache key is
 * `["coffees", tags]`, so pass the tags in a stable order (the order of the chips). While the list of
 * new tags loads, the previous list stays as `data` and `isPlaceholderData` is true.
 */
export function useCoffees(tags: readonly string[] = NO_TAGS) {
  return useQuery({
    queryKey: ["coffees", tags],
    queryFn: ({ signal }) => listCoffees(tags, { signal }),
    placeholderData: keepPreviousData,
  });
}
