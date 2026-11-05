# Plan 017: Home hero

- Number: 017
- Created: 2026-11-05
- Spec: [.specs/017-home-hero.md](../.specs/017-home-hero.md)

## Concept summary

The spec has no open question, so there was no interview. The look is fixed by the Figma design, so the design skills were applied as a checklist (one h1, readable text over the shapes, no decoration beyond the design, no motion). Choices, each recorded in `adrs/home-hero.md`:

1. **`Hero` lives in `src/features/home/hero/Hero.tsx`** (a feature component, not a base component) and takes no props. `HomePage` (the file is `HomePage.tsx` in this repository; the spec says `home-page.tsx`) renders only it.
2. **The h1 is the home page title** and the only heading of the hero. The old placeholder h1 "Coffee Delivery" is gone, so the smoke test and the route test now expect the hero title.
3. **Benefits** are a `ul` of four `li`, in the order of the spec, each with a 32 px circle (`aria-hidden`) in its color token and a 16 px white icon from `iconSvgs` through the internal `Icon`.
4. **The cup image** is the committed `heroImage` (it already holds the yellow shape and the purple arc of the design), 476×360, `alt=""`, `fetchPriority="high"` because it is the largest image of the first screen.
5. **Background shapes are styles:** three absolutely positioned, blurred circles (`hero-blob`, `purple-light`) in an `aria-hidden`, pointer-transparent layer behind the content (`isolate` and `-z-10`). They are clipped at the top and the sides and bleed below, so no hard edge shows.
6. **Contrast** is checked in Chromium by running `axe-core` (color-contrast only) over `main` in a Playwright test, because jsdom has no colors.
7. **Measures** are checked in Chromium at 1440×900 within 2 px: intro 544 wide at x=160, image 476×360 ending at x=1280, a 2×2 grid of 32 px circles, no horizontal scroll.

## Tasks

| # | Task | Test first |
| --- | --- | --- |
| 1 | `Hero.test.tsx`, then `Hero.tsx` | Fails, then passes |
| 2 | `HomePage` renders the hero; smoke and route tests expect the new h1 | idem |
| 3 | `e2e/home-hero.spec.ts` | Fails, then passes |
| 4 | Screenshot at 1440×900 and a look at it | A look |
| 5 | Docs: `DESIGN.md`, `DESIGN_SYSTEM.md`, `ARCHITECTURE.md` | Root tests |
| 6 | Six QA commands | Green |

## New dependencies

None.
