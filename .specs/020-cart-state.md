# Cart: state and persistence

## Scope
@apps/app/src/features/cart/cart-reducer.ts - New; pure reducer
@apps/app/src/features/cart/cart-storage.ts - New; load and save with validation
@apps/app/src/features/cart/cart-context.tsx - New; provider and `useCart`
@apps/app/src/app - Wrap the app with the cart provider
@apps/app/src/features/cart/*.test.ts - New
@.docs/ARCHITECTURE.md, @.docs/BUSINESS.md - Document the cart rules

## Context
Part of: Coffee Delivery capstone.
Depends on: @.specs/012-app-foundation.md
The cart lives in the browser: the product has no accounts and the API only receives the order at checkout. The cart keeps only `{ coffeeId, quantity }` lines; names, photos, and prices come from the catalog query, so a stored cart never shows stale prices. A coffee can be added again later and its quantity grows.

## Business needs
A visitor builds an order across pages and reloads without losing it.

## Acceptance Criteria
- `add(coffeeId, quantity)` creates a line, or adds to the existing line of that coffee; a line's quantity never exceeds `99`, and the extra is dropped.
- `setQuantity(coffeeId, quantity)` sets the quantity clamped between `1` and `99`; for a coffee not in the cart it does nothing.
- `remove(coffeeId)` deletes the line; `clear()` empties the cart.
- `totalQuantity` is the sum of all quantities (adding Latte × 2 and Traditional Espresso × 1 gives `3`), and `lines` keep insertion order.
- The cart is saved to `localStorage` under the key `coffee-delivery:cart:v1` after every change and loaded when the provider starts.
- Stored data that is not valid JSON, is not an array, or has lines with an empty `coffeeId` or a quantity that is not an integer from `1` to `99` is ignored line by line without throwing (tests with corrupt values); when `localStorage` throws, the cart still works in memory.
- The reducer and storage functions have unit tests; the provider has a test that a change survives a remount.
- `yarn code:fix`, `yarn lint`, `yarn types:check`, `yarn test`, `yarn test:e2e`, and `yarn build` pass.

## What to do
- Write the tests first, then the reducer, storage, and provider.
- Keep the reducer free of browser APIs; storage is the only code that touches `localStorage`.

## What not to do
- Do not build UI; specs 021 and 022 do.
- Do not sync the cart across tabs or devices.
- Do not store prices, names, or images in the cart.
- Do not call the API.

## Result
The app has a tested cart with add, set quantity, remove, and clear, a total quantity, and safe persistence in the browser.

## Open questions
None
