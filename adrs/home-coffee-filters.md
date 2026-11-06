# ADR: Home coffee filters

- Status: Accepted and verified
- Date: 2026-11-05
- Spec: [.specs/019-home-coffee-filters.md](../.specs/019-home-coffee-filters.md)
- Plan: [plans/019-home-coffee-filters-plan.md](../plans/019-home-coffee-filters-plan.md)

## Context

A visitor narrows the home list to the coffees that have every tag they pick. The server filters (spec 006, AND logic, `?tags=a,b`). The Figma has only a hidden frame for the chips, so the visible design has no chips and no selected state; the spec proposes the look.

## Decisions

1. **The five chips are a constant** (`features/catalog/coffee-tags.ts`: Traditional, Special, With milk, Alcoholic, Iced), because the product decided against an endpoint that lists tags. A test reads the seed migration `V2__seed_catalog.sql` and compares slugs, names, and order, so the constant cannot drift from the database unnoticed. This couples an app test to an API file path; the alternative (a copy of the list inside the test) would not catch a change of the seed.
2. **The request is the same whatever the click order.** `orderTags` puts the selection in chip order, so Iced then Special asks for `tags=special,iced`. An empty selection sends no `tags` parameter.
3. **The previous cards stay while a new list loads** (`placeholderData: keepPreviousData`). The section is `aria-busy` during that time, and the grid does not flash to a spinner. The spinner shows only for the first request.
4. **The result count is announced** by a visually hidden paragraph with `aria-live="polite"` that is always in the page (a live region that appears together with its text is often not announced). It is empty while a new list loads and then says "5 coffees", "1 coffee", or "0 coffees". It is a `p` with `aria-live`, not `role="status"`, so the first-load spinner stays the only `status`.
5. **The chips are a `fieldset` with a hidden `legend`** "Filter by tag", which gives the group role and name without an ARIA role attribute (the linter prefers the native element). The chips are the `Tag` filter variant of spec 015: native toggle buttons with `aria-pressed`.
6. **"Clear filters" shows before the chips,** not after them, while at least one chip is selected. The chips are right-aligned, so a button added after them would push every chip to the left under the mouse as the visitor clicks the first one. It is a secondary `Button` (the shared component takes no `className`). In the filtered empty state a second "Clear filters" sits under the message, as the spec asks, so two buttons with that name exist at that moment.
7. **The selection is component state** of `CoffeeList`, not in the URL and not in storage, as the spec says. A reload clears it.
8. **The server filters.** The app sends the tags and shows what comes back; no client-side filtering and no extra request.
9. **The list without tags comes from the cache** when it is fresher than 30 s (the staleTime of the app's query client), so unselecting the last chip may not call the API again: the spec says it "requests the list without `tags`", and what is guaranteed is that no request carries `tags` and the whole list shows. The browser test accepts both.
10. **The chip look is the proposal of the spec,** with the owner's decision to keep the palette as close to the design as possible: idle `yellow` border and `yellow-dark` text (3.15:1 on `background`), selected `yellow` fill with white text (2.11:1). Both are in the contrast table of `DESIGN_SYSTEM.md` and stay unchanged.

## Verification

- Six QA commands pass: 356 Vitest tests (326 before, 30 new: 4 in the tag constant, 4 in the API hook, 9 in the filters, 13 in the list; the classes test now also renders a selected chip, "Clear filters", and the filtered empty state), 96 root tests, the API suite unchanged, 30 Playwright tests (22 before, 8 new in `home-filters.spec.ts`, which call the real API), strict `tsc`, and `vite build` (CSS 24.22 kB, 5.45 kB gzip, from 23.71 kB; JS 376.98 kB, 118.22 kB gzip, from 375.51 kB).
- Measured in Chromium at 1440×900 with the API running: the five chips in order at the right of the title, the last ending at x=1280 and centered on the title's line; idle chip border `rgb(219, 172, 44)`, text `rgb(196, 127, 23)`, 12 px bold, radius 100 px; selected chip fill `rgb(219, 172, 44)` with white text; Special shows 5 cards, Special plus Iced shows the Cuban only, Traditional plus Alcoholic shows the empty state with two "Clear filters" buttons, Special plus With milk shows the Hot Chocolate, the filtered grid keeps 256×310 cards from x=160, and the keyboard toggles chips with Space and Enter.
- Screenshots `screenshots/home_filters_desktop_after.png` (no chip selected) and `screenshots/home_filters_selected_desktop_after.png` (Special and Iced, with "Clear filters"), both 1440×900, taken with a Playwright script (the Playwright MCP is not loaded in this session).

## Consequences

- The page gets shorter when a filter leaves few cards, so the browser may move the scroll position up; a minimum height for the list would avoid it, but the spec does not ask for one.
- The unit tests of the tag constant read a file of `apps/api`; moving or renaming the seed migration breaks that test, which is the point.
- Chip text and the selected fill are below AA contrast (palette decision of the owner, unchanged).
- No new library.
