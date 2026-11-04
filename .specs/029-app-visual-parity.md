# App: visual parity with the design

## Scope
@apps/app/e2e/figma-reference - New; four reference images (Home, Checkout, Checkout Filled, Success) cut from the design export
@scripts/cut-figma-references.mjs - New; produces the reference images from `docs/design/image-frames.png` or the PDF
@apps/app/e2e/visual-parity.spec.ts - New; layout and pixel checks
@apps/app/e2e/visual-masks.ts - New; the rectangles ignored by the pixel comparison
@package.json - New script `lighthouse`
@scripts/lighthouse-home.mjs - New; Lighthouse run for the Home page
@.docs/QA.md - Document the visual and Lighthouse checks

## Context
Part of: Coffee Delivery capstone.
Depends on: @.specs/028-app-e2e-happy-path.md, @.specs/027-app-responsive.md
The design frames are 1440 px wide: Home is 1440×2293, and the others are checkout, checkout filled, and success. The design text is Portuguese and in reais, while the app is in English and dollars, so text pixels will differ. The comparison therefore checks layout boxes and compares pixels only outside masked text areas. The exit criteria from the plan are a difference of at most 2% of the pixels at 1440 px, Lighthouse desktop on Home at least 90 for performance and 95 for accessibility.

## Business needs
The finished app is proven to look like the approved design, with numbers instead of opinions.

## Acceptance Criteria
- `apps/app/e2e/figma-reference` holds four images, each 1440 px wide, cut from the design export by `scripts/cut-figma-references.mjs`; the script fails with a clear message when the export is missing, and the images are committed.
- For each screen, the app is put in the state of the frame: Home with all 14 coffees and an empty cart; Checkout with the cart of the frame (Traditional Espresso × 1, Latte × 2), an empty form and no payment; Checkout Filled with the design sample address and credit card; and Success for an order created with the sample address and credit card.
- The layout checks compare the bounding boxes of these elements with the design values within 2 px: navbar height 104; hero intro width 544; coffee card 256×310 with 32 px column gap and 40 px row gap; checkout columns 640 at x=160 and 448 at x=832; confirm button 368×46; payment options 179×51; success card 526×270.
- The pixel comparison of each screen, with the text rectangles from `visual-masks.ts` ignored, has at most 2% of pixels different (threshold per pixel set in the test), and a failing run writes the actual, expected, and diff images to the test output.
- `yarn lighthouse` builds the app, serves it with the API running, audits the Home page with the desktop preset, and exits non-zero unless performance is at least 90 and accessibility at least 95; the scores are printed.
- The masks list only the areas where English text or dollar amounts replace Portuguese text or reais, each with a comment naming the element; a mask over an image, icon, or background fails review.
- `yarn code:fix`, `yarn lint`, `yarn types:check`, `yarn test`, `yarn test:e2e`, and `yarn build` pass.

## What to do
- Write the checks first, then fix any visual deviation they reveal in the component involved, keeping the change small and listing each fix in the end-of-task report.
- Record the final percentages and Lighthouse scores in the report.

## What not to do
- Do not commit the `.fig` or the PDF.
- Do not widen a mask or raise the 2% limit to make a check pass.
- Do not compare tablet or mobile; the design has none.
- Do not run Lighthouse in CI; spec 030 only runs the QA commands.

## Result
The four screens are verified against the design with measured layout and pixel checks, and the Home page meets the performance and accessibility scores.

## Open questions
None
