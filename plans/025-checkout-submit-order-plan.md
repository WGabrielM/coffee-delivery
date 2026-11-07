# Plan 025: Checkout, submit the order

- Number: 025
- Created: 2026-11-07
- Spec: [.specs/025-checkout-submit-order.md](../.specs/025-checkout-submit-order.md)

## Concept summary

The spec has no open question, so there was no interview. It makes the Confirm order button send the order and handles every outcome. Choices, each recorded in `adrs/checkout-submit-order.md`:

1. **`CheckoutForm` owns the submit.** It uses the cart, the router, and the new `useCreateOrder()` mutation; the Confirm order button of the summary is a `type="submit"` button of that form. The summary stays free of form state: it reads a small `SubmitStateContext` (`isSubmitting`, `alertMessage`) whose default is "not submitting", so it still renders outside a form.
2. **The request comes from the cart.** `buildOrderRequest(lines, values)` returns `items` (coffee id and quantity), `address`, and `paymentMethod`: no price field, ever.
3. **Error mapping is a pure function** (`mapOrderError`): a `400` puts each message under its field (`address.*` and `paymentMethod`), and any other key (or no key) shows "Please review your order and try again."; a `422` shows "Some coffees are no longer available. Please review your cart."; a network error or any other status shows "We couldn't place your order. Please try again."
4. **Success order:** navigate to `/orders/<id>` with `replace`, wait for it, then clear the cart, so the checkout never shows "Your cart is empty" on the way out and Back does not return to the form.
5. **One request per confirmation:** the button is `disabled` and `aria-busy` while the mutation runs; the mutation never retries (TanStack mutations do not by default).
6. **The alert** is `role="alert"` above the button, inside the summary card, and takes the focus when it appears (the button that had the focus was disabled while the request ran). Field errors from the server focus the first field.
7. **The order types** (`Order`, `OrderRequest`) live in `features/checkout/api.ts` as the spec says; spec 026 reads the same `Order`.

## Tasks

| # | Task | Files | Test first |
| --- | --- | --- | --- |
| 1 | Test helper: the order endpoint, a render with the router | `src/test/checkout.tsx` | |
| 2 | Order types and mutation | `features/checkout/api.ts` | `api.test.tsx`: URL, body, errors, no retry |
| 3 | Request builder | `checkout-form/order-request.ts` | `order-request.test.ts` |
| 4 | Error mapping | `checkout-form/submit-errors.ts` | `submit-errors.test.ts`: 400 (fields, other keys, none), 422, others |
| 5 | Submit flow, submit state, button, alert | `CheckoutForm.tsx`, `submit-state.tsx`, `OrderSummary.tsx` | `CheckoutSubmit.test.tsx`: invalid, valid, busy, 201, 400, 422, 500, network, alert |
| 6 | Browser tests | `e2e/checkout-submit.spec.ts` | The real order, Back, double click, each outcome, axe |
| 7 | Docs | `BUSINESS.md`, `DESIGN_SYSTEM.md`, `ARCHITECTURE.md`, `QA.md`, `PLAN.md` | Root tests |
| 8 | Six QA commands | | Green |

## New dependencies

None.

## Accessibility, responsiveness, observability

- The alert is `role="alert"` and takes the focus; the button is `aria-busy` while it runs; an invalid submit focuses the first invalid field.
- Desktop only (1440 px).
- The server already traces and measures `POST /api/v1/orders`; the app adds no telemetry.

## QA steps and risks

- QA: the six commands, plus the manual steps in the report. The first e2e tests create real orders in the local database.
- Risk: an order created in a test stays in the local database (there is no cleanup endpoint).
- Risk: if the navigation is slow the person sees the busy button until the page changes.
