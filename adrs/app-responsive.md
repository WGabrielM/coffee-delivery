# ADR: Responsive layouts for tablet and mobile

- Status: Accepted and verified
- Date: 2026-11-08
- Spec: [.specs/027-app-responsive.md](../.specs/027-app-responsive.md)
- Plan: [plans/027-app-responsive-plan.md](../plans/027-app-responsive-plan.md)

## Context

The Figma has only 1440 px frames, and the screens of specs 016 to 026 were built with fixed desktop widths (a 1120 px grid, columns of 640 and 448 px, a 526 and a 492 px row). The mold requires accessible, responsive screens on desktop, tablet, and mobile. The spec proposed the rules and left the owner to approve them; the owner approved them on 2026-11-08 and let me choose the pixel sizes.

## Decisions

1. **Tailwind's breakpoints, no custom ones.** Mobile is below `sm` (640 px), tablet is `sm` to below `lg` (1024 px), desktop is `lg`.
2. **The page margin is a variable, not five classes.** `--spacing-page` is set in `base.css` (16 px, 32 px from 640 px, and `clamp(2rem, (100vw - 1140px) / 2, 160px)` from 1024 px), so the five screens that use `px-page` follow it with no change. The container is at most 1120 px and centered, so at 1440 px it still starts at x=160. The 1140 (not 1120) leaves 20 px for a classic scrollbar. The 160 px in `theme.css` stays as the desktop token.
3. **Desktop is fluid between 1024 px and about 1180 px.** "Desktop from 1024 px" cannot mean the fixed 1120 px layouts. So: the coffee grid is `repeat(auto-fill, 16rem)` centered (four columns when 1120 px fits, then three, two, one); the checkout columns are `minmax(0, 640fr) minmax(0, 448fr)` (exactly 640 and 448 px at 1120 px); the address rows use fractions equal to the design's pixels (200, 348, 276, 60), with the State column at least 60 px; the confirmation grid is `526px minmax(0, 492px)`; the hero image shrinks with its proportions.
4. **Classes only, one component per element.** No component is copied for mobile. The changes are `flex-col lg:flex-row`, `grid-cols-1` with a column template from `sm` or `lg`, `max-lg:` and `max-sm:` variants for the hero title (40 and 32 px), and smaller padding below 640 px (24 px in cards, 16 px in the page). The base `SelectOptionGroup` stacks its options below 640 px.
5. **Where there was no rule, I chose the simple one.** The chips go under the title below 1024 px and wrap. The hero text is centered below 1024 px. A summary row lets the counter and Remove wrap under the name. The confirmation card is at most 526 px and the illustration at most 492 px, centered below 1024 px. The vertical paddings shrink on small screens (hero 40, 64, then 94 px; page top 24 or 40 px; list bottom 64 px).
6. **A real defect found by the check:** the "Browse coffees" and "Back to coffees" links were 22 px high at every width (WCAG 2.2 asks for 24). They now have `min-h-6`. This changes the empty-cart page on desktop by under 2 px.
7. **The navbar pill is cut, not wrapped.** The pill and its text can shrink (`min-w-0`, `truncate`); the logo and the cart do not (`shrink-0`).

## Verification

- The checks came first: `e2e/responsive.spec.ts` was red on the desktop-only layouts (35 of 74 failed, including the 22 px link), and green after (74 of 74, run three times).
- Six QA commands pass: 638 Vitest tests (nine of them updated for the new classes), 96 root tests, the API suite unchanged, 166 Playwright tests (92 before, 74 new), strict `tsc`, and `vite build` (CSS 28.98 kB, 6.30 kB gzip, from 27.33 kB; JS 522.59 kB, 161.21 kB gzip, from 521.58 kB).
- For the four screens (Home, Checkout with items, Checkout with an empty cart, Confirmation) at 1440×900, 1280×800, 1024×768, 768×1024, 390×844, and 320×568: `scrollWidth` equals `clientWidth`, and every visible button, link, and input is at least 24×24 px. The spec asks for 768 and 390 only; the other four were added because the desktop range starts at 1024 px and a phone can be 320 px wide.
- Layout rules checked in the browser: the margin is 32 px on a tablet and 16 px on a phone on all four screens; the hero title is 48, 40, and 32 px, the intro is above the image and both are centered, the benefits are two columns and then one; the grid has four, two, and one columns of 256 px cards, centered on a phone; the chips are under the title (and on two rows on a phone) and on the title row on desktop; the checkout is one column in the order address, payment, summary with the summary as wide as the content, each address field on its own row on a phone, the payment options stacked at 51 px, and the rows of a tablet keeping their columns; the confirmation card is above the illustration, at most 526 px, the picture keeps 492:293; the pill is cut with an ellipsis at 260 px.
- Desktop unchanged: all the desktop bounding-box tests of specs 016 to 026 still pass at 1440×900, and the new home, checkout, and confirmation screenshots at 1440 px are byte-identical to the old ones (only the empty-cart one differs, by the 2 px of the taller link).
- Screenshots: `<screen>_<desktop|tablet|mobile>_after.png` for `home`, `checkout` (items, empty form), `checkout_empty`, and `success`, taken with a Playwright script because the Playwright MCP was not used in this session.

## Consequences

- The coffee grid shows three columns in a 1024 to 1180 px window. The spec says four on desktop; four need 1120 px of content.
- Chromium in Playwright has overlay scrollbars, so the checks do not see a classic scrollbar. The 20 px of room in the margin formula covers it at 1440 px, but no test proves it.
- The hero benefits keep `whitespace-nowrap` and `w-max`: on a 320 px phone the longest line (about 294 px) just fits, and the check at 320 px passes. A narrower screen would scroll.
- A narrow desktop window (1024 to 1180 px) can overlap the benefits with the cup image's transparent edge; it is decorative and nothing is cut.
- No new library.
