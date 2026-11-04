# Checkout: payment method

## Scope
@apps/app/src/features/checkout/payment-card - New; heading and three options
@apps/app/src/features/checkout/payment-methods.ts - New; labels and icons per method
@apps/app/src/features/checkout/checkout-form - Add the `paymentMethod` field and its rule
@apps/app/src/pages/checkout-page.tsx - Render the payment card under the address card
@apps/app/src/features/checkout/*.test.tsx - New
@apps/app/e2e/checkout-payment.spec.ts - New
@.docs/DESIGN.md - Document the payment card

## Context
Part of: Coffee Delivery capstone.
Depends on: @.specs/023-checkout-address-form.md
The Figma payment card has a purple `$` icon, the title "Payment", the line "Payment is made on delivery. Choose the way you want to pay", and three options of 179×51 px: credit card, debit card, and cash, with the icons `credit-card`, `bank`, and `money` in purple and uppercase labels (Roboto 12). The selected option has a `#EBE5F9` fill and a 1 px `#8047F8` border; the empty checkout frame has none selected. The available methods come from `GET /api/v1/checkout-config` (`credit_card`, `debit_card`, `cash`).

## Business needs
The customer chooses how they will pay on delivery.

## Acceptance Criteria
- The card shows one option per method returned by the config, in that order, labeled "Credit card", "Debit card", and "Cash", each 179×51 px at 1440 px (bounding boxes within 2 px), with no option selected at first.
- Clicking an option, or pressing Space or Enter on it, selects it and unselects the previous one; arrow keys move the selection; the group is a radio group named "Payment method".
- The form value of `paymentMethod` is exactly the API code of the selected option (`credit_card`, `debit_card`, or `cash`).
- Submitting without a selection shows "Choose a payment method" below the options and sets `aria-invalid` on the group.
- Tests cover selection by mouse and keyboard, the form value, and the required rule; an axe scan reports no violations.
- Screenshots `checkout_desktop_after.png` and `checkout_filled_desktop_after.png` (credit card selected) at 1440×900 are taken with the Playwright MCP and attached to the end-of-task report.
- `yarn code:fix`, `yarn lint`, `yarn types:check`, `yarn test`, `yarn test:e2e`, and `yarn build` pass.

## What to do
- Write the tests first, then the payment card, using the `SelectOption` component from spec 015 and the config hook from spec 022.
- Keep labels and icons in one map keyed by the API code, so a method returned by the API that the app does not know is ignored.

## What not to do
- Do not collect card numbers or any payment data; payment happens on delivery.
- Do not hard-code the list of methods in the card.
- Do not send the order; spec 025 does.
- Do not design tablet or mobile layouts; spec 027 does.

## Result
The checkout page has the payment card with three accessible options, and the chosen method is part of the checkout form.

## Open questions
None
