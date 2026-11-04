# App: assets extracted from the Figma file

## Scope
@scripts/extract-figma-assets.mjs - New; reads the local `.fig` and writes assets
@apps/app/src/assets/logo - New; logo
@apps/app/src/assets/icons - New; 13 SVG icons
@apps/app/src/assets/coffees - New; 14 coffee photos named by slug
@apps/app/src/assets/hero - New; hero cup image
@apps/app/src/assets/success - New; delivery illustration
@apps/app/src/assets/index.ts - New; typed manifest of every asset
@apps/app/src/assets/assets.test.ts - New
@docs/design/assets-mapping.md - New; where each asset came from in the Figma file
@.docs/DESIGN_SYSTEM.md - List the assets and how to regenerate them

## Context
Part of: Coffee Delivery capstone.
Depends on: @.specs/012-app-foundation.md
The `.fig` file stays on the developer's machine in `docs/design/` and is not tracked by Git (spec 001). It has 35 images (14 are coffee photos, 266 to 1332 px square), vector shapes for the logo, 13 icons, and the success illustration. Photos are linked to coffees by the image paint hash of each coffee card, not by guessing the order. The offline decoding approach was proven during the design analysis.

## Business needs
The app uses the real brand and product images from the design, and the project can be built without the Figma file.

## Acceptance Criteria
- Running `node scripts/extract-figma-assets.mjs` with the `.fig` present writes the assets into `apps/app/src/assets` and the mapping into `docs/design/assets-mapping.md`; without the file it exits non-zero with a message that names the expected path.
- `apps/app/src/assets/coffees` has 14 images named after the slugs from spec 004, each a square raster of at least 240 px; `docs/design/assets-mapping.md` lists, for each slug, the Figma card name and image hash it was matched by.
- `apps/app/src/assets/icons` has the 13 icons: `shopping-cart-fill`, `timer-fill`, `package-fill`, `coffee-fill`, `map-pin-fill`, `map-pin-line`, `currency-dollar`, `trash`, `plus-bold`, `minus-bold`, `credit-card`, `money`, and `bank`; each is an SVG that colors itself with `currentColor`.
- The manifest in `index.ts` exports a typed lookup for each coffee slug, each icon, the logo, the hero image, and the illustration; a unit test fails if a file is missing or a slug has no image.
- A contact sheet image `docs/design/coffee-images-contact-sheet.png`, produced by the script, shows each photo with its slug so the mapping can be checked by eye (manual QA step in the end-of-task report).
- The committed assets build: `yarn build` passes with the assets in place and no `.fig` present.
- `yarn code:fix`, `yarn lint`, `yarn types:check`, `yarn test`, `yarn test:e2e`, and `yarn build` pass.

## What to do
- Write the manifest test first, then the script, then run it and commit the outputs.
- Reuse the decoding steps already proven in the analysis: container detection by magic bytes, zstd for the canvas chunk, and rendered colors as the truth when paints disagree.
- Optimize the images only if the end-of-task report shows a size problem, and record the total weight there.

## What not to do
- Do not commit the `.fig` file, the PDF, or `image-frames.png`.
- Do not extract the Figma "About" page images, avatars, or brand marks that the app does not use.
- Do not redraw or restyle the icons.
- Do not add an icon library; the 13 icons are the whole set.

## Result
The app has every logo, icon, coffee photo, hero image, and illustration it needs as committed files, matched to the right coffees, with a typed manifest and a documented way to regenerate them.

## Open questions
None
