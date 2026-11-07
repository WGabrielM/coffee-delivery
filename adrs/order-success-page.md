# ADR: The order confirmation page

- Status: Accepted and verified
- Date: 2026-11-07
- Spec: [.specs/026-order-success-page.md](../.specs/026-order-success-page.md)
- Plan: [plans/026-order-success-page-plan.md](../plans/026-order-success-page-plan.md)

## Context

After ordering, the customer must see that the order is confirmed, where it goes, when it should arrive, and how to pay. The page must work after a reload and from a shared link, so it cannot depend on the cart or on anything the checkout left in the browser.

## Decisions

1. **The order comes from the API by its id.** `useOrder(id)` reads `GET /api/v1/orders/{id}` (cache key `["orders", id]`). The checkout does not prime the cache and nothing is stored in `localStorage`: the page behaves the same after the checkout, after a reload, and in a new tab. The `Order` type is the one of spec 025.
2. **A presentational card, a page with the states.** `OrderConfirmation` takes the order and draws the title, the line, the card, and the illustration. `OrderPage` reads the id of the route and chooses between the order, loading, not found, and failure.
3. **The gradient border is a wrapper.** A CSS border cannot hold a gradient on a rounded box, so the card is an outer element with `bg-linear-to-br from-yellow to-purple`, 1 px of padding, and the corners 6/36/6/36, around an inner `ul` with the page background and the corners 5/35/5/35 (1 px smaller, so the visible border has the same shape). The direction (top left to bottom right) is my choice from a render of the design.
4. **Three rows, two lines each.** A 32 px circle (purple pin, yellow timer, yellow-dark dollar) and text in Text Regular M with the bold part in Text Bold M: "Delivery to **street, number**" over "neighborhood - city, state"; "Estimated delivery" over **"min min - max min"** from `estimatedDeliveryMinutes`; "Payment on delivery" over **the label**. The complement, the items, and the prices are not shown, as the design has none.
5. **The payment label comes from the app's map** (`PAYMENT_METHODS`, spec 024). A code the map does not know is shown as it came, because hiding the payment of a confirmed order would be worse than showing an unformatted word.
6. **Every state has one level 1.** The order has the title; a `404` has "Order not found" as a visible h1 with the link "Back to coffees"; loading and other failures have a hidden "Order confirmation". A malformed id is a `404` for the API, so it shows "Order not found" too. A failure that is not a `404` shows an alert and "Try again", which asks again.
7. **A 404 is not retried.** The query client of the app does not retry a 4xx, so the message shows at once; a test uses the real client of the app to pin that.
8. **Layout.** 80 px under the navbar; a grid of 526 px and 492 px with the illustration ending on x=1280 and sharing the card's bottom edge. The card is 526×270 (two 1 px borders, 40 px padding, three rows of two lines, two gaps of 32 px).

## Verification

- Six QA commands pass: 638 Vitest tests (32 new, in the hook, the card, and the page tests, plus a changed routes test), 96 root tests, the API suite unchanged, 92 Playwright tests (79 before, 13 new in `order-confirmation.spec.ts`), strict `tsc`, and `vite build` (CSS 27.33 kB, 5.91 kB gzip, from 25.27 kB; JS 521.58 kB, 160.94 kB gzip, from 518.38 kB).
- The tests were written before the code; I did not run them red as a separate step.
- Measured in Chromium at 1440×900 against orders created through the API: the h1 starts at x=160, the card is 526×270 within 2 px, the illustration is 492×293 and ends at x=1280 with its bottom on the card's bottom edge; the h1 is Baloo 2 ExtraBold 32 in `rgb(196, 127, 23)`, the line is Roboto 20 in `rgb(64, 57, 55)`; the wrapper has a `linear-gradient` with `rgb(219, 172, 44)` and `rgb(128, 71, 248)`, 1 px of padding, and the corners 6/36/6/36; the circles are 32 px in the three colors. The three payment codes show as Credit card, Debit card, and Cash. The complement and any `$` are absent. A reload shows the same page and the badge is empty. An unknown id and a malformed id show "Order not found" and the link goes home. A faked `500` shows the alert and "Try again" loads the order. A real-browser axe scan (without `color-contrast`) reports no violation on the order and on the not-found page.
- Screenshots `screenshots/success_desktop_after.png` (an order made through the real checkout) and `screenshots/success_not_found_desktop_after.png`, 1440 px wide, taken with a Playwright script because the Playwright MCP is not loaded in this session.

## Consequences

- The e2e tests create real orders in the local database (about 12 per run, plus the ones of the checkout tests). There is no cleanup endpoint.
- The `Order` type lives in `features/checkout/api.ts` (spec 025 asked for it there) and `features/orders` imports it from there. If the orders feature grows, the type can move to `features/orders`.
- The link style of "Back to coffees" repeats the one of "Browse coffees" in the empty cart. A shared text link is the next step if a third appears.
- The spinner markup is now in four places (the list, the summary, the payment card, and this page). It deserves a small shared component in the base set.
- No new library.
