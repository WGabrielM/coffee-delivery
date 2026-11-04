# Checkout: read the configuration

## Scope
@apps/api/src/main/java/com/coffeedelivery/orders/domain - New slice; `DeliveryPolicy`, `PaymentMethod`
@apps/api/src/main/java/com/coffeedelivery/orders/application - New; `GetCheckoutConfigUseCase`
@apps/api/src/main/java/com/coffeedelivery/orders/interfaces - New; `GetCheckoutConfigRequestHandler` for `GET /api/v1/checkout-config`
@apps/api/src/test/java/com/coffeedelivery/orders - New; unit and e2e tests
@apps/api/load/scenarios/checkout-config.js - New
@.docs/ARCHITECTURE.md, @.docs/BUSINESS.md - Document the checkout rules

## Context
Part of: Coffee Delivery capstone.
Depends on: @.specs/003-api-foundation.md
The design shows a fixed delivery fee, a delivery estimate of 20 to 30 minutes on the confirmation screen, and three payment methods. The product is in USD and the fee is `$3.50`. The checkout page and the order creation (spec 010) must read the same values, so they live in one domain rule on the server.

## Business needs
The app shows the delivery fee, the estimate, and the payment options without hard-coding them, and the order total uses the same values.

## Acceptance Criteria
- `GET /api/v1/checkout-config` returns `200` and exactly `{ "currency": "USD", "deliveryFeeInCents": 350, "estimatedDeliveryMinutes": { "min": 20, "max": 30 }, "paymentMethods": ["credit_card", "debit_card", "cash"] }`.
- The values come from `DeliveryPolicy` and `PaymentMethod` in the `orders` domain, and a unit test fails if the fee, the estimate, or the list of methods changes.
- The e2e test calls the real endpoint; `apps/api/load/scenarios/checkout-config.js` checks status `200` and the fee; `yarn load:smoke` reports no failed check.
- The architecture test stays green and `yarn code:fix`, `yarn lint`, `yarn types:check`, `yarn test`, `yarn test:e2e`, and `yarn build` pass.

## What to do
- Write the tests first, then the domain rule, use case, request handler, and scenario.
- Make `DeliveryPolicy` the single place for the fee and the estimate; spec 010 reuses it.

## What not to do
- Do not make the fee depend on the address, the cart, or the time.
- Do not read the values from a database table or a feature flag.
- Do not add taxes, tips, or discounts.

## Result
`GET /api/v1/checkout-config` returns the `$3.50` fee in cents, the 20 to 30 minute estimate, and the three payment methods from one domain rule.

## Open questions
None
