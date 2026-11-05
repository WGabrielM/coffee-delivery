# Plan 011: Orders, get an order

- Number: 011
- Created: 2026-11-04
- Spec: [.specs/011-orders-get.md](../.specs/011-orders-get.md)

## Concept summary

No open question. Choices made in this plan, each recorded in `adrs/orders-get.md`:

1. **Port.** `OrderRepository` gains `findById(UUID)` returning `Optional<Order>`. `JdbcOrderRepository.findById` reads the order and its lines in one read-only transaction (two queries; lines `ORDER BY id`, which is insertion order, spec 009) and rebuilds the `Order` from the stored snapshot. Nothing is read from the catalog, so a later price change cannot alter the answer.
2. **Use case.** `GetOrderUseCase.execute(UUID)` returns the order or throws `NotFoundException` (`404 not_found`, added in spec 010).
3. **Handler.** `GetOrderRequestHandler.handle(String id)` takes the path variable as text. An id that is not a canonical UUID is also `404 not_found`, not `400`, as the spec says: to the client such an order simply does not exist. The response is the `OrderResponse` of spec 010, so the body is identical to the `201` body (a test compares them).
4. **Round trip.** A repository end-to-end test saves an order and reads it back: the stored order equals the saved one, including the instant (the use case cuts it to microseconds) and a `null` complement.
5. **Snapshot test.** After the catalog price and name of a coffee are changed in the database, the response of an earlier order keeps its original line price, name, and totals (the test restores the catalog in a `finally`).
6. **k6 scenario** `orders-get.js`: each virtual user creates one order the first time (its setup) and then reads it on every iteration, checking `200`, the id, and the total. The request keeps one `name` tag (`/api/v1/orders/{id}`) so the results do not get one series per order. `getAndCheck` takes an optional name for that.
7. **Gate.** The API line coverage is checked in `yarn test:e2e` (at least 80%).

## Tasks

| # | Task | Test first |
| --- | --- | --- |
| 1 | `GetOrderUseCaseTest`: returns a saved order; an unknown id is `NotFoundException` | Does not compile, then passes |
| 2 | `GetOrderRequestHandlerTest` (MockMvc): the body, 404 for unknown and for non-UUID ids | idem |
| 3 | `GetOrderE2ETest`: same body as the `201`, 404s, snapshot, lines in order, payment methods and complement; `JdbcOrderRepository` round trip | Fails (404), then passes |
| 4 | Port method, adapter query, use case, handler | The tests above |
| 5 | k6 scenario `orders-get.js` | `scripts/api-scripts.test.mjs` |
| 6 | Docs: `ARCHITECTURE.md` (endpoint), `README` of the load tests | Root tests |

## New dependencies

None.
