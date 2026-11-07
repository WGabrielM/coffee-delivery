# Plan 024: Checkout, the payment method

- Number: 024
- Created: 2026-11-07
- Spec: [.specs/024-checkout-payment-select.md](../.specs/024-checkout-payment-select.md)

## Concept summary

The spec has no open question, so there was no interview. It adds the payment card to the left column, as a part of the checkout form of spec 023. Choices, each recorded in `adrs/checkout-payment-select.md`:

1. **One map from the API code to the label and the icon** (`payment-methods.ts`). The card lists the codes that `GET /api/v1/checkout-config` returns, in its order, through that map; a code the map does not have is ignored, and the card lists no method itself.
2. **The card reuses `FormCard` and the base `SelectOptionGroup`** (a native radio group, spec 015), named "Payment method". The group gains an `error` prop (message below, `aria-invalid`, `aria-describedby`), with its tests, because the base component had no error state.
3. **The form value is the API code.** `checkoutFormSchema` gets `paymentMethod: z.enum(codes)` with the message "Choose a payment method"; nothing is selected at first (the default is unset).
4. **The message shows on submit, not on blur.** A radio group is not "left empty" when the person tabs through it, so the card does not report `onBlur`; after a submit the form revalidates on change, so the message goes away when an option is chosen.
5. **Loading, error, and empty states:** the card reads the same config query as the summary (one request). While it loads it shows a spinner and "Loading payment methods…"; on failure an alert with "Try again"; with no known method "No payment method is available right now."
6. **Layout:** the two cards are 12 px apart in the left column (the heading is 16 px above them).
7. **No payment data** is collected, and nothing is sent (spec 025).

## Tasks

| # | Task | Files | Test first |
| --- | --- | --- | --- |
| 1 | Group error state | `components/select-option/SelectOptionGroup.tsx` | `SelectOptionGroup.test.tsx`: message, `aria-invalid`, `aria-describedby`, axe |
| 2 | Methods map | `features/checkout/payment-methods.ts` | `payment-methods.test.ts`: the three methods, order, unknown, repeats |
| 3 | Form schema | `checkout-form/checkout-form-schema.ts` | Through `CheckoutForm.test.tsx` and the card tests |
| 4 | Payment card | `payment-card/PaymentCard.tsx` | `PaymentCard.test.tsx`: options, mouse, Space, arrows, form value, required, states, axe |
| 5 | Page | `pages/CheckoutPage.tsx` | `CheckoutPage.test.tsx`: the card under the address card |
| 6 | Browser tests | `e2e/checkout-payment.spec.ts` | 179×51, selected colors, keyboard, codes, required message, axe |
| 7 | Screenshots 1440×900 | `checkout_desktop_after.png`, `checkout_filled_desktop_after.png` | A look |
| 8 | Docs | `DESIGN.md`, `BUSINESS.md`, `DESIGN_SYSTEM.md`, `ARCHITECTURE.md`, `QA.md`, `PLAN.md` | Root tests |
| 9 | Six QA commands | | Green |

## New dependencies

None.

## Accessibility, responsiveness, observability

- A radio group named "Payment method" with native radios (Tab enters once; arrows move the selection); the message is linked with `aria-describedby`; the group is `aria-invalid` after a failed submit.
- Desktop only (1440 px); tablet and mobile are spec 027.
- No server code, so no new trace or metric. The page makes no new request (the config is shared).

## QA steps and risks

- QA: the six commands, plus the manual steps in the report.
- Risk: a failed submit does not move the focus to the payment group (the group has no field ref); the message is read through `aria-describedby` and the live region.
- Risk: the e2e tests need the API for the config.
