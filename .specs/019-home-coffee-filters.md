# Home: coffee filters

## Scope
@apps/app/src/features/catalog/coffee-filters - New; five filter chips
@apps/app/src/features/catalog/api.ts - `useCoffees` accepts the selected tags
@apps/app/src/features/catalog/coffee-list - Place the chips at the right of the title; add the filtered empty state
@apps/app/src/features/catalog/*.test.tsx - Tests for selection and requests
@apps/app/e2e/home-filters.spec.ts - New
@.docs/DESIGN.md - Document the chips and the selected state

## Context
Part of: Coffee Delivery capstone.
Depends on: @.specs/006-catalog-filter-by-tags.md, @.specs/018-home-coffee-list.md
The Figma has a hidden frame to the right of "Our coffees" where the filter chips would sit, so the visible design has no filters and no selected state. The API filters with AND logic through `?tags=` (spec 006). The chip style reuses the tag: radius 100, uppercase Tag L text (Roboto Bold 12). This spec proposes the selected look: the unselected chip has a `#DBAC2C` border with `#C47F17` text; the selected chip has a `#DBAC2C` fill with white text.

## Business needs
A visitor narrows the list to the coffees that match the tags they pick, and clears the choice easily.

## Acceptance Criteria
- Five chips appear at the right of the title, in this order: Traditional, Special, With milk, Alcoholic, Iced; each is a toggle button with `aria-pressed` and the group has the accessible name "Filter by tag".
- Selecting chips sends `GET /api/v1/coffees?tags=<slugs>` with the selected slugs in chip order and separated by commas; for example selecting Iced and then Special requests `tags=special,iced`; unselecting all chips requests the list without `tags`.
- With the API running, selecting Special shows 5 cards, Special and Iced shows 1 card (Cuban), and Traditional and Alcoholic shows the empty state (Playwright).
- When the filtered result is empty, the section shows "No coffees match the selected filters." and a "Clear filters" button that unselects every chip; the same button also appears next to the chips whenever at least one chip is selected.
- While a new filtered list loads, the previous cards stay visible, and the grid announces the result count in a polite live region ("5 coffees").
- Chips are reachable and togglable with the keyboard, and an axe scan reports no violations.
- Screenshots `home_filters_desktop_after.png` (1440×900) with no chip selected and with Special and Iced selected are taken with the Playwright MCP and attached to the end-of-task report.
- `yarn code:fix`, `yarn lint`, `yarn types:check`, `yarn test`, `yarn test:e2e`, and `yarn build` pass.

## What to do
- Write the tests first, then the chips and the extended hook; keep the five chips as a constant in the app, matching the API slugs.
- Keep the selection in component state.

## What not to do
- Do not store the selection in the URL or in `localStorage`.
- Do not filter on the client; the server filters.
- Do not add an endpoint or a request for the list of tags.
- Do not design tablet or mobile wrapping; spec 027 does.

## Result
Visitors toggle five tag chips and see the server-filtered list, with a clear empty state and a way to reset.

## Open questions
None
