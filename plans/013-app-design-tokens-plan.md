# Plan 013: App design tokens, fonts, and money format

- Number: 013
- Created: 2026-11-05
- Spec: [.specs/013-app-design-tokens.md](../.specs/013-app-design-tokens.md)

## Concept summary

The spec has no open question, so there was no interview. Choices made in this plan, each recorded in `adrs/app-design-tokens.md`:

1. **Tailwind CSS 4.3.4** (checked on 2026-11-05) with the official Vite plugin `@tailwindcss/vite` 4.3.4, which supports Vite 8. Tailwind 4 is configured in CSS, so the theme is a CSS file, not a `tailwind.config` file. Both packages are dev dependencies (build time only).
2. **One source of truth: `src/styles/theme.css`.** An `@theme static` block holds the colors (`--color-<name>`), the font families, the page measures, and the radii; `@utility type-*` blocks hold the text styles. `static` makes Tailwind emit every variable, so a browser test can read the real values. The vitest unit test reads the same file (`?raw`) and asserts every value, so the file cannot drift from the spec.
3. **The default Tailwind palette, font sizes, and shadows are reset** (`--color-*: initial`, `--text-*: initial`, `--shadow-*: initial`, and the inset, drop, and text shadow namespaces). Only the Figma tokens exist: `bg-red-500` or `shadow-md` do not compile, which enforces "no hex in components" and "the design has no shadows".
4. **Text styles are utilities named `type-<style>`** (for example `type-title-xl`) that set family, weight, size, line height, letter spacing, and case together, because a font-size utility alone cannot carry the family, weight, or case. Sizes are in `rem` (px / 16) so the user's font-size setting is respected.
5. **The analysis lists 16 text styles, not 13.** Title XL, L, M, S, XS (5), Text Regular L, M, S (3), Text Bold L, M, S (3), Subtitle XL (1), Button G and S (2), Tag and Tag L (2). The spec says 13 but names the same groups; all 16 are implemented and the count in the spec is corrected.
6. **Layout tokens**: page margin 160 px (`--spacing-page`), navbar height 104 px (`--spacing-navbar`), content width 1120 px (`--container-content`); radii for input (4), button (6), tag (100), round (1000) and the three asymmetric card corners as utilities (`rounded-coffee-card` and `rounded-order-card` 6/36/6/36, `rounded-summary-card` 6/44/6/44).
7. **Fonts self-hosted with Fontsource** (`@fontsource/roboto` 5.3.0 and `@fontsource/baloo-2` 5.3.0): Roboto 400 and 700, Baloo 2 700 and 800, the `latin` and `latin-ext` subsets. The browser downloads a subset file only when a character needs it. The files are bundled by Vite and served from the app origin.
8. **`formatMoney(cents)` and `formatMoneyParts(cents)`** in `src/lib/format-money.ts` use one `Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })`. They accept only non-negative safe integers (money is integer cents) and throw `RangeError` otherwise. `formatMoneyParts` returns `{ symbol, amount }` from `formatToParts`.
9. **Browser tests** (`e2e/design-tokens.spec.ts`): the computed `body` background is `rgb(250, 250, 250)` and the text color `rgb(87, 79, 77)`; every color variable has its value at runtime; the four font faces load, and every font request goes to the app origin, none to an outside host.
10. **Guard test at the root**: no source file of the app except `theme.css` contains a hex color (it already did for pages; now all of `src`).
11. **Docs**: `DESIGN_SYSTEM.md` gets the Tailwind name of every token and the `type-*` names; `DESIGN.md` records the measures and the no-shadow rule as enforced.

## Tasks

| # | Task | Test first |
| --- | --- | --- |
| 1 | `src/lib/format-money.test.ts`, then `format-money.ts` | Does not compile, then passes |
| 2 | `src/styles/theme.test.ts` (colors, 16 text styles, measures, radii, resets, fonts), then `theme.css` | idem |
| 3 | `scripts/app-config.test.mjs`: Tailwind plugin wired, styles imported by `main.tsx`, no hex outside `theme.css` | Fails, then passes |
| 4 | `e2e/design-tokens.spec.ts` (body colors, color variables, self-hosted fonts) | Fails, then passes |
| 5 | Install the libraries, `vite.config.ts`, `index.css`, `fonts.css`, `base.css`, import in `main.tsx` | The tests above |
| 6 | Docs `DESIGN.md`, `DESIGN_SYSTEM.md`, `ARCHITECTURE.md`, `DEVELOPMENT.md`; fix the count in the spec | Root tests |
| 7 | Manual QA: `yarn app:dev`, look at the page and the computed styles in the browser | Manual |

## New dependencies

`tailwindcss` 4.3.4 and `@tailwindcss/vite` 4.3.4 (dev); `@fontsource/roboto` 5.3.0 and `@fontsource/baloo-2` 5.3.0.
