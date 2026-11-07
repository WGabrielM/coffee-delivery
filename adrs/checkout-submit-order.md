# ADR: Sending the order from the checkout

- Status: Accepted and verified
- Date: 2026-11-07
- Spec: [.specs/025-checkout-submit-order.md](../.specs/025-checkout-submit-order.md)
- Plan: [plans/025-checkout-submit-order-plan.md](../plans/025-checkout-submit-order-plan.md)

## Context

The checkout form (specs 023 and 024) validates but sends nothing. The customer must confirm once and arrive at the confirmation, or learn exactly what to fix, and the cart must never be lost to a failure or cleared before the server agrees.

## Decisions

1. **The form owns the submit.** `CheckoutForm` uses `useCart()`, `useNavigate()`, and `useCreateOrder()`. The Confirm order button of the summary is a `type="submit"` button inside it, so the browser's own rules apply (Enter in a field submits when the button is enabled, and a disabled button blocks it).
2. **The summary stays free of the form.** It reads `isSubmitting` and `alertMessage` from `SubmitStateContext`, whose default is "not submitting"; outside a form the button simply does nothing. This kept its tests and its use from spec 022 as they were.
3. **The body is built from the cart.** `buildOrderRequest(lines, values)` returns `items` (`coffeeId` and `quantity`), `address`, and `paymentMethod`. The displayed prices are never read, and no field with `price`, `total`, `fee`, or `cents` is sent. The empty complement is sent as `""`; the API accepts it.
4. **Server errors are mapped by a pure function** (`mapOrderError`). A `400` sets each message under the field it names (`address.*` and `paymentMethod`, with the server's own sentence), and any other key (or none) shows the alert "Please review your order and try again."; a `422` shows "Some coffees are no longer available. Please review your cart."; a network error or any other status shows "We couldn't place your order. Please try again." An address key the form has no field for counts as an unknown key.
5. **The cart is cleared last.** After a `201` the app navigates to `/orders/<id>` with `replace` and waits for the navigation, then clears the cart. Clearing first would show "Your cart is empty" for a moment on the way out; `replace` means Back goes to the page before the checkout, not to a submitted form.
6. **One request per confirmation.** While the mutation runs the button is `disabled` and `aria-busy="true"`; the mutation never retries (a TanStack mutation does not by default, and the query client's retry setting applies to queries only). After a failure the button is enabled and the person decides.
7. **The alert takes the focus.** The button that had the focus is disabled during the request, so the alert (`role="alert"`, `tabIndex` -1) is focused when it appears, which also reads it. Field errors from the server focus the first such field. The alert is removed at the start of the next submit.
8. **The order types** (`Order`, `OrderRequest`) are in `features/checkout/api.ts`, as the spec says. The order page (spec 026) reads the same `Order`; the address `complement` is `string | null` there because the server stores no complement as `null`.

## Verification

- Six QA commands pass: 606 Vitest tests (43 new, plus the form, card, and summary tests that changed), 96 root tests, the API suite unchanged, 79 Playwright tests (69 before, 10 new in `checkout-submit.spec.ts`), strict `tsc`, and `vite build` (CSS 25.27 kB, JS 518.38 kB, 160.34 kB gzip; 514.34 kB before).
- The tests were written before the code; I did not run them red as a separate step.
- With the API running, the Playwright test fills the design sample, selects credit card, confirms, and lands on `/orders/<uuid>`. The request has only `items`, `address`, and `paymentMethod`; the address matches the sample (with the empty complement); the quantities are 2 and 1. The badge reads "Cart, empty" afterwards and Back goes to the home page. An invalid form shows all seven messages, focuses the ZIP code, and sends nothing. A double click sends one request while the answer is delayed. Answers faked at the network (`400` with fields, `400` with another key, `422`, `500`, a network error) show the expected messages, keep the cart and the values, and enable the button; after a `500` the next click goes through. A real-browser axe scan reports no violation with the alert shown.
- No screenshot was required by the spec.

## Consequences

- The Playwright tests that go through confirm create real orders in the local database (about three per run). There is no cleanup endpoint, so they stay there; the load tests and the orders tests already create data the same way.
- `CheckoutForm` now needs a query client, the cart, and a router above it. The tests use `renderCheckoutPage` (a memory router with `/checkout` and `/orders/:orderId`).
- A coffee that left the catalog is caught twice: the summary removes it from the cart when the catalog loads, and the server refuses it with `422` if it left in between.
- While the navigation runs after a `201`, the button stays busy; if the order page fails to load, the cart is already cleared, and the order exists on the server. Spec 026 shows an error with "Try again" there.
- No new library.
