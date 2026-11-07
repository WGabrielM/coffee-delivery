# Plan 026: Order, the confirmation page

- Number: 026
- Created: 2026-11-07
- Spec: [.specs/026-order-success-page.md](../.specs/026-order-success-page.md)

## Concept summary

The spec has no open question, so there was no interview. It replaces the placeholder of `/orders/:orderId` with the page of the Figma, fed by `GET /api/v1/orders/{id}`. Choices, each recorded in `adrs/order-success-page.md`:

1. **The page reads the order from the API by its id** with a new `useOrder(id)` (key `["orders", id]`), so a reload shows the same page. The order type is the `Order` of spec 025. The page does not use the cart or `localStorage`, and the checkout does not prime the cache.
2. **`OrderConfirmation` is presentational** (`order` in, markup out): the title, the line, the card, and the illustration. `OrderPage` owns the states.
3. **The gradient border** is a wrapper with `bg-linear-to-br from-yellow to-purple` and 1 px of padding around the inner card; the wrapper has the corners 6/36/6/36 and the inner card 5/35/5/35, so the border keeps the shape.
4. **Rows:** a 32 px circle icon (purple pin, yellow timer, yellow-dark dollar) and two lines. The bold parts are the street and number, the estimate, and the payment label. The label comes from the app's map of spec 024; a code it does not know is shown as it came, so nothing is hidden. The complement and every price are left out.
5. **States:** loading (a spinner and "Loading your order…"), a `404` ("Order not found" as the h1, with "Back to coffees" to `/`; a malformed id is also a `404` from the API), and any other failure (an alert "We couldn't load your order." with "Try again"). Every state has one level 1; the loading and failure states have a hidden "Order confirmation".
6. **No retry of a 404:** the app's query client does not retry 4xx, so "Order not found" shows at once.
7. **Layout:** 80 px under the navbar, the card and the illustration in a grid (526 and 492 px), the illustration ending on x=1280 and sharing the card's bottom edge. Tablet and mobile are spec 027.

## Tasks

| # | Task | Files | Test first |
| --- | --- | --- | --- |
| 1 | Test helper | `src/test/orders.tsx` | |
| 2 | Hook | `features/orders/api.ts` | `api.test.tsx`: URL, encoding, 404, key, no retry on 404 |
| 3 | Confirmation | `order-confirmation/OrderConfirmation.tsx` | `OrderConfirmation.test.tsx`: title, rows, the three labels, no complement, no price, gradient, icons, alt, axe |
| 4 | Page | `pages/OrderPage.tsx`, `routes.test.tsx` | `OrderPage.test.tsx`: data, loading, not found, malformed id, failure and retry, badge, axe |
| 5 | Browser tests | `e2e/order-confirmation.spec.ts` | Real orders: texts, fonts, boxes, gradient, icons, labels, reload, not found, failure, axe |
| 6 | Screenshots 1440×900 | `success_desktop_after.png`, `success_not_found_desktop_after.png` | A look |
| 7 | Docs | `DESIGN.md`, `DESIGN_SYSTEM.md`, `ARCHITECTURE.md`, `BUSINESS.md`, `QA.md`, `PLAN.md` | Root tests |
| 8 | Six QA commands | | Green |

## New dependencies

None.

## Accessibility, responsiveness, observability

- One level 1 in every state; the card is a list named "Order details"; the illustration is decorative (`alt=""`); the failure is an alert.
- Desktop only (1440 px).
- No server code; `GET /api/v1/orders/{id}` is already traced and measured.

## QA steps and risks

- QA: the six commands, plus the manual steps in the report. The e2e tests create real orders through the API.
- Risk: the gradient direction (`to-br`) is a choice; the Figma was read from a render and shows a thin yellow-to-purple border.
