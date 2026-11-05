import { useQuery } from "@tanstack/react-query";

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

/** GET /api/v1/coffees: the whole catalog, in the order of the API. */
export async function listCoffees(options?: RequestOptions): Promise<Coffee[]> {
  const { coffees } = await apiGet<CoffeesResponse>("/coffees", options);
  return coffees;
}

// No tag filter yet: spec 019 passes the chosen tags as the argument of `useCoffees`.
const NO_TAGS: readonly string[] = [];

/** The coffees of the catalog. The cache key is `["coffees", tags]`. */
export function useCoffees() {
  return useQuery({
    queryKey: ["coffees", NO_TAGS],
    queryFn: ({ signal }) => listCoffees({ signal }),
  });
}
