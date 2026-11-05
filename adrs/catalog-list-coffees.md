# ADR: Catalog, list coffees

- Status: Accepted and verified
- Date: 2026-11-04
- Spec: [.specs/005-catalog-list-coffees.md](../.specs/005-catalog-list-coffees.md)
- Plan: [plans/005-catalog-list-coffees-plan.md](../plans/005-catalog-list-coffees-plan.md)

## Context

The home page needs every coffee with its name, description, price, and tags, in the order of the design. This is the first business slice, so its shape is the model for `orders`.

## Decisions

1. **Slice `catalog` with four layers.** `domain`: `Coffee` and `Tag` records (the price is an `int` in cents; the coffee copies its tag list). `application`: `ListCoffeesUseCase.execute()` and the `CoffeeRepository` port. `infrastructure`: `JdbcCoffeeRepository`. `interfaces`: `ListCoffeesRequestHandler.handle()` for `GET /api/v1/coffees`.
2. **`JdbcClient` for persistence.** It ships with `spring-boot-starter-jdbc`, which the project already has; no ORM and no new library. Two queries (coffees by `position`, then the tags of those coffees by tag `position`) are joined in memory, so there is no N+1 and no join that repeats the coffee columns.
3. **The response mapping lives in `interfaces`.** `CoffeesResponse`, `CoffeeResponse`, and `TagResponse` are package-private records. `id` is a UUID string, `priceInCents` an integer; the server sends no image and formats no money. An empty catalog is `{ "coffees": [] }`.
4. **Unit tests use an in-memory repository** (`InMemoryCoffeeRepository`, in the test sources) for both the use case and the handler (MockMvc standalone). The adapter and the whole wiring are covered by `ListCoffeesE2ETest` against the seeded PostgreSQL.
5. **`ApiClient`** (test sources, `com.coffeedelivery.e2e`) wraps the HTTP calls of the end-to-end tests so later specs do not repeat them.
6. **k6 scenario `coffees-list.js`** (`listCoffees`) checks status 200 and 14 coffees; it is listed in `scenarios/index.js`, so every profile runs it.

## Consequences

- No pagination or caching: the catalog is 14 rows. If it grows, the port is the place to add paging.
- Coffee ids differ between databases (spec 004). The app and the load scenarios read them from this endpoint.
- Spec 006 adds the tag filter to the same use case, port, adapter, and handler.
- No new library.
