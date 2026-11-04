# Checkout: submit the order

## Scope
@apps/app/src/features/checkout/api.ts - Add `useCreateOrder` mutation and the order types
@apps/app/src/features/checkout/checkout-form - Submit handling, error mapping, and the alert
@apps/app/src/features/checkout/order-summary - The confirm button submits the form
@apps/app/src/features/checkout/*.test.tsx - New
@apps/app/e2e/checkout-submit.spec.ts - New
@.docs/BUSINESS.md - Document the checkout flow

## Context
Part of: Coffee Delivery capstone.
Depends on: @.specs/024-checkout-payment-select.md, @.specs/010-orders-create.md
`POST /api/v1/orders` takes `items` (coffee id and quantity), `address`, and `paymentMethod`; it answers `201` with the order, `400 validation_failed` with `fields` keyed by JSON path (such as `address.zipCode`), or `422 unprocessable_content` when a coffee no longer exists. The cart lines are the items; prices are never sent. The success page is spec 026.

## Business needs
The customer confirms the order once and arrives at the confirmation, or learns exactly what to fix.

## Acceptance Criteria
- Clicking "Confirm order" with an invalid form shows every field error, moves focus to the first invalid field, and sends no request.
- With a valid form, one `POST /api/v1/orders` is sent with the cart lines as `items`, the address, and the payment method, and with no price fields.
- While the request runs, the confirm button is disabled and has `aria-busy="true"`, so a second click sends no second request.
- On `201`, the cart is cleared (the navbar badge disappears) and the app navigates to `/orders/<id>`; the checkout page is replaced in history, so Back does not return to a submitted form.
- On `400` with `fields`, keys starting with `address.` set the matching form field errors, `paymentMethod` sets the payment error, and any other key shows the alert "Please review your order and try again."; the cart is kept.
- On `422`, the alert "Some coffees are no longer available. Please review your cart." appears and the cart is kept; on a network error or `500`, the alert "We couldn't place your order. Please try again." appears, the button is enabled again, and the form values are kept.
- The alert uses `role="alert"`; tests with a mocked API cover all outcomes above, and an axe scan reports no violations.
- With the API running, the Playwright test fills the design sample address, selects credit card, confirms, and lands on a URL matching `/orders/` followed by a UUID.
- `yarn code:fix`, `yarn lint`, `yarn types:check`, `yarn test`, `yarn test:e2e`, and `yarn build` pass.

## What to do
- Write the tests first, then the mutation, the error mapping, and the button wiring.
- Build the request from the cart state, not from the displayed prices.

## What not to do
- Do not retry failed requests automatically.
- Do not clear the cart before the server confirms.
- Do not store the order in `localStorage`; the confirmation page loads it from the API.
- Do not add payment processing or an order review step.

## Result
The customer confirms the order from the checkout; it is created on the server, the cart is cleared, and the app opens the confirmation page, with clear messages when something fails.

## Open questions
None
