# Cart: add a coffee from its card

## Scope
@apps/app/src/features/catalog/coffee-card - Add the quantity counter and the cart button to the buy row
@apps/app/src/components/navbar - Receive the count from the cart (via the layout)
@apps/app/src/app/app-layout.tsx - Pass `totalQuantity` to the navbar
@apps/app/src/features/catalog/*.test.tsx - Tests for the buy row
@apps/app/e2e/cart-add.spec.ts - New
@.docs/DESIGN.md - Document the buy row

## Context
Part of: Coffee Delivery capstone.
Depends on: @.specs/018-home-coffee-list.md, @.specs/020-cart-state.md, @.specs/016-app-navbar.md
The Figma card ends with a buy row: the price at the left, then a counter (72×38, purple plus and minus icons) and a 38×38 cart button (`#4B2995` fill, white cart icon, radius 6). The counter starts at 1. The navbar badge shows the sum of quantities in the cart. The design does not say what the counter does after adding; this spec resets it to 1.

## Business needs
A visitor picks a quantity on a coffee card, adds it to the cart, and sees the cart count grow.

## Acceptance Criteria
- Each card has a counter that starts at `1`, goes from `1` to `99`, and a button with the accessible name "Add <coffee name> to cart".
- Clicking the button adds the counter quantity of that coffee to the cart (spec 020) and resets the counter to `1`.
- Adding Latte with the counter on `2` and then Traditional Espresso on `1` makes the navbar badge show `3` and its link name "Cart, 3 items"; adding Latte again with `1` makes the badge show `4`.
- A polite live region announces each addition, for example "Added 2 × Latte to cart".
- The badge keeps its value after a page reload (the cart is persisted), and counters of different cards change independently.
- At 1440 px the buy row matches the design: counter 72×38 and cart button 38×38, with the price at the left of the row (bounding boxes checked within 2 px).
- An axe scan reports no violations.
- Screenshots `home_desktop_after.png` (1440×900, full page) and `home_cart_filled_desktop_after.png` (badge `3`) are taken with the Playwright MCP and attached to the end-of-task report.
- `yarn code:fix`, `yarn lint`, `yarn types:check`, `yarn test`, `yarn test:e2e`, and `yarn build` pass.

## What to do
- Write the tests first, then extend the card and connect the layout to the cart.
- Keep the counter value as local state of the card.

## What not to do
- Do not open the cart, a toast, or a drawer after adding.
- Do not call the API.
- Do not show the quantity already in the cart on the card.

## Result
Visitors add any quantity of a coffee from its card, and the navbar badge shows the total number of coffees in the cart, also after a reload.

## Open questions
None
