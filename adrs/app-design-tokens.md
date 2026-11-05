# ADR: App design tokens, fonts, and money format

- Status: Accepted and verified
- Date: 2026-11-05
- Spec: [.specs/013-app-design-tokens.md](../.specs/013-app-design-tokens.md)
- Plan: [plans/013-app-design-tokens-plan.md](../plans/013-app-design-tokens-plan.md)

## Context

Every screen must be built from one set of design values, so the app matches the Figma design and stays consistent as it grows. Prices must be drawn from integer cents in one way only.

## Decisions

1. **Tailwind CSS 4.3.4 with `@tailwindcss/vite` 4.3.4** (the current release on 2026-11-05; the plugin supports Vite 8). Tailwind 4 is configured in CSS, so there is no `tailwind.config` file. Both are dev dependencies.
2. **`src/styles/theme.css` is the single source of tokens.** An `@theme static` block holds the 18 colors (`--color-<name>`), the two font families, the page measures, and the radii. `static` makes Tailwind emit every variable even if no class uses it, so a browser test can check the real values. `theme.test.ts` reads the same file with `node:fs` and asserts every value; `?raw` is not used because Vitest returns an empty string for a raw CSS import.
3. **Only the design exists.** The theme resets the default Tailwind palette, font sizes, radii, font families, and the shadow namespaces (`--color-*: initial` and so on). `bg-red-500`, `text-xl`, `rounded-lg`, and `shadow-md` do not compile; the built CSS has exactly the 18 design colors. This enforces "components use tokens, never hex" and "the design has no shadows".
4. **Text styles are utilities named `type-<style>`** (`@utility type-title-xl`). A font-size utility cannot carry family, weight, letter spacing, and case, so each utility sets all six properties together. Sizes are in `rem` (px / 16) so the browser font-size setting is respected; the −6% letter spacing of Text Bold S is `-0.06em`.
5. **16 text styles, not 13.** The spec said 13 but lists the groups of the analysis, which has 16: Title ×5, Text Regular ×3, Text Bold ×3, Subtitle XL, Button G and S, Tag and Tag L. All 16 are implemented and the count in the spec was corrected. Nothing was dropped.
6. **Layout and shape tokens**: `--spacing-page` 160 px (`px-page`), `--spacing-navbar` 104 px (`h-navbar`), `--container-content` 1120 px (`max-w-content`); radii for input 4, button 6, tag 100, round 1000; the asymmetric card corners as utilities (`rounded-coffee-card` and `rounded-order-card` 6/36/6/36, `rounded-summary-card` 6/44/6/44).
7. **Fonts are self-hosted with Fontsource**: `@fontsource/roboto` 5.3.0 (400, 700) and `@fontsource/baloo-2` 5.3.0 (700, 800), the `latin` and `latin-ext` subsets. Vite bundles 16 font files into `dist/assets` (8 `woff2` of 15 to 22 kB and the 8 `woff` fallbacks); a browser downloads one file per face and subset, and only when a character needs it, and takes the `woff2`. Cyrillic, Greek, Vietnamese, and Devanagari subsets are not shipped.
8. **`formatMoney` and `formatMoneyParts`** (`src/lib/format-money.ts`) use one `Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })`. They accept only non-negative safe integers and throw `RangeError` otherwise, because amounts are whole cents everywhere (CONVENTIONS.md). `formatMoneyParts(990)` is `{ symbol: "$", amount: "9.90" }` from `formatToParts`.
9. **Tests at three levels.** Vitest: 17 tests for money and 51 for the theme (every color, 16 text styles, measures, radii, resets). Root Node tests: Tailwind is wired into Vite, the styles are imported by `main.tsx`, no font host appears in the styles, and no source file except `theme.css` has a hex color. Playwright: the computed `body` colors are `rgb(250, 250, 250)` and `rgb(87, 79, 77)`; each of the 18 colors resolves to its exact value in the browser; the four font faces load, every font request goes to the app origin, and no request goes anywhere else.
10. **The Playwright config no longer reuses a running server** (a separate fix, commit `eb20a2e`): another project's server on port 5173 made the smoke tests open the wrong page.

## Verification

- Six QA commands pass: 96 Vitest tests, 82 root Node tests, the API suite unchanged, 5 Playwright tests (run on port 5174 because 5173 is held by another project's server on this machine), strict `tsc`, and `vite build` (CSS 6.65 kB, 2.07 kB gzip).
- The built CSS defines exactly 18 `--color-*` variables and none of `--color-red`, `--shadow-md`, `--text-xl`, or `--radius-lg`.

## Consequences

- Specs 014 onward style with token classes only. A color the design lacks (for example a focus ring) must first be added to `theme.css` and `DESIGN_SYSTEM.md`.
- `type-*` utilities replace Tailwind font-size classes; mixing `type-title-xl` with `font-bold` overrides the weight, so avoid it.
- The first request of the page for a font subset happens when text needs it, so a flash of fallback text is possible; `font-display: swap` (the Fontsource default) keeps text visible.
- New libraries: `tailwindcss` 4.3.4 and `@tailwindcss/vite` 4.3.4 (dev); `@fontsource/roboto` 5.3.0 and `@fontsource/baloo-2` 5.3.0.
