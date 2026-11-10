# Plan 033: App, lighter first load

- Number: 033
- Created: 2026-11-10
- Spec: [.specs/033-app-lighter-first-load.md](../.specs/033-app-lighter-first-load.md)

## Concept summary

The spec has no open question. Choices, each recorded in `adrs/app-lighter-first-load.md`:

1. **Lazy routes with the `lazy` property of the router** for the checkout and the order page; Home and the not-found page stay in the entry chunk. The router waits for the chunk before it changes the page and has its own error page for a chunk that fails. A first visit shows the layout (`HydrateFallback`) while the chunk loads.
2. **WebP made by a script**, with `@napi-rs/canvas` that the repository already has: 240 px photos (at most 25 kB) and a 952 px hero (at most 120 kB), the best quality that fits. A file that is already under its limit is left alone; `--force` makes all again.
3. **The PNG originals move to `apps/app/assets-source`**, outside the build. The Figma extraction writes them there and runs the optimizer, so one command still rebuilds every asset.
4. **Photos are `loading="lazy"` and `decoding="async"`**; the hero keeps `fetchPriority="high"` and is never lazy. The hero gets `aspect-476/360`, so its box is exactly the one of the design (the 952×721 file would make it 360.5 px high).
5. **The browser test runs on the production build.** Chunks and transferred bytes exist only there, so Playwright builds the app and serves it on port 4173 (`vite preview`) next to the dev server; the other specs are untouched.
6. **The dev server pre-bundles the checkout libraries** (`optimizeDeps.include`), so a first visit to the lazy checkout does not trigger a re-bundle and a reload in the tests.
7. **The Lighthouse limit for performance goes from 90 to 95** (the script and its tests).

## Tasks

| # | Task | Files | Check |
| --- | --- | --- | --- |
| 1 | Optimizer and its test | `scripts/optimize-images.mjs`, `.test.mjs` | Sizes, transparency, idempotence |
| 2 | WebP files, manifest, assets test | `apps/app/src/assets`, `assets-source` | Unit |
| 3 | Lazy photos, hero check | `CoffeePhoto`, `Hero` and their tests | Unit |
| 4 | Lazy routes | `routes.tsx`, route and page tests | Unit |
| 5 | Browser checks on the build | `e2e/first-load.spec.ts`, `playwright.config.ts`, `global-setup.ts`, `app-config.test.mjs` | Chunks, 250 kB, 600 kB, error page |
| 6 | Extraction writes the sources | `extract-figma-assets.mjs`, `assets-mapping.md` | Real run on the `.fig` |
| 7 | Lighthouse limit | `lighthouse-home.mjs` and test | Three runs |
| 8 | Docs, ADR, plan, PLAN.md | `.docs/*`, `adrs/`, `docs/PLAN.md` | Links |
| 9 | Six QA commands | | Green |

## New dependencies

None.

## QA steps and risks

- QA: the six commands; `yarn lighthouse` three times; the visual comparison with the same 2% limit.
- Risk: the lazy page tests that render the real routes must wait for the chunk (their render helpers now do).
- Risk: the 952×721 hero changed the box by 0.2 px; fixed with the aspect ratio of the design.
