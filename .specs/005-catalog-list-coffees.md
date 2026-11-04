# Catalog: list coffees

## Scope
@apps/api/src/main/java/com/coffeedelivery/catalog/domain - New; `Coffee`, `Tag`
@apps/api/src/main/java/com/coffeedelivery/catalog/application - New; `ListCoffeesUseCase`, `CoffeeRepository` port
@apps/api/src/main/java/com/coffeedelivery/catalog/infrastructure - New; persistence adapter for `CoffeeRepository`
@apps/api/src/main/java/com/coffeedelivery/catalog/interface - New; `ListCoffeesRequestHandler` for `GET /api/v1/coffees`
@apps/api/src/test/java/com/coffeedelivery/catalog - New; unit and e2e tests
@apps/api/load/scenarios/coffees-list.js - New
@.docs/ARCHITECTURE.md - Document the endpoint and the response contract

## Context
Part of: Coffee Delivery capstone.
Depends on: @.specs/004-catalog-data-model.md
The database holds 14 coffees and 5 tags (spec 004). The home page needs the full list with prices and tags. All endpoints are public: there is no user in this product. Money is an integer in cents.

## Business needs
A visitor sees every coffee with its name, description, price, and tags, in the order the design shows.

## Acceptance Criteria
- `GET /api/v1/coffees` returns `200` and `{ "coffees": [...] }` with 14 entries, ordered by `position` (the order listed in spec 004).
- Each entry has `id` (UUID string), `slug`, `name`, `description`, `priceInCents` (`990`), and `tags`, an array of `{ "slug", "name" }` ordered by tag position (for example `cuban` returns `special`, `alcoholic`, `iced`).
- When the catalog is empty, the endpoint returns `200` and `{ "coffees": [] }` (unit test with a fake repository).
- The use case has unit tests with a fake repository, and an e2e test calls the real endpoint against Postgres.
- `apps/api/load/scenarios/coffees-list.js` checks status `200` and 14 coffees; `yarn load:smoke` reports no failed check.
- `yarn code:fix`, `yarn lint`, `yarn types:check`, `yarn test`, `yarn test:e2e`, and `yarn build` pass, and the architecture test stays green.

## What to do
- Write the tests first, then the domain types, port, use case, adapter, request handler, and the scenario.
- Keep the response mapping in the `interface` layer; the domain has no JSON or Spring types.
- Update `.docs/ARCHITECTURE.md` with the request and response example.

## What not to do
- Do not add filtering; spec 006 does.
- Do not add pagination, sorting parameters, or caching headers.
- Do not return image URLs; the app resolves photos by `slug`.
- Do not format prices on the server.

## Result
`GET /api/v1/coffees` returns the 14 coffees with prices in cents and their ordered tags, covered by unit, e2e, and load scenarios.

## Open questions
None
