# Plan 019: Home coffee filters

- Number: 019
- Created: 2026-11-05
- Spec: [.specs/019-home-coffee-filters.md](../.specs/019-home-coffee-filters.md)

## Concept summary

The spec has no open question, so there was no interview. The owner asked for the palette to stay as close to the design as possible, so the chips use the tokens the spec names (`yellow`, `yellow-dark`, white) and no contrast fix. Choices, each recorded in `adrs/home-coffee-filters.md`:

1. **The five chips are a constant** (`features/catalog/coffee-tags.ts`) with the slugs and names of the API; a test reads the seed migration and compares them. `orderTags` puts any selection in chip order, so the request URL is the same whatever the click order.
2. **`useCoffees(tags)`** sends `?tags=a,b` (no parameter for an empty list), uses the key `["coffees", tags]`, and keeps the previous list as `data` while the new one loads (`keepPreviousData`).
3. **`CoffeeFilters`** is a `fieldset` named "Filter by tag" with the existing `Tag` filter chip (a toggle button with `aria-pressed`). "Clear filters" shows before the chips while one is selected.
4. **The selection lives in `CoffeeList` state.** It is not in the URL and not in `localStorage`, and nothing is filtered on the client.
5. **States:** a filtered empty result says "No coffees match the selected filters." with its own "Clear filters"; an empty catalog still says "No coffees found." The section is `aria-busy` while a filtered list loads, and a persistent `aria-live="polite"` paragraph says the count.
6. **Tests** use a fake API that filters like the server (AND logic), so the chips, the URL, and the list are tested together; the browser tests run against the real API.

## Tasks

| # | Task | Test first |
| --- | --- | --- |
| 1 | `coffee-tags.test.ts`, then `coffee-tags.ts` | Fails, then passes |
| 2 | `api.test.tsx` (tags, keep previous), then `api.ts` | idem |
| 3 | `CoffeeFilters.test.tsx`, then `CoffeeFilters.tsx` | idem |
| 4 | `CoffeeList.test.tsx` (filters), then `CoffeeList.tsx` | idem |
| 5 | Classes test covers the pressed chip, Clear filters, and the filtered empty state | idem |
| 6 | `e2e/home-filters.spec.ts` (needs the API) | Fails, then passes |
| 7 | Screenshots at 1440×900, none selected and Special plus Iced | A look |
| 8 | Docs: `DESIGN.md`, `DESIGN_SYSTEM.md`, `ARCHITECTURE.md`, `QA.md` | Root tests |
| 9 | Six QA commands | Green |

## New dependencies

None.
