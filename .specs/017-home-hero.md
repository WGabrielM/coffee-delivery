# Home: hero section

## Scope
@apps/app/src/features/home/hero - New; `Hero` with title, subtitle, four benefits, and the cup image
@apps/app/src/pages/home-page.tsx - Render the hero
@apps/app/src/features/home/hero/*.test.tsx - New
@apps/app/e2e/home-hero.spec.ts - New
@.docs/DESIGN.md - Document the hero measurements

## Context
Part of: Coffee Delivery capstone.
Depends on: @.specs/016-app-navbar.md
The Figma hero sits under the navbar with soft, blurred yellow and purple shapes in the background. The intro column is 544 px wide: a title in Title XL (`#272221`), a subtitle in Roboto 20 (`#403937`), and four benefits in a 2×2 grid, each with a 32 px circle and a white icon. The cup image (476×360) is on the right. The Portuguese copy is replaced by the English copy below.

## Business needs
A visitor understands what Coffee Delivery offers within the first screen, as the design shows.

## Acceptance Criteria
- The home page has one `h1` with the text "Find the perfect coffee for any time of day" in Baloo 2 ExtraBold 48 px, color `#272221`.
- The subtitle reads "With Coffee Delivery you get your coffee wherever you are, at any time" in Roboto 20 px, color `#403937`.
- Four benefits appear in a 2×2 grid, in this order, each with a 32 px circle: "Simple and secure purchase" (cart icon, `#C47F17`), "Packaging keeps the coffee intact" (package icon, `#574F4D`), "Fast and tracked delivery" (timer icon, `#DBAC2C`), and "Your coffee arrives fresh to you" (coffee icon, `#8047F8`); the icons are decorative (`aria-hidden`).
- At 1440×900 the intro column is 544 px wide, the cup image is 476×360 px and sits to the right of the intro, and the hero content starts at the 160 px page margin (bounding boxes checked within 2 px).
- The background shapes are drawn by styles, not by images, with `#EBC136` and purple-light tones, and do not reduce the contrast of any text (axe reports no color-contrast violation).
- Screenshots `home_desktop_after.png` (1440×900) are taken with the Playwright MCP, compared by eye with the Home frame of the design, and attached to the end-of-task report.
- `yarn code:fix`, `yarn lint`, `yarn types:check`, `yarn test`, `yarn test:e2e`, and `yarn build` pass.

## What to do
- Write the tests first, then the hero, using the tokens, icons, and hero image from specs 013 and 014.
- Give the cup image an empty `alt`, because the benefits already carry the meaning.

## What not to do
- Do not add the coffee list or the filters; specs 018 and 019 do.
- Do not add buttons, links, or animations to the hero.
- Do not design tablet or mobile behavior; spec 027 does.

## Result
The home page opens with the hero as designed: title, subtitle, four benefits, and the cup image over soft colored shapes.

## Open questions
None
