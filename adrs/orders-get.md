# ADR: Orders, get an order

- Status: Accepted and verified
- Date: 2026-11-04
- Spec: [.specs/011-orders-get.md](../.specs/011-orders-get.md)
- Plan: [plans/011-orders-get-plan.md](../plans/011-orders-get-plan.md)

## Context

After checkout the app opens the confirmation page and loads the order by id, also when the page is reloaded. The order is a public resource addressed by an unguessable UUID, because the product has no accounts. This spec closes the orders API.

## Decisions

1. **`OrderRepository.findById`** returns `Optional<Order>`. `JdbcOrderRepository` reads the order row and its lines in one read-only transaction (two queries, lines `ORDER BY id`, which is creation order) and builds the `Order` from the stored snapshot. It never reads the catalog, so a price or name change after the sale cannot alter the answer (end-to-end test).
2. **`GetOrderUseCase`** returns the order or throws `NotFoundException` (`404 not_found`, from spec 010).
3. **An id that is not a UUID is `404 not_found`**, not `400`, as the spec says: to the client no such order exists. `GetOrderRequestHandler` takes the path variable as text and parses it with the new `UuidText` helper, which accepts only the canonical 8-4-4-4-12 form in any case (`UUID.fromString` also accepts short forms such as `1-1-1-1-1`). `CreateOrderRequestValidator` uses the same helper, which removed a duplicated regular expression.
4. **One response mapping.** `OrderResponse` is shared with the create endpoint, and an end-to-end test checks that the `GET` body equals the `201` body field by field, including `createdAt` (cut to microseconds when the order is created).
5. **Round trip test.** A repository test saves an order for each payment method and expects `findById` to return an equal `Order`, with a `null` complement, the exact instant, and the lines in order.
6. **k6 scenario `orders-get.js`.** Each virtual user creates one order the first time it runs (its setup) and reads it on every iteration, checking `200`, the id, and a total of 3320. Results are grouped under `/api/v1/orders/{id}`; `getAndCheck` takes an optional name for this and uses it in the check label, so the id does not create one series or one check per user.

## Consequences

- Anyone who has an order id can read the order. This is accepted by the spec: there are no accounts, and UUIDs are not guessable.
- Reads are fast and unauthenticated; no caching headers were added.
- With this spec the API milestone meets its gates: all six QA commands pass and the line coverage of `yarn test:e2e` is 99% (the minimum is 80%).
- No new library.
