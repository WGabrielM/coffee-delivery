# App: navbar and page layout

## Scope
@apps/app/src/components/navbar - New; logo, location pill, cart link with badge
@apps/app/src/app/app-layout.tsx - New; skip link, navbar, and page outlet shared by every route
@apps/app/src/app/router.tsx - Use the layout for all routes
@apps/app/src/components/navbar/*.test.tsx - New
@apps/app/e2e/navbar.spec.ts - New
@.docs/DESIGN.md - Document the navbar and layout

## Context
Part of: Coffee Delivery capstone.
Depends on: @.specs/014-app-assets-from-figma.md, @.specs/015-app-base-components.md
The Figma navbar is 104 px high on a white background, with 160 px page margins. On the left it has the logo (a purple goblet and "Coffee Delivery"); on the right a location pill with the text "Porto Alegre, RS" (purple pin, `#EBE5F9` fill, `#4B2995` text, radius 6, 38 px high) and a 38×38 cart button (`#F1E9C9` fill, `#C47F17` cart icon) with a badge when the cart has items. The location is fixed text: the product has no geolocation. The cart state arrives in spec 020, so the navbar receives its count as a prop.

## Business needs
Every page has the brand, the location, and a way to reach the cart, where the design puts them.

## Acceptance Criteria
- Every route renders inside `AppLayout`: a "Skip to content" link as the first focusable element, the navbar, and `main` with `id="main-content"`.
- At 1440×900 the navbar is 104 px high with a white background; the logo is at the left page margin (160 px) and the cart button ends at the right page margin (a Playwright test checks the bounding boxes within 2 px).
- The logo is a link to `/` with an accessible name "Coffee Delivery, home".
- The location pill shows "Porto Alegre, RS" with the pin icon; it is not interactive.
- The cart button is a link to `/checkout`; with count `0` it shows no badge and has the accessible name "Cart, empty"; with count `3` it shows the badge "3" and the name "Cart, 3 items"; with count `1` the name is "Cart, 1 item".
- The layout passes an axe scan with no violations, and the page has one `header` landmark, one `nav` with the name "Main", and one `main`.
- Screenshots `home_desktop_after.png` and `checkout_desktop_after.png` (1440×900) are taken with the Playwright MCP and attached to the end-of-task report.
- `yarn code:fix`, `yarn lint`, `yarn types:check`, `yarn test`, `yarn test:e2e`, and `yarn build` pass.

## What to do
- Write the tests first, then the navbar and the layout.
- Keep the count as a prop with default `0`; the wiring to the cart is spec 021.
- Update `.docs/DESIGN.md` with the navbar measurements.

## What not to do
- Do not read the cart or call the API in the navbar.
- Do not add search, a user menu, a language switcher, or a changing location.
- Do not design tablet or mobile behavior; spec 027 does.

## Result
All pages share a navbar that matches the design, with an accessible cart link that shows the quantity badge when given a count.

## Open questions
None
