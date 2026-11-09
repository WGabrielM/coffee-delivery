# Orders: quote the fee and the total from the server

## Scope
@apps/api/src/main/java/com/coffeedelivery/orders/domain - One rule for the totals and the fee, used by `Order.place` and by the quote
@apps/api/src/main/java/com/coffeedelivery/orders/application - New; `QuoteOrderUseCase`
@apps/api/src/main/java/com/coffeedelivery/orders/interfaces - New; `QuoteOrderRequestHandler` for `POST /api/v1/orders/quote`
@apps/api/src/test/java/com/coffeedelivery/orders - Unit and e2e tests
@apps/api/load/scenarios/orders-quote.js - New
@apps/app/src/features/checkout - `useQuote`, and the summary reads the quote
@apps/app/src/features/checkout/order-summary/pricing.ts - Removed; the server computes the totals
@apps/app/e2e - A test that the summary equals the order
@.docs/ARCHITECTURE.md, @.docs/BUSINESS.md - Document the endpoint and the rule

## Context
Part of: Coffee Delivery capstone.
Depends on: @.specs/022-checkout-summary.md, @.specs/010-orders-create.md, @.specs/007-checkout-config.md
The server computes the total of an order in `Order.place`, and the app computes it again for the summary (`pricing.ts`), with the fee read from `GET /api/v1/checkout-config`. Nothing checks that the two agree, and a fee that depends on the address (a zone, a tax) cannot be shown before the order is sent. The review of 2026-11-08 proposes a quote endpoint as the way to keep one rule.

## Business needs
The total the customer sees before confirming is the total the server will charge, and a future fee by zone needs no change in the app.

## Acceptance Criteria
**API**
- `POST /api/v1/orders/quote` accepts `{ "items": [{ "coffeeId", "quantity" }], "zipCode" }`; `zipCode` is optional and, when it is present, must match `^\d{5}-\d{3}$`. The items follow the rules of the order (at least one, a UUID, a quantity from 1 to 99, no repeated coffee).
- It answers `200` with `items` (`coffeeId`, `name`, `quantity`, `unitPriceInCents`, `lineTotalInCents`), `subtotalInCents`, `deliveryFeeInCents`, `totalInCents`, and `currency`, in the order the items were sent. It stores nothing.
- A coffee that is not in the catalog is `422` with `fields.items`; an invalid body is `400` with `fields` by JSON path, as in the order.
- The prices, the line totals, the subtotal, the fee, and the total come from the same domain code as `Order.place` (one function in `domain`), and a unit test fixes it: for the same items the quote and the placed order have the same numbers. The fee is the fixed `350` cents for every ZIP code; the ZIP code is accepted so a later rule can use it.
- Tests: unit tests of the use case and the domain rule; e2e tests for `200` with and without a ZIP code, `400`, `422`, no row written, and the quote equal to the order for the sample cart (`$29.70`, `$3.50`, `$33.20`); the k6 scenario `orders-quote.js`.

**App**
- The order summary shows the lines, the items total, the delivery fee, and the total from the quote (`useQuote(lines, zipCode)`), not from `pricing.ts`, which is removed. The quote is asked again when the cart or a valid ZIP code changes (the ZIP code is sent only when it is complete), and while it loads the previous numbers stay (no flash), with the loading and error states of the summary unchanged.
- The Confirm order button is disabled until the quote has arrived, and the quote of a cart that is changed by the counter or by Remove shows the new totals within one request.
- A Playwright test puts the sample cart in, reads the summary total, confirms an order, and finds that `totalInCents` of the created order equals it; a unit test shows that the summary and the quote agree for a change of quantity.
- The lines of the cart that the catalog no longer has are still removed (spec 022), and an unknown coffee in the quote (a `422`) does not break the summary: the summary shows its error state with "Try again".
- `yarn code:fix`, `yarn lint`, `yarn types:check`, `yarn test`, `yarn test:e2e`, and `yarn build` pass; the API coverage stays at 80% or more of lines.

## What to do
- Write the domain and the API tests first, then the endpoint, then the app tests, then the app.
- Extract the totals rule from `Order.place` without changing its results; the existing order tests must pass unchanged.
- Keep the fee in `GET /api/v1/checkout-config` as the contract says; the summary stops using it, and the payment card still reads the payment methods from it.

## What not to do
- Do not add zones, taxes, discounts, or a table; the fee stays `350` cents.
- Do not store a quote or return a quote id.
- Do not ask the quote on every keystroke of the address; only a complete ZIP code counts.
- Do not remove or change `GET /api/v1/checkout-config`.

## Result
The summary shows the numbers of the server, equal to the order that is created, and the rule of the total exists in one place.

## Open questions
None
