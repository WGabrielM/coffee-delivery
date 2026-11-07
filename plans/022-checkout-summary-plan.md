# Plan 022: Checkout, the order summary

- Number: 022
- Created: 2026-11-07
- Spec: [.specs/022-checkout-summary.md](../.specs/022-checkout-summary.md)

## Concept summary

The spec has no open question, so there was no interview. It turns `/checkout` from a placeholder into the two-column page of the Figma, with the summary of the cart on the right. Choices, each recorded in `adrs/checkout-summary.md`:

1. **The page keeps its file name `CheckoutPage.tsx`** (the spec says `checkout-page.tsx`; the repository already names pages in PascalCase). It renders an `sr-only` level 1 "Checkout", so the headings go 1, 2, 2. An empty cart shows only "Your cart is empty" with a link "Browse coffees" to `/`; neither column renders.
2. **Layout:** a grid of two fixed columns, 640 px and 448 px, 32 px apart, in the 1120 px content (x=160 and x=832 at 1440 px). The left column is a section with the heading "Complete your order" and nothing else (specs 023 and 024 fill it). Tablet and mobile are spec 027.
3. **Data:** the summary reads the whole catalog with the existing `useCoffees()` (the home page shares its cache) and the fee with a new `useCheckoutConfig()` (`GET /api/v1/checkout-config`, key `["checkout-config"]`). Names and prices always come from the catalog; the cart keeps only ids and quantities.
4. **Money is computed in cents** by a pure module (`order-summary/pricing.ts`): line = unit price × quantity, items total = sum, total = items total + `deliveryFeeInCents`. Every amount is shown with `formatMoney`.
5. **Rows:** the 64 px photo, the name, the compact `Counter` (72×32), the `Button` "Remove" (secondary with the trash icon, named "Remove <name>" so the 8 rows are told apart; the visible text stays "Remove"), and the line price at the right in Roboto Bold 16. A 1 px divider separates the rows.
6. **The photo** moves out of `CoffeeCard` into a small `CoffeePhoto` component (image or the round placeholder for a slug the app has no photo for), so the card and the summary do not copy it. The card keeps its test and its look.
7. **Stale lines:** when the catalog is loaded, every cart line whose id is not in it is removed (an effect in the summary). A cart that ends empty shows the empty state.
8. **States:** loading shows a spinner with "Loading your order…" (`output`); an error shows an alert "We couldn't load your order." with "Try again", which asks again for whatever failed. The "Confirm order" button is always in the card and is disabled until both queries have data and at least one row is priced; it does nothing yet (spec 025).
9. **Accessibility:** the quantity change is heard through the counter's `output`; the total amount is an `output` too (a polite live region), so a change of the total is heard. After "Remove", the focus moves to the "Selected coffees" heading (so it is not lost); when the last line goes, the focus moves to the empty-state heading.

## Tasks

| # | Task | Files | Test first |
| --- | --- | --- | --- |
| 1 | Pricing | `features/checkout/order-summary/pricing.ts` | `pricing.test.ts`: 2 × 990 + 1 × 990, fee 350, missing coffee skipped, empty |
| 2 | Config hook | `features/checkout/api.ts` | `api.test.tsx`: URL, data, error |
| 3 | `CoffeePhoto` | `features/catalog/coffee-photo/CoffeePhoto.tsx`, `CoffeeCard.tsx` | `CoffeePhoto.test.tsx`; the card tests stay green |
| 4 | Order summary | `features/checkout/order-summary/OrderSummary.tsx` | `OrderSummary.test.tsx`: totals, counter, remove, stale lines, loading, error and retry, disabled button, axe |
| 5 | Page and routes | `pages/CheckoutPage.tsx` | `CheckoutPage.test.tsx`: empty state, columns, headings; `routes.test.tsx` adjusted |
| 6 | Test helpers | `src/test/checkout.tsx` | A fake API that answers `/coffees` and `/checkout-config` |
| 7 | Browser tests (need the API) | `e2e/checkout-summary.spec.ts` | Spec example, columns 640/448 at x=160/832, button 368×46, remove, empty |
| 8 | Screenshots 1440×900 | `screenshots/checkout_desktop_after.png`, `checkout_empty_desktop_after.png` | A look |
| 9 | Docs | `DESIGN.md`, `DESIGN_SYSTEM.md`, `ARCHITECTURE.md`, `QA.md`, `PLAN.md` | Root tests |
| 10 | Six QA commands | | Green |

## New dependencies

None.

## Accessibility, responsiveness, observability

- One `main` (from the layout); an `aria-labelledby` section per column; the rows are a list; every control has a name.
- Desktop only (1440 px), as the spec says.
- No new server code, so no new trace or metric. The page makes two GETs that the API already measures.

## QA steps and risks

- QA: the six commands, plus the manual steps in the report (the page with the cart of the spec example, the empty cart, the API stopped).
- Risk: `formatMoney` throws on an invalid number. The fee is a whole number of cents by the API contract, so the page does not guard it.
- Risk: the e2e tests need the API and port 5173 free.
