import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

// A page only chooses what to show from the route and composes features. It reads no data (no query
// client, no API client, no `api` module of a feature) and no cart state: that is the job of a
// feature (`features/orders/order-status`, `features/checkout/cart-gate`).
const FORBIDDEN: readonly [name: string, test: (specifier: string) => boolean][] = [
  ["TanStack Query", (specifier) => specifier.startsWith("@tanstack/")],
  ["the API client of src/api", (specifier) => /^[.][.]\/api(?:\/|$)/.test(specifier)],
  ["the api module of a feature", (specifier) => /features\/[a-z-]+\/api$/.test(specifier)],
  ["the cart context", (specifier) => specifier.endsWith("features/cart/cart-context")],
];

/** The names of the forbidden things a source imports, from its `import ... from "..."` lines. */
export function forbiddenImports(source: string): string[] {
  const specifiers = [...source.matchAll(/from\s+"([^"]+)"/g)].map((match) => match[1]!);
  return FORBIDDEN.filter(([, isForbidden]) => specifiers.some(isForbidden)).map(([name]) => name);
}

const pages = import.meta.dirname;
const sources = readdirSync(pages)
  .filter((file) => /[.]tsx?$/.test(file) && !/[.]test[.]tsx?$/.test(file))
  .toSorted();

describe("src/pages", () => {
  it("has the four pages", () => {
    expect(sources).toEqual([
      "CheckoutPage.tsx",
      "HomePage.tsx",
      "NotFoundPage.tsx",
      "OrderPage.tsx",
    ]);
  });

  it("imports no data or state code: a page only composes features", () => {
    const offenders = Object.fromEntries(
      sources
        .map((file) => [file, forbiddenImports(readFileSync(join(pages, file), "utf8"))] as const)
        .filter(([, found]) => found.length > 0),
    );

    expect(offenders).toEqual({});
  });

  it("would catch each kind of import it forbids", () => {
    expect(forbiddenImports('import { useQuery } from "@tanstack/react-query";')).toEqual([
      "TanStack Query",
    ]);
    expect(forbiddenImports('import { ApiError } from "../api";')).toEqual([
      "the API client of src/api",
    ]);
    expect(forbiddenImports('import { useOrder } from "../features/orders/api";')).toEqual([
      "the api module of a feature",
    ]);
    expect(forbiddenImports('import { useCart } from "../features/cart/cart-context";')).toEqual([
      "the cart context",
    ]);
  });

  it("lets a page import a feature component, the router, and the components", () => {
    expect(
      forbiddenImports(
        [
          'import { useParams } from "react-router";',
          'import { OrderStatus } from "../features/orders/order-status/OrderStatus";',
          'import { TextLink } from "../components/text-link/TextLink";',
          'import { apiary } from "../apiary/thing";',
        ].join("\n"),
      ),
    ).toEqual([]);
  });
});
