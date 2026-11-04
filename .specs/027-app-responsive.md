# App: responsive layouts

## Scope
@apps/app/src/components/navbar - Tablet and mobile behavior
@apps/app/src/features/home/hero - Stacked layout
@apps/app/src/features/catalog - Grid columns, card width, and filter chips wrapping
@apps/app/src/features/checkout - Single column, form rows, payment options, and summary
@apps/app/src/features/orders/order-confirmation - Stacked card and illustration
@apps/app/e2e/responsive.spec.ts - New
@.docs/DESIGN.md - Document breakpoints and rules

## Context
Part of: Coffee Delivery capstone.
Depends on: @.specs/019-home-coffee-filters.md, @.specs/026-order-success-page.md
The Figma has only desktop frames (1440 px). The mold requires accessible and responsive screens, checked on desktop, tablet, and mobile. This spec derives the other layouts from the desktop design and keeps its colors, type styles, radii, and components. The rules below are the proposal for the user to approve when approving this spec.

## Business needs
The product works on phones and tablets as well as on desktop, so a visitor can order from any device.

## Acceptance Criteria
**Breakpoints and margins**
- Mobile is below 640 px, tablet from 640 px to 1023 px, desktop from 1024 px. The page margin is 160 px on desktop (as designed), 32 px on tablet, and 16 px on mobile; content is at most 1120 px wide.

**Rules per screen**
- Navbar: logo, location pill, and cart link stay on one row; below 640 px the pill text is truncated with an ellipsis instead of wrapping.
- Hero: below 1024 px the intro is above the cup image, both centered; the title is 40 px on tablet and 32 px on mobile; the four benefits are two columns on tablet and one column on mobile.
- Coffee grid: four columns on desktop, two on tablet, one on mobile (cards keep 256 px width and are centered); the filter chips wrap below the "Our coffees" title and wrap onto several rows when needed.
- Checkout: below 1024 px the page is one column with the address card, the payment card, then the summary; the summary card fills the width; below 640 px each address row becomes one field per row and the three payment options stack.
- Confirmation: below 1024 px the card is above the illustration and fills the width up to 526 px; the illustration scales down to fit.

**Checks**
- For each of the four screens (Home, Checkout with items, Checkout empty cart, Confirmation) at 768×1024 and 390×844, `document.documentElement.scrollWidth` equals the viewport width (no horizontal scroll).
- At every viewport, every button, link, and input has a clickable area of at least 24×24 px (WCAG 2.2 target size).
- At 1440×900 the screens still match the desktop bounding boxes checked by specs 016 to 026.
- Screenshots `<page>_<viewport>_after.png` for the four screens at 1440×900, 768×1024, and 390×844 are taken with the Playwright MCP and attached to the end-of-task report.
- `yarn code:fix`, `yarn lint`, `yarn types:check`, `yarn test`, `yarn test:e2e`, and `yarn build` pass.

## What to do
- Write the Playwright checks first, then adapt each screen with the theme's breakpoints.
- Keep one component per element; do not copy components for mobile.

## What not to do
- Do not change the desktop layout, colors, type styles, or copy.
- Do not add a mobile menu, a bottom bar, or a cart drawer.
- Do not hide content on small screens.

## Result
All four screens are usable on tablet and mobile, without horizontal scrolling, and unchanged on desktop.

## Open questions
None
