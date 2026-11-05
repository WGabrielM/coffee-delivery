# Plan 006: Catalog, filter coffees by tags

- Number: 006
- Created: 2026-11-04
- Spec: [.specs/006-catalog-filter-by-tags.md](../.specs/006-catalog-filter-by-tags.md)

## Concept summary

No open question. Choices made in this plan, each recorded in `adrs/catalog-filter-by-tags.md`:

1. **The rule "slugs must exist" lives in `ListCoffeesUseCase`** (`application`), as the spec asks. The port gains `findTagSlugs()` (tag slugs by position) and `findAll(Set<String>)` replaces `findAll()`; an empty set means no filter.
2. **A shared exception for validation failures**: `ValidationFailedException(fields)` in `shared.error`, mapped by `ApiExceptionHandler` to `400 validation_failed` with `fields`. It keeps "one place builds every error" (CONVENTIONS.md) and spares each slice an exception handler. A plain Java class, so `application` may use it (`shared` is not a slice).
3. **Parsing lives in `interfaces`**: the handler reads the raw `tags` values, rejects a repeated parameter (`?tags=a&tags=b`), splits the single value on commas, trims, and drops empty elements. The use case removes repeated slugs (`LinkedHashSet`).
4. **AND logic in SQL**: coffees whose id is in a sub-query that groups `coffee_tags` by coffee over the requested slugs and keeps groups with `count(*)` equal to the number of slugs. Each result is then loaded with all its tags, not only the filtered ones.
5. **Case-sensitive slugs**: `Special` is unknown, and the message lists the valid slugs.
6. **The k6 scenario also calls `?tags=special,iced`** and expects one coffee.

## Tasks

| # | Task | Test first |
| --- | --- | --- |
| 1 | `ApiExceptionHandlerTest`: `ValidationFailedException` becomes `400 validation_failed` with its fields | Does not compile, then passes |
| 2 | `ListCoffeesUseCaseTest`: single tag, AND of several, combination with no result, repeated slug, unknown slug, case sensitivity, message lists valid tags | idem |
| 3 | `ListCoffeesRequestHandlerTest`: missing and blank `tags`, comma list, spaces and empty elements, unknown tag (400), repeated parameter (400) | idem |
| 4 | `FilterCoffeesByTagsE2ETest`: the seven cases of the spec plus duplicates and order, against PostgreSQL | idem |
| 5 | Port, use case, adapter, handler, shared exception | The tests above |
| 6 | k6 scenario, docs (`ARCHITECTURE.md`) | Root tests |

## New dependencies

None.
