# Plan 005: Catalog, list coffees

- Number: 005
- Created: 2026-11-04
- Spec: [.specs/005-catalog-list-coffees.md](../.specs/005-catalog-list-coffees.md)

## Concept summary

No open question. Choices made in this plan, each recorded in `adrs/catalog-list-coffees.md`:

1. **Slice `catalog`** with the four layers. `domain`: `Coffee` and `Tag` records (no Spring, no JSON). `application`: `ListCoffeesUseCase.execute()` and the `CoffeeRepository` port. `infrastructure`: `JdbcCoffeeRepository` with `JdbcClient` (already in `spring-boot-starter-jdbc`, so no new dependency). `interfaces`: `ListCoffeesRequestHandler.handle()` and the response records.
2. **Two queries, no N+1**: one for the coffees ordered by `position`, one for the tags of those coffees ordered by tag `position`, joined in memory.
3. **Response mapping lives in `interfaces`**: `CoffeesResponse`, `CoffeeResponse`, `TagResponse`. `id` is a UUID string; prices are integers in cents; the server sends no image and formats no money.
4. **Test doubles**: an in-memory `CoffeeRepository` in the test sources, shared by the use case test and the handler test.
5. **End-to-end tests share a small `ApiClient`** (HTTP calls against the random port) instead of repeating the helpers.
6. **k6 scenario** `coffees-list.js` checks status 200 and 14 coffees.

## Tasks

| # | Task | Test first |
| --- | --- | --- |
| 1 | `ListCoffeesUseCaseTest`: returns the repository's coffees in order; an empty catalog gives an empty list | Does not compile, then passes |
| 2 | `ListCoffeesRequestHandlerTest` (MockMvc): the JSON shape with ids, prices in cents and ordered tags; `{ "coffees": [] }` when empty | idem |
| 3 | `ListCoffeesE2ETest`: 14 coffees in position order, price 990, `cuban` tags in order, UUID ids, JSON content type | Fails (404), then passes |
| 4 | Domain, port, use case, adapter, request handler | The tests above |
| 5 | k6 scenario `coffees-list.js` and its entry in `scenarios/index.js` | `scripts/api-scripts.test.mjs` (every scenario file is listed) |
| 6 | Docs: `.docs/ARCHITECTURE.md` (endpoint, request and response example) | Root documentation tests |

## New dependencies

None.
