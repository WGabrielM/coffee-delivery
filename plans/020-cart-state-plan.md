# Plan 020: Cart state

- Number: 020
- Created: 2026-11-06
- Spec: [.specs/020-cart-state.md](../.specs/020-cart-state.md)

## Concept summary

The spec has no open question, so there was no interview. It has no UI and calls no API. The cart is `CartLine[]` (`{ coffeeId, quantity }`) in three small files. Where the spec is silent, the choices are below, each recorded in `adrs/cart-state.md`:

1. **The reducer is pure** (`cart-reducer.ts`, no browser API, no React). Actions: `add`, `setQuantity`, `remove`, `clear`. It returns the same array when nothing changes, so the provider can tell "no change" from "changed" by reference. `MAX_QUANTITY` (99) and `MIN_QUANTITY` (1) are exported constants, the rules of `BUSINESS.md`.
2. **Quantities are validated by one function.** A quantity that is not a finite number is ignored; otherwise it is cut to a whole number (`2.9` becomes `2`). `add` ignores a quantity below `1` (adding nothing or a negative amount is not an add); `setQuantity` clamps it between `1` and `99` as the spec says; `add` caps the sum at `99`. An empty `coffeeId` is ignored by `add`, because the storage would drop such a line on the next load.
3. **Storage is the only code that touches `localStorage`** (`cart-storage.ts`): `loadCart` and `saveCart` under the key `coffee-delivery:cart:v1`. Even reading `window.localStorage` can throw (blocked cookies), so both functions catch everything. `loadCart` ignores invalid JSON, a value that is not an array, and each invalid line, and keeps only `coffeeId` and `quantity` of a valid line (a stored price or name would never reach the cart). A coffee that appears twice keeps its first line (the cart has one line per coffee).
4. **The provider** (`cart-context.tsx`) loads once (`useReducer` with a lazy initializer) and saves after a change. It does not write on mount (a corrupt value is not overwritten until the visitor changes the cart) and a ref makes the save idempotent under StrictMode. `useCart()` returns `{ lines, totalQuantity, add, setQuantity, remove, clear }` and throws outside the provider.
5. **`AppProviders` wraps the router with `CartProvider`**, inside the query client.

## Tasks

| # | Task | Test first |
| --- | --- | --- |
| 1 | `cart-reducer.test.ts`, then `cart-reducer.ts` | Fails, then passes |
| 2 | `cart-storage.test.ts` (corrupt values, throwing storage), then `cart-storage.ts` | idem |
| 3 | `cart-context.test.tsx` (survives a remount, throwing storage, outside provider), then `cart-context.tsx` | idem |
| 4 | `providers.test.tsx` (the provider is there), then `providers.tsx` | idem |
| 5 | A shared `afterEach` clears `localStorage` in `src/test/setup.ts` | Suite stays isolated |
| 6 | Docs: `ARCHITECTURE.md`, `BUSINESS.md`, `QA.md` | Root tests |
| 7 | Six QA commands | Green |

## New dependencies

None.
