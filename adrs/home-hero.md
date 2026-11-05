# ADR: Home hero

- Status: Accepted and verified
- Date: 2026-11-05
- Spec: [.specs/017-home-hero.md](../.specs/017-home-hero.md)
- Plan: [plans/017-home-hero-plan.md](../plans/017-home-hero-plan.md)

## Context

The first screen of the home page must say what Coffee Delivery offers: a title, a subtitle, four benefits, and the cup image over soft colored shapes. The Portuguese copy of the design is replaced by the English copy of the spec.

## Decisions

1. **`Hero` is a feature component** (`src/features/home/hero/Hero.tsx`) with no props and no data. `HomePage` renders only it; the file keeps the name `HomePage.tsx` of this repository (the spec says `home-page.tsx`).
2. **One h1, the page title.** The placeholder h1 "Coffee Delivery" of spec 012 was replaced; the smoke test and the route test expect the new text.
3. **Benefits are a list** (`ul`, four `li`, in the order of the spec). Each circle is `aria-hidden` with a white icon, so a screen reader hears only the text. Colors are tokens: `yellow-dark`, `text`, `yellow`, `purple`.
4. **The cup image is decorative** (`alt=""`), as the spec asks, with its real size attributes (476×360, so the layout does not jump) and `fetchPriority="high"`. It is the committed 1070×810 original, which already contains the yellow shape and the purple arc; the owner chose to keep the photos at full quality (516 kB in the build).
5. **Shapes are styles.** Three blurred circles (`hero-blob` at 30% and 25%, `purple-light`, `blur-[100px]`) in an `aria-hidden`, `pointer-events-none`, `-z-10` layer inside an `isolate` section. A first version used `overflow-hidden`, which cut the blur in a hard line at the bottom of the section; the layer is now clipped with `clip-path: inset(0 0 -240px 0)`, which keeps the top and the sides cut and lets the bottom fade out. They are not an image and have no motion.
6. **Benefits stay on one line.** With the English copy, "Packaging keeps the coffee intact" is wider than half of 544 px minus the 32 px circle, so it wrapped. The list is `w-max` with `whitespace-nowrap` and the design's 40 px column gap: it is 570 px wide, 26 px past the 544 px intro, and ends 74 px before the image. The intro column (title, subtitle) is exactly 544 px.
7. **Contrast is measured in a browser.** `home-hero.spec.ts` injects `axe-core` and runs only `color-contrast` over `main`; jsdom cannot. No violation is reported (axe can mark text over a gradient as "incomplete" instead of a violation, so this is a guard, not a proof; the shapes are at most 30% opacity over `background`).
8. **Vertical rhythm** (not in the spec, taken from the design frame): 94 px above and below the content, 16 px between title and subtitle, 66 px before the benefits, 20 px between benefit rows. The section is 548 px high.

## Verification

- Six QA commands pass: 294 Vitest tests (281 before, 13 new in Hero, one per benefit among them; the route test only changed its expected title), 96 root Node tests, the API suite unchanged, 16 Playwright tests (5 new in `home-hero.spec.ts`) on port 5173, strict `tsc`, and `vite build` (CSS 22.37 kB, 5.06 kB gzip, from 20.49 kB; JS 360.71 kB, 113.12 kB gzip; `hero.png` 516 kB).
- Measured in Chromium at 1440×900: h1 at (160, 202), 544 wide, Baloo 2 800 48 px `rgb(39, 34, 33)`; subtitle Roboto 400 20 px `rgb(64, 57, 55)`; image at x=804, 476×360, ending at 1280; four 32×32 circles in a 2×2 grid; no horizontal scroll.
- Screenshot `screenshots/home_desktop_after.png`, taken with a Playwright script (the Playwright MCP is not loaded in this session) and compared by eye with the hero image and the description of the Home frame in `docs/design/figma-analysis.md`. The PDF of the design could not be rendered here (no `pdftoppm`), so the comparison with the frame itself is by measures and description, not side by side.

## Consequences

- The subtitle wraps to two lines ("...wherever you are, at / any time") in the 544 px column; the design's Portuguese sentence may break differently.
- The shapes' exact positions and blur are my reading of "soft, blurred yellow and purple shapes", not measured values; spec 029 (visual parity) is where they are compared and tuned.
- No new library.
