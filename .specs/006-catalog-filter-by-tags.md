# Catalog: filter coffees by tags

## Scope
@apps/api/src/main/java/com/coffeedelivery/catalog/application - `ListCoffeesUseCase` accepts tag slugs; the port filters
@apps/api/src/main/java/com/coffeedelivery/catalog/infrastructure - Adapter filters by tags with AND logic
@apps/api/src/main/java/com/coffeedelivery/catalog/interfaces - `ListCoffeesRequestHandler` reads and validates `tags`
@apps/api/src/test/java/com/coffeedelivery/catalog - Unit and e2e tests for the filter cases
@apps/api/load/scenarios/coffees-list.js - Add a filtered request
@.docs/ARCHITECTURE.md - Document the `tags` parameter

## Context
Part of: Coffee Delivery capstone.
Depends on: @.specs/005-catalog-list-coffees.md
The Figma has a hidden filter frame next to the "Our coffees" title; the product decision is to deliver five tag filters, selected on the home page and resolved by the server. The tag slugs are `traditional`, `special`, `with-milk`, `alcoholic`, and `iced`.

## Business needs
A visitor narrows the list to the coffees that match every tag they select.

## Acceptance Criteria
- `GET /api/v1/coffees?tags=special,iced` returns only coffees that have **all** the given tags, in the same order and shape as spec 005.
- These requests return exactly these results: `traditional` 9 coffees; `special` 5; `with-milk` 6; `alcoholic` 2; `iced` 2; `special,alcoholic` 2 (`cuban`, `irish`); `special,iced` 1 (`cuban`).
- `tags=traditional,alcoholic` returns `200` and `{ "coffees": [] }`.
- A blank `tags` value or a missing parameter returns all 14 coffees; repeated slugs in the list count once.
- An unknown slug (for example `tags=special,hot`) returns `400`, error code `validation_failed`, and `fields.tags` naming the unknown slug; slugs are case-sensitive, so `Special` is unknown.
- The k6 scenario also calls `?tags=special,iced` and checks one coffee; `yarn load:smoke` reports no failed check.
- `yarn code:fix`, `yarn lint`, `yarn types:check`, `yarn test`, `yarn test:e2e`, and `yarn build` pass.

## What to do
- Write the tests first, one per case in the list above.
- Validate the slugs against the stored tags in the use case, so the rule lives in `application`, and map the failure to the project's error shape in `interfaces`.
- Keep ordering by coffee `position`.

## What not to do
- Do not add OR logic, negation, or a full-text search.
- Do not add an endpoint to list tags; the app keeps its five chips as a constant.
- Do not accept repeated `tags` parameters; only the comma-separated form is supported.

## Result
`GET /api/v1/coffees` filters by any combination of the five tags with AND logic and rejects unknown tags with a validation error.

## Open questions
None
