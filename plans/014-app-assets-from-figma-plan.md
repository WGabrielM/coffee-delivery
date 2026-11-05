# Plan 014: App assets extracted from the Figma file

- Number: 014
- Created: 2026-11-05
- Spec: [.specs/014-app-assets-from-figma.md](../.specs/014-app-assets-from-figma.md)

## Concept summary

The spec has no open question, so there was no interview. The decoding approach of the design analysis was not committed, so this plan rebuilds it. Choices, each recorded in `adrs/app-assets-from-figma.md`:

1. **No Figma library.** A `.fig` is a ZIP with `canvas.fig` (a `fig-kiwi` container: a Kiwi schema chunk and a document chunk, each deflate or zstd), `images/<sha1>` (the raw PNGs), `meta.json`, and a thumbnail. The script reads the ZIP with `node:zlib`, detects zstd by its magic bytes, and decodes Kiwi with a small reader of its own (`scripts/lib/fig-file.mjs`). Node 22.15 or newer is needed for zstd; the script says so when it is older.
2. **Photos are matched by hash, not by order.** Each of the 14 cards on the Home screen is an instance of the `Type=Catalog` symbol. Its title is a text override (or the symbol default), and its photo is the symbol chosen for the nested `Coffee` instance (an override, or the default). That symbol holds one rectangle with an image paint, whose hash names the file in `images/`. The Portuguese card title maps to the slug of spec 004. The grid order of the seed and the Style Guide `Type=...` symbols are cross-checks, not the source. A mismatch stops the script.
3. **Photos are copied byte for byte** (the original PNG, named `<slug>.png`). Nothing is re-encoded. The total weight goes in the end-of-task report; they are optimized only if that shows a problem.
4. **Icons come from the vector outlines** (`fillGeometry`, a binary path blob: 0 close, 1 move, 2 line, 3 quadratic, 4 cubic) of the 13 symbols in the Style Guide "Ícones" frame. Each symbol becomes a 32×32 SVG, one `<path>` per outline with the node transform, `fill="currentColor"`. The Figma names are normalized (`-regular` dropped, the `currenc-dollar` typo fixed).
5. **Logo and illustration** are written as SVG with their own colors: the logo is one vector with two fills (the base fill and a style override that points to the `Brand/Purple` style); the illustration is the 96 vectors of the Success frame, each with a solid fill and a transform.
6. **Hero image**: the `Imagem` rectangle on the Home screen is an image paint; the raster is copied.
7. **The contact sheet** (`docs/design/coffee-images-contact-sheet.png`) draws each photo with its slug. It needs an image library: `@napi-rs/canvas` 1.1.0 (dev dependency of the root, prebuilt binary, no system library). It is used only by the script, never by the app.
8. **The manifest** `src/assets/index.ts` imports every file explicitly (a missing file fails `tsc` and `vite build`), and exports `COFFEE_SLUGS`, `coffeeImages`, `ICON_NAMES`, `iconSvgs` (SVG source, imported with `?raw`, so a component can inline it and inherit `currentColor`), `logo`, `heroImage`, and `deliveryIllustration` (URLs).
9. **Tests**: `assets.test.ts` (Vitest) checks the manifest and the files on disk; `scripts/extract-figma-assets.test.mjs` (root, no `.fig` needed) checks the decoder with hand-built Kiwi bytes, the path converter, the icon name normalization, the failure message without the `.fig`, and that the manifest slugs equal the slugs of the API seed.

## Tasks

| # | Task | Test first |
| --- | --- | --- |
| 1 | `src/assets/assets.test.ts` (manifest, files, sizes, `currentColor`) | Fails: no manifest, no files |
| 2 | `scripts/extract-figma-assets.test.mjs` (decoder, path blob, names, missing file, seed slugs) | Fails: no modules |
| 3 | `scripts/lib/fig-file.mjs`, `scripts/lib/fig-assets.mjs`, `scripts/extract-figma-assets.mjs` | Test 2 passes |
| 4 | Run the script on the real `.fig`; look at the contact sheet and the rendered SVGs | Manual |
| 5 | `src/assets/index.ts`, install `@napi-rs/canvas`, commit the outputs | Test 1 passes |
| 6 | Docs: `DESIGN_SYSTEM.md`, `docs/design/assets-mapping.md` (generated), `ARCHITECTURE.md`, `DEVELOPMENT.md` | Root tests |
| 7 | Six QA commands; `yarn build` with no `.fig` in the checkout | Green |

## New dependencies

`@napi-rs/canvas` 1.1.0 (root dev dependency, used by the extraction script only).
