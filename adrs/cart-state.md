# ADR: Cart state

- Status: Accepted and verified
- Date: 2026-11-06
- Spec: [.specs/020-cart-state.md](../.specs/020-cart-state.md)
- Plan: [plans/020-cart-state-plan.md](../plans/020-cart-state-plan.md)

## Context

A visitor builds an order across pages and reloads without losing it. The product has no accounts and the API only receives the order at checkout, so the cart lives in the browser. The spec has no screen: it gives the screens of specs 021 and 022 a tested cart.

## Decisions

1. **A cart is a list of `{ coffeeId, quantity }`, nothing more.** Names, photos, and prices come from the catalog query, so a saved cart never shows a stale price, and a price tampered with in `localStorage` has nothing to change (the server also ignores prices from the client).
2. **The reducer is pure** (`cart-reducer.ts`, no browser API and no React), with the actions `add`, `setQuantity`, `remove`, and `clear`, and `MIN_QUANTITY` 1 and `MAX_QUANTITY` 99 as constants. It returns the same array when nothing changes and never changes the array it receives, so "changed" is a reference check.
3. **What the spec leaves open is decided here, and tested.** `add` caps the sum at 99 and drops the extra, also for a new line (`add(x, 150)` gives 99). `add` with a quantity below 1 or not a finite number does nothing (adding zero or a negative amount is not an add), and decimals are cut (`2.9` is `2`). `setQuantity` clamps to 1..99 as the spec says, and ignores a quantity that is not a finite number. `add` with an empty `coffeeId` does nothing, because the storage would drop that line on the next load.
4. **`cart-storage.ts` is the only code that touches `localStorage`** (key `coffee-delivery:cart:v1`). Every read and write is inside `try/catch`, and the access to `window.localStorage` is inside it too, because that access itself throws when a browser blocks site data. A failed read gives an empty cart; a failed write is silent and the cart stays in memory.
5. **Loading is strict, line by line.** Invalid JSON or a value that is not an array gives an empty cart; each line that is not an object, has an empty or non-string `coffeeId`, or a quantity that is not an integer from 1 to 99 is ignored. From a valid line only `coffeeId` and `quantity` are kept (a stored `priceInCents` or `name` never reaches the cart). A coffee that appears twice keeps its first line, because the cart and the order have one line per coffee. The alternative, adding the quantities, would invent a number the visitor never chose.
6. **The provider saves after a change, not on start.** `useReducer` with a lazy initializer loads once. An effect saves when the array is not the one that was loaded or last saved (a ref holds it), so StrictMode's double effect and an action that changes nothing do not write. A stored value that could not be read (corrupt JSON) stays untouched until the visitor changes the cart.
7. **The provider sits in `AppProviders`,** inside the query client and around the router, so every route reads the same cart. `useCart()` throws a clear error outside it. The actions keep the same identity between renders (`dispatch` wrapped in `useCallback`), so a component can depend on them without re-running its effects.
8. **No UI, no API, no sync across tabs or devices,** as the spec says. A second open tab keeps its own copy in memory and the last one to change the cart wins in storage; this is accepted for a store with no accounts.

## Verification

- Six QA commands (see the report of the task for the exact results): the new tests are 45 in `src/features/cart` (reducer 18, storage 15, provider 12) and one in `providers.test.tsx`; the suite has 402 Vitest tests (356 before); `vite build` JS is 378.99 kB (118.85 kB gzip, from 376.98 kB) and CSS unchanged at 24.22 kB.
- The tests were run red first (the three new test files failed to import the missing modules), then green.
- `src/test/setup.ts` clears `localStorage` after every test (when the test file has a DOM), so a cart never leaks between tests.

## Consequences

- No screen uses the cart yet. The card counter and the navbar badge (spec 021) and the checkout summary (spec 022) read `useCart()`.
- A line whose coffee no longer exists in the catalog stays in the cart; the screens that join lines with the catalog (specs 021 and 022) decide what to show for it.
- Two tabs do not stay in sync (a decision of the spec).
- No new library.
