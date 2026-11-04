# Checkout: order summary

## Scope
@apps/app/src/pages/checkout-page.tsx - Two-column layout and the empty-cart state
@apps/app/src/features/checkout/order-summary - New; selected coffees, totals, and the confirm button
@apps/app/src/features/checkout/api.ts - New; `useCheckoutConfig` query hook
@apps/app/src/features/checkout/*.test.tsx - New
@apps/app/e2e/checkout-summary.spec.ts - New
@.docs/DESIGN.md - Document the checkout layout and the summary card

## Context
Part of: Coffee Delivery capstone.
Depends on: @.specs/020-cart-state.md, @.specs/018-home-coffee-list.md, @.specs/007-checkout-config.md
The Figma checkout has a left column of 640 px at x=160 with the heading "Complete your order", and a right column of 448 px at x=832 with the heading "Selected coffees" and a card (radius 6/44/6/44, padding 40). Each row has the photo (64 px), the name, a compact counter (72×32), a "Remove" button (91×32), and the line price at the right; below come "Items total", "Delivery", "Total" (Roboto Bold 20), and the full-width "Confirm order" button (`#DBAC2C` fill, white text, 368×46). Rows read names and prices from the catalog query; the fee comes from `GET /api/v1/checkout-config`. The mock has a counter that disagrees with its price; this spec computes `unit price × quantity`. The address and payment cards of the left column arrive in specs 023 and 024.

## Business needs
The customer reviews the coffees in the cart, changes quantities or removes items, and sees the exact total they will pay.

## Acceptance Criteria
- With a cart of Latte × 2 and Traditional Espresso × 1, the summary lists the two coffees with their line prices ($19.80 and $9.90), "Items total" $29.70, "Delivery" $3.50, and "Total" $33.20.
- Changing a row's counter updates its line price, the totals, and the navbar badge; "Remove" deletes the row and updates the same values.
- The delivery fee comes from `deliveryFeeInCents` of the checkout config, and amounts are computed in cents and shown with `formatMoney`.
- When the cart is empty, the page shows "Your cart is empty" and a link "Browse coffees" to `/`, and shows neither the form column nor the summary.
- Lines whose coffee id is not in the catalog are removed from the cart when the catalog loads; while the catalog or the config loads the card shows a loading state, and when either fails it shows an error with a "Try again" button.
- The "Confirm order" button is disabled when the cart is empty or data is not loaded; submitting arrives in spec 025.
- At 1440 px the left column is 640 px wide at x=160, the right column is 448 px wide at x=832, and the confirm button is 368×46 (bounding boxes within 2 px).
- Tests cover the totals, counter, remove, empty, and error cases; an axe scan reports no violations.
- Screenshots `checkout_desktop_after.png` (1440×900, full page) and `checkout_empty_desktop_after.png` are taken with the Playwright MCP and attached to the end-of-task report.
- `yarn code:fix`, `yarn lint`, `yarn types:check`, `yarn test`, `yarn test:e2e`, and `yarn build` pass.

## What to do
- Write the tests first, then the page, the summary card, and the config hook; reuse `Counter`, `Button`, and the coffee query from spec 018.
- Leave the left column in place with its heading, ready for the next two specs.

## What not to do
- Do not add the address form or the payment choice; specs 023 and 024 do.
- Do not send the order; spec 025 does.
- Do not add coupons, tips, or notes.
- Do not design tablet or mobile layouts; spec 027 does.

## Result
The checkout page shows the cart as a priced summary with editable quantities and server-configured delivery fee, or a clear empty state.

## Open questions
None
