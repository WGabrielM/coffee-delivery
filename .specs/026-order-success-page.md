# Order: confirmation page

## Scope
@apps/app/src/pages/order-page.tsx - Replace the placeholder with the confirmation page
@apps/app/src/features/orders/api.ts - New; `useOrder` query hook
@apps/app/src/features/orders/order-confirmation - New; title, order card with gradient border, and illustration
@apps/app/src/features/orders/*.test.tsx - New
@apps/app/e2e/order-confirmation.spec.ts - New
@.docs/DESIGN.md - Document the confirmation page

## Context
Part of: Coffee Delivery capstone.
Depends on: @.specs/011-orders-get.md, @.specs/025-checkout-submit-order.md, @.specs/014-app-assets-from-figma.md
The Figma success page has the title "Uhu! Pedido confirmado" in Baloo 2 ExtraBold 32 (`#C47F17`), a subtitle in Roboto 20 (`#403937`), an order card of 526×270 (radius 6/36/6/36, 1 px gradient border from `#DBAC2C` to `#8047F8`) with three rows of a 32 px circle icon and text, and an illustration (492×293) at the right. The order is loaded from `GET /api/v1/orders/{id}`. The English copy below replaces the Portuguese copy.

## Business needs
After ordering, the customer sees that the order is confirmed, where it goes, when it should arrive, and how to pay.

## Acceptance Criteria
- For an existing order, the page has the `h1` "Uhu! Order confirmed" (Baloo 2 ExtraBold 32, `#C47F17`) and the subtitle "Now just wait and your coffee will soon be with you" (Roboto 20, `#403937`).
- The card has three rows: a purple pin row "Delivery to **<street>, <number>**" and "<neighborhood> - <city>, <state>"; a yellow timer row "Estimated delivery **<min> min - <max> min**" from `estimatedDeliveryMinutes`; and a dark-yellow money row "Payment on delivery **Credit card**", "**Debit card**", or "**Cash**" from `paymentMethod`. The `complement` is not shown.
- At 1440 px the card is 526×270 px and the illustration 492×293 px to its right, and the page content starts at the 160 px margin (bounding boxes within 2 px); the card border is a gradient from `#DBAC2C` to `#8047F8`.
- While loading, the page shows a loading state; for an unknown or malformed order id (API `404`), it shows "Order not found" with a link "Back to coffees" to `/`; for any other failure it shows "We couldn't load your order." with a "Try again" button.
- Reloading `/orders/<id>` shows the same page, and the navbar badge is empty when the cart is empty.
- Tests cover the three states and the three payment labels; an axe scan reports no violations; the illustration has an empty `alt`.
- Screenshots `success_desktop_after.png` (1440×900) and `success_not_found_desktop_after.png` are taken with the Playwright MCP and attached to the end-of-task report.
- `yarn code:fix`, `yarn lint`, `yarn types:check`, `yarn test`, `yarn test:e2e`, and `yarn build` pass.

## What to do
- Write the tests first, then the hook and the page; use the gradient with a wrapper that keeps the radius 6/36/6/36.
- Format nothing on the server; labels for payment methods come from the app's map from spec 024.

## What not to do
- Do not show prices, items, or totals on this page; the design does not.
- Do not add order tracking, a map, or a "new order" flow.
- Do not read the order from the cart or `localStorage`.
- Do not design tablet or mobile layouts; spec 027 does.

## Result
The confirmation page shows the confirmed order's address, delivery estimate, and payment method as designed, and handles missing orders and errors.

## Open questions
None
