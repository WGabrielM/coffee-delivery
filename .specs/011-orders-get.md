# Orders: get an order

## Scope
@apps/api/src/main/java/com/coffeedelivery/orders/application - New; `GetOrderUseCase`; `OrderRepository` gains a lookup by id
@apps/api/src/main/java/com/coffeedelivery/orders/infrastructure - Adapter implements the lookup
@apps/api/src/main/java/com/coffeedelivery/orders/interfaces - New; `GetOrderRequestHandler` for `GET /api/v1/orders/{id}`
@apps/api/src/test/java/com/coffeedelivery/orders - New; unit and e2e tests
@apps/api/load/scenarios/orders-get.js - New
@.docs/ARCHITECTURE.md - Document the endpoint

## Context
Part of: Coffee Delivery capstone.
Depends on: @.specs/010-orders-create.md
After checkout the app opens the confirmation page for the new order and loads it by id. The order is a public resource addressed by an unguessable UUID, because the product has no accounts. This spec closes the orders API.

## Business needs
The customer sees the confirmed order, with the address, the estimate, and the payment method, on the confirmation page and when the page is reloaded.

## Acceptance Criteria
- `GET /api/v1/orders/{id}` for an existing order returns `200` and the same body as the `201` response of spec 010.
- An id that does not exist returns `404` and error code `not_found`; an id that is not a UUID also returns `404` and `not_found`.
- The amounts come from the stored snapshot: after the catalog price of a coffee is changed in the database, the response of an earlier order keeps its original `unitPriceInCents` and totals (e2e test).
- The scenario `apps/api/load/scenarios/orders-get.js` creates an order in its setup, reads it, and checks status `200`; `yarn load:smoke` reports no failed check.
- API line coverage is at least 80% in `yarn test:e2e`, and the architecture test stays green.
- `yarn code:fix`, `yarn lint`, `yarn types:check`, `yarn test`, `yarn test:e2e`, and `yarn build` pass.

## What to do
- Write the tests first, then the use case, adapter method, request handler, and scenario.
- Share the response mapping with the create endpoint so both return the same shape.

## What not to do
- Do not add a list of orders, search, or pagination.
- Do not add update, cancel, or delete operations.
- Do not return fields the create response does not have.

## Result
`GET /api/v1/orders/{id}` returns the stored order exactly as it was confirmed, and the API milestone meets the coverage and load gates.

## Open questions
None
