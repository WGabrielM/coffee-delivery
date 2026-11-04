# App: design tokens, fonts, and money format

## Scope
@apps/app/package.json - Add Tailwind CSS and the self-hosted font packages
@apps/app/src/styles - New; theme with the Figma tokens and base styles
@apps/app/src/lib/format-money.ts - New; `formatMoney` and `formatMoneyParts`
@apps/app/src/lib/format-money.test.ts - New
@apps/app/e2e/design-tokens.spec.ts - New
@.docs/DESIGN.md - Fill with typography, spacing, radii, and layout rules
@.docs/DESIGN_SYSTEM.md - Fill with the token tables

## Context
Part of: Coffee Delivery capstone.
Depends on: @.specs/012-app-foundation.md
The validated tokens are in `docs/design/figma-analysis.md` section 4: 16 brand and base colors, two font families (Roboto and Baloo 2), 13 text styles, a 160 px page margin, and fixed radii; the design has no shadows. The product shows prices in USD, with the symbol small next to a large amount.

## Business needs
Every screen is built from one set of design values, so the app matches the design and stays consistent as it grows.

## Acceptance Criteria
**Colors**
- The theme defines these colors with exactly these values: white `#FFFFFF`, background `#FAFAFA`, card `#F3F2F2`, input `#EDEDED`, button `#E6E5E5`, hover `#D7D5D5`, label `#8D8686`, text `#574F4D`, subtitle `#403937`, title `#272221`, purple-light `#EBE5F9`, purple `#8047F8`, purple-dark `#4B2995`, yellow-light `#F1E9C9`, yellow `#DBAC2C`, yellow-dark `#C47F17`, plus `hero-blob` `#EBC136` and error `#CC2937`; a unit test asserts every value.
- The page background is `#FAFAFA` and the default text color is `#574F4D` (Playwright asserts the computed styles of `body`).

**Typography**
- The theme defines the 13 text styles of the design (Title XL, L, M, S, XS; Text Regular L, M, S; Text Bold L, M, S; Subtitle XL; and the button, tag, and tag-large styles listed in the analysis) with family, weight, size, line height, and case; a unit test asserts them.
- Roboto (400 and 700) and Baloo 2 (700 and 800) are served from the app bundle; a Playwright test records the requests of the home page and finds none to a font host outside the app origin.

**Money**
- `formatMoney(990)` returns `$9.90`, `formatMoney(3320)` returns `$33.20`, `formatMoney(0)` returns `$0.00`, and `formatMoney(123456)` returns `$1,234.56`, using `Intl.NumberFormat` with `en-US` and `USD`.
- `formatMoneyParts(990)` returns `{ symbol: "$", amount: "9.90" }`, so a price can show the small symbol and the large amount separately.

**Docs and gates**
- `.docs/DESIGN_SYSTEM.md` lists every token with its Figma name and value, and `.docs/DESIGN.md` records the margin (160 px), navbar height (104 px), radii, border widths, and the rule that the design has no shadows.
- `yarn code:fix`, `yarn lint`, `yarn types:check`, `yarn test`, `yarn test:e2e`, and `yarn build` pass.

## What to do
- Write the tests first, then the theme, the font setup, and the formatters.
- Map the tokens to Tailwind theme values by their Figma names; components never use hex literals.
- Verify the current Tailwind major version and its setup for Vite before installing.

## What not to do
- Do not add dark mode or a theme switcher.
- Do not add shadcn or any component library.
- Do not build components or pages; specs 015 onward do.
- Do not format money on the server or store formatted strings.

## Result
The app has the Figma colors, type scale, and self-hosted fonts as theme values, a tested USD formatter, and design docs that describe them.

## Open questions
None
