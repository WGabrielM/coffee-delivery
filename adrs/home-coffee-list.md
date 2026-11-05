# ADR: Home coffee list

- Status: Accepted and verified
- Date: 2026-11-05
- Spec: [.specs/018-home-coffee-list.md](../.specs/018-home-coffee-list.md)
- Plan: [plans/018-home-coffee-list-plan.md](../plans/018-home-coffee-list-plan.md)

## Context

The home page must show every coffee of the catalog, with its photo, tags, description, and price, in the card and grid of the Figma design. The data comes from `GET /api/v1/coffees` (spec 005). The counter and the cart button of the card (spec 021) and the tag filters (spec 019) are not part of this spec.

## Decisions

1. **Data layer in `features/catalog/api.ts`:** the `Coffee` types, `listCoffees` (through the typed client, so a failure is an `ApiError`), and `useCoffees`, a TanStack Query hook with the key `["coffees", tags]` and an empty tag list. Spec 019 only adds the argument. The retry rules of the app's query client apply (two retries for a network or server failure, none for a 4xx), so in the browser a failed request shows the error state after about three seconds of loading.
2. **`CoffeeCard` is an `article` named by its `h3`.** The list wraps each card in an `li`, so the list is a semantic list and each card is a list item. The heading levels follow the page: h1 (hero), h2 ("Our coffees"), h3 (coffee names).
3. **The photo's `alt` is the coffee name,** as the spec asks. A screen reader therefore hears the name twice (the image, then the heading). Marking the photo decorative would be quieter; the spec chose the name, so I kept it.
4. **A slug with no photo gets a placeholder,** an empty round `bg-hover` circle of the same size, so a coffee added to the catalog before its photo reaches the app does not break the layout or the page. `coffeeImages` is keyed by the catalog's slugs, so the check is a type guard on `COFFEE_SLUGS`.
5. **The card is `h-77.5 w-64` (310 by 256) with the purchase row pushed to the bottom** (`mt-auto`). The row already has the height of the counter (38 px), so spec 021 only adds the counter and the cart button at its right. The longest description (three lines, "Irish") fits: an e2e test checks that no card has content that overflows it.
6. **Rhythm of the section** (not in the spec, taken from the frame height): 32 px above the heading, 54 px between the heading and the first row, 154 px below the last row. The full page is 2294 px high at 1440 px, and the Figma frame is 2293.
7. **States.** Loading is an `output` (role `status`) with a spinner and "Loading coffees…", the section has `aria-busy="true"`, and the spinner stops under `prefers-reduced-motion`. Error is a `role="alert"` block with "We couldn't load the coffees." and a "Try again" button (`refetch`; the section shows loading again while it runs). Empty is "No coffees found." The heading stays visible in all of them.
8. **Tests fake the network, not the hook.** `src/test/coffees.tsx` has the sample coffees, a fake `fetch`, and a render with a query client without retry, so the hook, the typed client, and the components run together. The route tests use it too, because the home page now reads the API.
9. **The hero e2e tests look only inside the hero** (the section that holds the h1). Before, they looked at `main`, which now also holds the list: the `label` color of the descriptions (3.19:1 on `card`) made the browser contrast check fail on a pair that belongs to the open palette question, not to the hero.

## Verification

- Six QA commands pass: 326 Vitest tests (294 before, 32 new: 5 in the API hook, 11 in the card, 15 in the list, 1 in the routes), the root and API suites unchanged, 22 Playwright tests (16 before, 6 new in `home-coffees.spec.ts`, which call the real API), strict `tsc`, and `vite build` (CSS 23.71 kB, 5.35 kB gzip, from 22.37 kB; JS 375.51 kB, 117.81 kB gzip, from 360.71 kB).
- Measured in Chromium at 1440×900 with the API running: 14 cards, the first named "Traditional Espresso"; each card 256×310; columns at x = 160, 448, 736, 1024; 40 px between rows; rows of 4, 4, 4, and 2; the photo 120×120, centered, 20 px above the card; the h2 Baloo 2 800 32 px `rgb(64, 57, 55)`, the name Baloo 2 700 20 px, the description Roboto 400 14 px `rgb(141, 134, 134)`, the amount Roboto 700 24 px `rgb(87, 79, 77)`, the symbol 14 px; no overflow in any card and no horizontal scroll.
- Screenshot `screenshots/home_desktop_after.png` (full page, 1440×2294), taken with a Playwright script and compared by eye with the Home frame's description and measures in `docs/design/figma-analysis.md`. The PDF of the design cannot be rendered here, so there is no side-by-side comparison; spec 029 does the parity pass.

## Consequences

- The e2e tests of the list need the API running (`yarn infra:up`, `yarn api:dev`). The CI spec (030) must start it.
- The description color is below AA on the card (3.19:1); it is recorded in the contrast table and left unchanged, as the owner asked to keep the design.
- A first request that fails keeps the section in the loading state for about three seconds (two retries) before the error shows.
- The names are read twice by a screen reader (decision 3).
