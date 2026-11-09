# App: lighter first load

## Scope
@apps/app/src/app/routes.tsx - Load the checkout and order pages lazily; Home stays eager
@apps/app/src/features/catalog/coffee-photo/CoffeePhoto.tsx - `loading="lazy"` and `decoding="async"`
@apps/app/src/features/home/hero/Hero.tsx - The resized hero image
@apps/app/src/assets - The 14 coffee photos and the hero image as WebP at twice their displayed size, and the manifest in `index.ts`
@scripts/optimize-images.mjs - New; makes the WebP files from the committed PNG files
@scripts/optimize-images.test.mjs - New
@apps/app/e2e/home-coffees.spec.ts, @apps/app/e2e/home-hero.spec.ts - Photo and hero checks for the new files
@.docs/DESIGN_SYSTEM.md, @.docs/DEVELOPMENT.md, @.docs/QA.md - Document the image rule and the lazy routes

## Context
Part of: Coffee Delivery capstone.
Depends on: @.specs/029-app-visual-parity.md, @.specs/014-app-assets-from-figma.md
The app is one JavaScript chunk of 522 kB (161 kB gzip) that also carries the checkout and order code (React Hook Form, Zod, and the forms), which Home does not use. The 14 coffee photos weigh 1.82 MB as PNG (one is 1332×1332 px and 495 kB, and they are drawn at 120 px and 64 px), the hero is a 1070×810 px PNG of 516 kB drawn at 476×360 px, and none of the photos is lazy. Lighthouse desktop on Home is 91 for performance (the largest contentful paint scores 0.65), close to its gate of 90.

## Business needs
The home page opens fast, also on a slow connection, and keeps room for new features.

## Acceptance Criteria
- `vite build` makes a separate chunk for the checkout page and one for the order page; the entry chunk is under 250 kB, and Home does not request the two chunks (a Playwright test lists the JavaScript requests of `/`).
- The first visit to `/checkout` and to `/orders/<id>` still works: the page shows its content after a short wait, and a failed chunk request shows the existing error state of the router, not a blank page.
- The 14 coffee photos are WebP at 240 px wide (twice the 120 px of the card), at most 25 kB each, and the hero is WebP at 952 px wide (twice 476 px) and at most 120 kB; every file keeps the transparent background and the 1:1 (photos) or 1070:810 (hero) proportion.
- Every coffee photo has `loading="lazy"` and `decoding="async"`, and the hero keeps `fetchPriority="high"` with no `loading="lazy"` (unit tests and a browser test).
- The transferred size of the home page, measured in a browser test with the network of Chromium (all requests until the 14 cards show), is under 600 kB.
- `yarn lighthouse` prints a desktop performance of at least 95 and an accessibility of at least 95, three runs in a row.
- The visual comparison with the design still passes with the same masks and the same 2% limit (`visual-parity.spec.ts`), and no layout box of any e2e test moves.
- `scripts/optimize-images.mjs` rebuilds the WebP files from the PNG files and leaves a file alone when it is already smaller than its limit; a test covers the sizes, the transparency, and the idempotence.
- `yarn code:fix`, `yarn lint`, `yarn types:check`, `yarn test`, `yarn test:e2e`, and `yarn build` pass.

## What to do
- Write the checks first (the chunk test, the transferred size, the attributes), then the lazy routes, the images, and the script.
- Use the `@napi-rs/canvas` that the repository already has to resize and encode; add no dependency.
- Keep the PNG sources out of the build: commit the WebP files and remove the PNG files the app no longer imports.
- Record the sizes, the chunk sizes, and the three Lighthouse scores before and after in the ADR.

## What not to do
- Do not change a color, a size, or a layout; the images only get lighter.
- Do not add a CDN, a service worker, image `srcset`, AVIF, or a bundle analyzer.
- Do not lower a limit of the visual comparison or add a mask.
- Do not split Home or the shared code any further.

## Result
Home loads only its own code and light images, the whole page transfers under 600 kB, and Lighthouse performance is 95 or more.

## Open questions
None
