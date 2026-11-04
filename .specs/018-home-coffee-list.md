# Home: coffee list

## Scope
@apps/app/src/features/catalog/api.ts - New; `useCoffees` query hook and response types
@apps/app/src/features/catalog/coffee-card - New; card with photo, tags, name, description, and price
@apps/app/src/features/catalog/coffee-list - New; "Our coffees" title, grid, and loading, error, and empty states
@apps/app/src/pages/home-page.tsx - Render the list under the hero
@apps/app/src/features/catalog/*.test.tsx - New; component tests with a mocked API
@apps/app/e2e/home-coffees.spec.ts - New
@.docs/DESIGN.md - Document the card and grid

## Context
Part of: Coffee Delivery capstone.
Depends on: @.specs/005-catalog-list-coffees.md, @.specs/017-home-hero.md
The API returns 14 coffees with `slug`, `name`, `description`, `priceInCents`, and ordered `tags` (spec 005). The Figma card is 256×310 with radius 6/36/6/36, a 120 px round photo overlapping the top edge, centered tags (radius 100, `#F1E9C9` fill, `#C47F17` text), the name in Baloo 2 Bold 20, the description in Roboto 14 (`#8D8686`), and a price with a small "$" (Roboto 14) next to the amount (Roboto Bold 24). The grid has four columns, 32 px column gap, and 40 px row gap inside the 1120 px content width; the last row has two cards on the left. The card's counter and cart button arrive in spec 021.

## Business needs
A visitor sees every coffee, with its photo, description, tags, and price, as the design shows.

## Acceptance Criteria
- The section has the heading "Our coffees" (`h2`, Baloo 2 ExtraBold 32) and a list with one card per coffee returned by the API, in API order.
- A card shows the photo of its slug (`alt` is the coffee name), its tags as uppercase labels, the name, the description, and the price split by `formatMoneyParts` (for example "$" and "9.90").
- At 1440 px the grid has four columns: each card is 256 px wide and 310 px high, columns are 32 px apart, rows are 40 px apart, and the 14 cards fill four rows with two cards in the last one (bounding boxes checked within 2 px).
- While loading, the section shows a loading indicator and has `aria-busy="true"`; on a failed request it shows "We couldn't load the coffees." and a "Try again" button that repeats the request; when the API returns no coffees it shows "No coffees found."
- Tests cover the four states (data, loading, error with retry, empty) and an axe scan of the data state reports no violations; the list is a semantic list and each card is a list item.
- With the API running, the Playwright test finds 14 cards and the name of the first one, "Traditional Espresso".
- Screenshots `home_desktop_after.png` (1440×900, full page) are taken with the Playwright MCP, compared by eye with the Home frame, and attached to the end-of-task report.
- `yarn code:fix`, `yarn lint`, `yarn types:check`, `yarn test`, `yarn test:e2e`, and `yarn build` pass.

## What to do
- Write the tests first, then the hook, card, and list. Use the query key `["coffees", tags]` with an empty tag list now, so spec 019 only adds the argument.
- Build the card from the tokens and the Tag component; the description color is `#8D8686` (`label`).

## What not to do
- Do not add the counter, the cart button, or any cart logic; spec 021 does.
- Do not add the tag filters; spec 019 does.
- Do not add sorting, search, pagination, or lazy loading.
- Do not design tablet or mobile columns; spec 027 does.

## Result
The home page lists the 14 coffees from the API in the designed card and grid, with loading, error, and empty states.

## Open questions
None
