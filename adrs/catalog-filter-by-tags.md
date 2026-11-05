# ADR: Catalog, filter coffees by tags

- Status: Accepted and verified
- Date: 2026-11-04
- Spec: [.specs/006-catalog-filter-by-tags.md](../.specs/006-catalog-filter-by-tags.md)
- Plan: [plans/006-catalog-filter-by-tags-plan.md](../plans/006-catalog-filter-by-tags-plan.md)

## Context

The home page has five tag chips. Selecting several narrows the list to the coffees that have every selected tag, and the server resolves the filter.

## Decisions

1. **`GET /api/v1/coffees?tags=special,iced`.** One comma-separated value, AND logic, same shape and order as the unfiltered list. Each coffee in the result still carries all its tags.
2. **The rule "a slug must be a stored tag" is in `ListCoffeesUseCase`** (`application`). The port is now `findAll(Set<String> requiredTagSlugs)` (empty set = no filter) plus `findTagSlugs()`. Repeated slugs count once (`LinkedHashSet`). Slugs are case-sensitive, so `Special` is unknown.
3. **`ValidationFailedException` in `shared.error`.** The use case throws it with `fields = { "tags": "Unknown tag: hot. Use: traditional, special, ..." }` and `ApiExceptionHandler` maps it to `400 validation_failed`. Alternatives were an exception per slice with its own `@RestControllerAdvice`, or building the error in the handler; both spread error building over several places, against the rule in CONVENTIONS.md. `shared` is not a slice, so `application` may use the class without breaking `ArchitectureTest`. Spec 010 reuses it and adds `UnprocessableContentException` and `NotFoundException`.
4. **Parsing is request-shape work, so it lives in `interfaces`.** `ListCoffeesRequestHandler` reads the raw `tags` values with `@RequestParam MultiValueMap`, rejects a repeated parameter (`400`, `fields.tags`; the spec says only the comma form is supported and Spring would otherwise silently join the values), trims slugs, and ignores empty elements (`special,,iced`).
5. **AND logic in SQL**, not in memory: a sub-query over `coffee_tags` grouped by coffee, keeping groups whose `count(*)` equals the number of requested slugs. This is exact because `(coffee_id, tag_id)` is the primary key and tag slugs are unique. The index `ix_coffee_tags_tag_id` from spec 004 serves it.
6. **Tests.** The unit tests cover every rule with an in-memory repository that filters the same way (AND); `FilterCoffeesByTagsE2ETest` runs the seven cases of the spec (9, 5, 6, 2, 2, 2, 1) plus an empty combination, duplicates, order, a blank value, an unknown slug, case sensitivity, and a repeated parameter against PostgreSQL. The k6 scenario also calls `?tags=special,iced` and expects one coffee.

## Consequences

- An unknown tag is a client error, not an empty list, so a typo in the app is visible.
- The message lists the valid slugs; if tags change (new migration), the message follows because it reads the table.
- No tag list endpoint (spec 006): the app keeps its five chips as a constant.
- No new library.
