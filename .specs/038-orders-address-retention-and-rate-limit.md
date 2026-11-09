# Orders: address retention and a rate limit

## Scope
@apps/api/src/main/resources/db/migration/V5__allow_cleared_order_addresses.sql - New; address columns may be null once cleared, with `address_cleared_at`
@apps/api/src/main/java/com/coffeedelivery/orders/domain - `Order` has an optional address
@apps/api/src/main/java/com/coffeedelivery/orders/application - New; `ClearOldAddressesUseCase` and its port
@apps/api/src/main/java/com/coffeedelivery/orders/infrastructure - The scheduled job and the SQL that clears
@apps/api/src/main/java/com/coffeedelivery/orders/interfaces - `OrderResponse` has `address: null` for a cleared order
@apps/api/src/main/resources/application.yaml, @.env.example - `orders.retention.days` and the schedule
@apps/api/src/test/java/com/coffeedelivery/orders - Unit and e2e tests
@apps/app/src/features/orders, @apps/app/src/features/checkout - The confirmation of a cleared order, and the `429` message
@apps/app/nginx.conf - The rate limit on `POST /api/v1/orders`
@apps/api/load/scenarios - A spike check of the limit
@.docs/BUSINESS.md, @.docs/ARCHITECTURE.md, @.docs/CONVENTIONS.md - Document the rule, the response, and the limit

## Context
Part of: Coffee Delivery capstone.
Depends on: @.specs/037-packaging-and-backup.md, @.specs/026-order-success-page.md
Every order keeps the address of the customer for ever, and `GET /api/v1/orders/{id}` shows it to anyone who has the id. An order is paid on delivery, so the address has no use after the order has been delivered and the days of a complaint have passed. The endpoint that creates orders has no limit, so a script can fill the table. The health check of 2026-11-08 proposes a retention rule and a limit at the proxy.

## Business needs
The product does not keep addresses longer than it needs them, and one client cannot fill the database with orders.

## Acceptance Criteria
**Retention**
- An order older than `orders.retention.days` (90 by default, set in the environment as `ORDERS_RETENTION_DAYS`, a whole number of at least 1) has its address cleared: `zip_code`, `street`, `number`, `complement`, `neighborhood`, `city`, and `state` become null and `address_cleared_at` has the time of the clearing. The items, the totals, the payment method, and the dates stay.
- The migration lets those seven columns be null only when `address_cleared_at` is not null (a check), and every other rule of the address (the state is two capitals, and so on) holds for an order that has an address. The existing orders are not changed.
- A scheduled job runs every day at 03:00 (`orders.retention.cron`) and clears the orders that are due and not yet cleared, in one statement; it uses the injected `Clock`, runs on one instance at a time (the `UPDATE ... WHERE address_cleared_at IS NULL` makes a second run do nothing), and records the number it cleared in a metric `orders.addresses.cleared` and in a log line with no address data.
- `GET /api/v1/orders/{id}` of a cleared order answers `200` with `address: null` and every other field as before.
- The confirmation page of a cleared order shows the title, the estimate, and the payment as before, and in place of the address row the text "The address was removed after 90 days." (the number is the configured one).
- Tests: the use case with a fake clock (an order of 89 days is kept and one of 91 is cleared, the same order is not cleared twice), the job with an e2e test that ages an order in the database, the `GET` of a cleared order, the check of the migration, and the page.

**Rate limit**
- The proxy of the app image (spec 037) limits `POST /api/v1/orders` to 10 requests per minute for each client address, with a burst of 5, and answers `429` with the usual error body (`code: "too_many_requests"`) when it is exceeded; other paths are not limited. The limit is set in `nginx.conf` with its numbers in one place.
- The checkout shows "Too many orders were sent. Please wait a minute and try again." (an alert, the cart and the form kept) for a `429`, and the message is covered by a unit test.
- A k6 `spike` scenario against the packaged app shows `429` answers and a number of new orders that is not higher than the limit allows; the numbers are in the ADR.
- `yarn code:fix`, `yarn lint`, `yarn types:check`, `yarn test`, `yarn test:e2e`, and `yarn build` pass; the API coverage stays at 80% or more of lines.

## What to do
- Write the tests first. Run the k6 scenario against `yarn docker:up` once the limit is in place.
- Keep the days and the schedule in the settings, never in the code.
- Document the rule in `BUSINESS.md`: addresses are removed after 90 days.

## What not to do
- Do not delete orders, items, or totals.
- Do not add accounts, tokens, or a limit in the API process (a limit in memory does not hold with more than one instance).
- Do not limit the other endpoints or the development proxy of Vite.
- Do not add a queue, a lock table, or a scheduler library; use the scheduling of Spring.

## Result
Addresses are cleared 90 days after the order, the confirmation says so, and the proxy refuses more than 10 orders a minute from one client.

## Open questions
None
