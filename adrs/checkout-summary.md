# ADR: The checkout page and its order summary

- Status: Accepted and verified
- Date: 2026-11-07
- Spec: [.specs/022-checkout-summary.md](../.specs/022-checkout-summary.md)
- Plan: [plans/022-checkout-summary-plan.md](../plans/022-checkout-summary-plan.md)

## Context

The cart (spec 020) is filled from the cards (spec 021), but `/checkout` was a placeholder. The customer must review the coffees, change quantities or remove them, and see the exact total. The Figma has two columns (640 px at x=160, 448 px at x=832) and a summary card; the form column arrives in specs 023 and 024.

## Decisions

1. **Two fixed columns, no form yet.** `CheckoutPage` is a grid of `640px 448px` with a 32 px gap inside the 1120 px content. The left column is a section with its heading only. A visually hidden `h1` "Checkout" keeps the heading order (1, 2, 2). The file keeps its name `CheckoutPage.tsx` (the spec says `checkout-page.tsx`; the repository names pages in PascalCase). Tablet and mobile are spec 027.
2. **The empty cart is a separate state, not an empty summary.** With no lines the page shows "Your cart is empty" and a link "Browse coffees" to `/`, and renders neither column, so it asks the server for nothing. When the last coffee is removed on the page, the focus moves to the empty-cart heading (the Remove button that had it is gone); arriving with an empty cart moves no focus.
3. **Prices come from the catalog, the fee from the server.** `OrderSummary` reads the whole catalog with the existing `useCoffees()` (the home page shares the cache entry) and the fee with a new `useCheckoutConfig()` (`GET /api/v1/checkout-config`, key `["checkout-config"]`). The cart keeps only ids and quantities (spec 020).
4. **Money is computed in cents by a pure function.** `priceOrder(lines, catalog, deliveryFeeInCents)` returns the rows (in cart order), the items total, the fee, and the total; amounts become text only through `formatMoney`. The sum is unit price × quantity, not the mock's 19.80 beside a counter of 1.
5. **Stale lines are removed, but only on fresh data.** When the catalog request has finished (`!isFetching`), every line whose id is not in it is removed from the cart. A cached list that is being refreshed may be out of date, and trusting it could delete a coffee that exists. If every line goes, the page shows the empty state.
6. **Loading and error live in the card, and the button is always there.** While either request is pending the card shows a spinner with "Loading your order…" (`output`). When either fails it shows an alert and "Try again", which asks again only for the request that failed (it does not cancel the one still running). "Confirm order" is disabled until both have data and at least one row is priced, and it sends nothing (spec 025).
7. **Rows reuse the base components.** The compact `Counter` (72×32) and the secondary `Button` with the trash icon; the Remove button is named "Remove Latte" (the visible text stays "Remove", so the name contains it) so that the rows are told apart.
8. **`CoffeePhoto` is extracted from `CoffeeCard`.** The image or the round placeholder for a slug with no photo was private to the card; the summary needs it at 64 px, so it became a small shared component (`features/catalog/coffee-photo`). The card keeps its tests and its look.
9. **Accessibility.** Rows are list items named by their `h3`. A quantity change is heard through the counter's `output`; the total amount is an `output` too, so a change of the total is heard. After Remove the focus moves to the "Selected coffees" heading (programmatic focus, `tabIndex` -1, no outline) so it is not lost.
10. **The Remove width is not forced to 91 px.** The Figma button reads "REMOVER" (Portuguese). With the design's padding (8), icon (16), and gap (4), the English "Remove" is about 83 px wide. The browser test checks the height (32) and that the width is between 78 and 93 px. `DESIGN.md` records this.
11. **The empty-cart look is proposed.** The design has no frame for it: a Title M message and a `purple-dark` underlined link in Button G style.

## Verification

- Six QA commands pass: 466 Vitest tests (54 new: pricing 6, config hook 5, photo 3, summary 27, page 13), 96 root tests, the API suite unchanged, 51 Playwright tests (40 before, 11 new in `checkout-summary.spec.ts`, which call the real API), strict `tsc`, and `vite build` (CSS 24.81 kB, 5.56 kB gzip, from 24.24 kB; JS 385.84 kB, 120.35 kB gzip, from 380.70 kB).
- The tests were written before the code; I did not run them red as a separate step (the modules they import did not exist yet).
- Measured in Chromium at 1440×900 against the API: the left column is 640 px at x=160, the right one 448 px at x=832, "Confirm order" is 368×46 inside the 40 px padding, each row is 368×80, the photo 64×64, the counter 72×32, Remove 32 px high; the card is `rgb(243, 242, 242)` with 40 px padding and corners 6/44/6/44; the button is `rgb(219, 172, 44)`; the total is Roboto Bold 20. Latte × 2 and Traditional Espresso × 1 gives $19.80, $9.90, $29.70, $3.50, $33.20; the counter and Remove change the line, the totals, and the badge, and the changes stay after a reload. An unknown coffee id in `localStorage` is removed once the catalog loads. A real-browser axe scan (without `color-contrast`) reports no violation on the filled and the empty page.
- Screenshots `screenshots/checkout_desktop_after.png` (full page, cart of the spec example) and `screenshots/checkout_empty_desktop_after.png`, both 1440 px wide, taken with a Playwright script because the Playwright MCP is not loaded in this session.

## Consequences

- The summary cannot render without a `CartProvider` and a query client; the app has both in `AppProviders`.
- The spinner markup is now in two places (`CoffeeList` and `OrderSummary`). A shared component can replace it when a third use appears.
- `formatMoney` throws on a value that is not a non-negative whole number of cents. The fee is one by the API contract, so the page does not guard it; there is no error boundary yet.
- A coffee that is in the cart but missing from the catalog disappears silently from the cart; the visitor sees fewer rows, with no message.
- The unit tests of `OrderSummary` and the page run axe in jsdom (no contrast); the contrast pairs below AA stay as the owner decided.
- No new library.
