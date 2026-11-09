# Orders: idempotent order creation

## Scope
@apps/api/src/main/resources/db/migration/V4__add_order_idempotency_key.sql - New; `idempotency_key` and `request_fingerprint` columns with a unique index
@apps/api/src/main/java/com/coffeedelivery/orders/application - `CreateOrderUseCase` and `CreateOrderCommand` carry the key; `OrderRepository` port finds an order by key
@apps/api/src/main/java/com/coffeedelivery/orders/infrastructure - `JdbcOrderRepository`: insert with `ON CONFLICT DO NOTHING` on the key, and read by key
@apps/api/src/main/java/com/coffeedelivery/orders/interfaces - `CreateOrderRequestHandler` reads the `Idempotency-Key` header and answers `200` for a replay
@apps/api/src/test/java/com/coffeedelivery/orders - Unit and e2e tests, including a parallel test
@apps/api/load/scenarios/orders-create.js - Send a key and replay it
@apps/app/src/features/checkout - The form keeps one key while the request does not change and sends it with the order
@apps/app/e2e/checkout-submit.spec.ts - A lost response and a second click create one order
@.docs/ARCHITECTURE.md, @.docs/BUSINESS.md, @.docs/CONVENTIONS.md - Document the header, the replay, and the errors

## Context
Part of: Coffee Delivery capstone.
Depends on: @.specs/025-checkout-submit-order.md, @.specs/010-orders-create.md
`POST /api/v1/orders` generates a new id for every call and `orders` has no business key. When the order is stored but the response is lost (a network error), the checkout shows "We couldn't place your order. Please try again." and enables the button, so a second click creates a second order with the same cart and address. The orders are paid on delivery, so a duplicate is a wasted trip. The health check of 2026-11-08 ranked this as the first limit that will hurt a real customer.

## Business needs
A customer who confirms the same order twice, by a second click, a retry after a network error, or a second tab, gets one order.

## Acceptance Criteria
**API**
- `POST /api/v1/orders` accepts an optional header `Idempotency-Key` that is a UUID. Without the header the endpoint behaves as before.
- With a key that has not been used, the order is created as before (`201`, `Location`), and the key and a fingerprint of the request are stored with it.
- With a key that was used with the same request, no order is created, and the answer is `200` with the same body and the same `Location` as the first answer.
- With a key that was used with a different request (a different item, quantity, address, or payment method), the answer is `422` with the code `unprocessable_content` and `fields["Idempotency-Key"]`, and nothing is stored.
- A header that is not a UUID is a `400` with the code `validation_failed` and `fields["Idempotency-Key"]`.
- The fingerprint is a SHA-256 of the request after it is validated and its text trimmed, with the items in the order sent. Two requests that differ only in surrounding spaces are the same request.
- Two requests with the same key sent at the same time create exactly one row in `orders` (a test with two threads and a barrier), and both answers have the same order id.
- The unique index on `idempotency_key` allows many orders with no key (the column is nullable).
- A request that fails validation, or is refused with `422` for a coffee that does not exist, stores nothing and does not use up its key.

**App**
- The checkout creates a key (a UUID) for the first submit and sends it as `Idempotency-Key`. After a failed submit it sends the same key again while the request it builds is the same (the same items, address, and payment method), and a new key as soon as the request is different. After a successful order the next checkout starts with a new key.
- A network error followed by a click on "Confirm order" creates one order even when the first request had been stored (a Playwright test aborts the response of the first request after the server stored the order, then clicks again, and finds one order with that key and the same order page).

**Tests and gates**
- API unit tests cover the use case for a new key, a replay, a conflict, and no key; e2e tests cover the five answers above and the parallel case; app tests cover the key kept, changed, and renewed.
- `orders-create.js` sends a key and replays it, and its checks include the `200` of the replay.
- `yarn code:fix`, `yarn lint`, `yarn types:check`, `yarn test`, `yarn test:e2e`, and `yarn build` pass.

## What to do
- Write the tests first, then the migration, the port, the use case, the handler, and the app change.
- Keep the rules of the order (totals, prices, validation) as they are: the key only decides whether to create.
- Put the replay behind the unique index, not behind a check in memory, so it holds with more than one API instance.
- Document the header, the `200`, and the two errors in `ARCHITECTURE.md`, `BUSINESS.md`, and `CONVENTIONS.md`.

## What not to do
- Do not make the header required, and do not add keys to other endpoints.
- Do not store the response body or add an expiry, a cleanup job, or a cache.
- Do not retry a request automatically; the person still decides.
- Do not change the order body or the `201` response of a new order.

## Result
Repeating an order with the same key returns the order that was created, never a second one, even when two requests arrive at the same time.

## Open questions
None
