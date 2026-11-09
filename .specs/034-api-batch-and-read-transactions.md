# API: batch the order lines and read the catalog in one transaction

## Scope
@apps/api/src/main/java/com/coffeedelivery/orders/infrastructure/JdbcOrderRepository.java - Insert the lines of an order in one batch
@apps/api/src/main/java/com/coffeedelivery/catalog/infrastructure/JdbcCoffeeRepository.java - Read the coffees and their tags in one read-only transaction
@apps/api/src/test/java/com/coffeedelivery - Unit and e2e tests, and a statement counter for tests
@apps/api/load/scenarios/orders-create.js, @apps/api/load/scenarios/coffees-list.js - Compare before and after
@.docs/ARCHITECTURE.md - Note the rule in the data access section

## Context
Part of: Coffee Delivery capstone.
Depends on: @.specs/010-orders-create.md, @.specs/005-catalog-list-coffees.md, @.specs/008-api-observability-and-load-tests.md
`save` inserts the order and then one row per line in a loop, so an order of 14 lines makes 15 inserts. `POST /api/v1/orders` is the slowest route: in the last load run its p95 was 488 ms against the k6 threshold of 500 ms, and its p99 1,496 ms, against a p50 of 43 ms. `GET /api/v1/coffees` reads the coffees and then the tags in two statements that take two connections, because the repository is not transactional.

## Business needs
Ordering stays fast when the cart is large, and the catalog read uses one connection.

## Acceptance Criteria
- Saving an order of N lines runs one insert for `orders` and one batch for `order_items` inside the one transaction of `save` (2 statements, not N + 1). A test with a statement counter on the data source (a JDK dynamic proxy in the test code) proves it for 1, 3, and 14 lines.
- The lines keep the order they were sent: reading the order back returns them in the same order, and `uq_order_items_order_coffee` and every other constraint still hold (the existing e2e tests pass unchanged).
- A failure of one line (for example a coffee deleted between the lookup and the save) rolls back the order and all the lines; a test proves that no row is left.
- Listing the coffees runs its two statements on one connection (`@Transactional(readOnly = true)`); a test with the counter shows one connection checked out per request, and the answer is byte for byte the same as before for the same data.
- The price lookup of `CreateOrderUseCase` stays outside the transaction of `save`.
- With the `load` profile of k6 run before and after the change on the same machine, the p95 and p99 of `POST /api/v1/orders` and of `GET /api/v1/coffees` after are not higher than before, and both sets of numbers are in the ADR.
- `yarn code:fix`, `yarn lint`, `yarn types:check`, `yarn test`, `yarn test:e2e`, and `yarn build` pass; the API coverage stays at 80% or more of lines.

## What to do
- Run the k6 `load` profile first and write the numbers down; then write the tests, then the change; then run k6 again.
- Use `JdbcTemplate.batchUpdate` for the lines.
- Keep the code in `infrastructure`; the ports and the domain do not change.

## What not to do
- Do not add a cache, an `ETag`, or a paging parameter.
- Do not move the price lookup into the transaction of `save`.
- Do not change a response body, an error, or a table.
- Do not add a library for the statement counter.

## Result
An order costs two statements however many lines it has, the catalog read uses one connection, and the numbers of the load test show it.

## Open questions
None
