# ADR: App, lighter first load

- Status: Accepted and verified
- Date: 2026-11-10
- Spec: [.specs/033-app-lighter-first-load.md](../.specs/033-app-lighter-first-load.md)
- Plan: [plans/033-app-lighter-first-load-plan.md](../plans/033-app-lighter-first-load-plan.md)

## Context

The app was one JavaScript chunk of 522 kB (161 kB gzip) that also carried the checkout and order code (React Hook Form, Zod, the forms), which Home does not use. The 14 photos weighed 1.82 MB as PNG (one is 1332×1332 px and 495 kB, drawn at 120 px and 64 px), the hero was a 1070×810 PNG of 516 kB drawn at 476×360 px, and no photo was lazy. Lighthouse desktop on Home was 91 for performance.

## Decisions

1. **Lazy checkout and order routes.** `lazy` in `routes.tsx` imports `CheckoutPage` and `OrderPage` when the route is visited. Home and the not-found page stay in the entry chunk (the spec forbids splitting further). A first visit to a lazy path shows the layout (skip link and navbar, through `HydrateFallback`) until the chunk arrives; a chunk that cannot be loaded shows the default error page of the router, not a blank page (both checked in a browser).
2. **WebP at twice the displayed size, made by a script.** `scripts/optimize-images.mjs` decodes, resizes, and encodes with `@napi-rs/canvas` (already a dev dependency), trying qualities from 90 down until the file fits: 240 px photos at most 25 kB, a 952 px hero at most 120 kB. The transparent background and the proportion are kept. A file that is already under its limit is left alone, so running it again changes nothing; `--force` makes all again. An image that cannot fit is an error, never a bigger file.
3. **PNG originals are sources, not assets.** They moved with `git mv` to `apps/app/assets-source` (outside `src`, so outside the build), and the Figma extraction writes them there and runs the optimizer, so `node scripts/extract-figma-assets.mjs` still rebuilds every asset in one command. The real run on the `.fig` changed no other file.
4. **Lazy, async photos; a hero that is not lazy.** `CoffeePhoto` sets `loading="lazy"` and `decoding="async"` (the size attributes keep the place); the hero keeps `fetchPriority="high"` and no `loading`, because it is the largest contentful paint. The hero box is fixed with `aspect-476/360`, because the 952×721 file alone would make it 360.5 px high instead of 360.
5. **The checks run on the production build.** Chunks and transferred bytes exist only there, so `playwright.config.ts` builds the app and serves it on port 4173 with `vite preview` (which proxies `/api`), and `global-setup.ts` checks that server too. `e2e/first-load.spec.ts` checks the entry chunk, the requests of Home, the lazy chunks on a client navigation and on a first visit, the error page for a failed chunk, the photo attributes, and the transferred size (Chromium `Network.loadingFinished`).
6. **The dev server pre-bundles the checkout libraries** (`optimizeDeps.include`): without it, the first visit to the lazy checkout made Vite bundle them and reload the page, and one end-to-end test failed.
7. **The Lighthouse limit for performance is 95** (was 90).

## Measured (2026-11-10)

| | Before | After |
| --- | --- | --- |
| Entry chunk | 522 kB (161 kB gzip) | 238.02 kB (74.37 kB gzip) |
| Checkout chunk / order chunk | in the entry | 138.04 kB / 3.72 kB |
| Shared vendor chunk (React), loaded by Home | in the entry | 144.81 kB |
| JavaScript of Home | 522 kB | 383 kB |
| 14 coffee photos | 1.82 MB (PNG) | 136.8 kB (WebP, 8.2 to 12.0 kB each) |
| Hero image | 516 kB (PNG) | 87.7 kB (WebP) |
| Home transferred, until the 14 cards show | not measured | 512 kB (limit 600 kB) |
| Lighthouse desktop, Home (3 runs) | 91 performance | 100, 100, 100 performance; 96, 96, 96 accessibility |
| Visual difference with the design (Home) | 0.42% | 0.60% (limit 2%, same masks) |

## Consequences

- A new raster image follows the rule in `DESIGN_SYSTEM.md`: a WebP at twice its displayed size with a limit, lazy unless it is on the first screen.
- The first visit to `/checkout` waits for a 138 kB chunk (42 kB gzip) after the entry; a visit from Home waits for the chunk before the page changes.
- Playwright now builds the app once per run (about 1 second).
- No new dependency; no `srcset`, AVIF, CDN, or service worker (out of scope).
