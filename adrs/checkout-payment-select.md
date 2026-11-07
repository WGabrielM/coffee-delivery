# ADR: The payment card of the checkout

- Status: Accepted and verified
- Date: 2026-11-07
- Spec: [.specs/024-checkout-payment-select.md](../.specs/024-checkout-payment-select.md)
- Plan: [plans/024-checkout-payment-select-plan.md](../plans/024-checkout-payment-select-plan.md)

## Context

The customer chooses how to pay on delivery. The methods are a rule of the server (`GET /api/v1/checkout-config`), the design has three options of 179×51 px, and the choice must be part of the checkout form as the exact API code, so spec 025 can send it.

## Decisions

1. **The server decides the list, the app decides the look.** `payment-methods.ts` maps each API code (`credit_card`, `debit_card`, `cash`) to its label and icon. `paymentOptions(codes)` turns the codes of the config into options in the order of the config, dropping repeats and any code the map does not have. The card never lists the methods itself.
2. **The base group got an error state.** `SelectOptionGroup` gains `error?`: the message below the options (Text Regular S, `error`), `aria-invalid="true"` on the radio group, and `aria-describedby` to the message. The group is now wrapped in a `div` with the message; the options and the keyboard are unchanged.
3. **The form value is the API code, unset at first.** `checkoutFormSchema` has `paymentMethod: z.enum([...codes], { error: "Choose a payment method" })`, so the type is the union of the three codes. The default value is unset, so no option is selected. The default values are typed `DefaultValues` for this reason.
4. **The message shows on submit, not on blur.** The card does not pass `onBlur` to the form. A person who tabs through the radios and leaves has not made a mistake yet. After a submit, the form revalidates on every change, so the message goes when an option is chosen.
5. **The config is read once.** The card and the summary use `useCheckoutConfig()` with one cache key. The card has its own states: a spinner with "Loading payment methods…", an alert with "Try again" when the request fails, and "No payment method is available right now." when no code is known.
6. **Layout.** The payment card follows the address card in the left column, 12 px below it. Inside, the options are the group of spec 015: three columns of the 560 px inner width, 12 px apart (about 179 px each, 51 px high).
7. **Nothing about the payment is collected or sent.** The card has no field but the choice; the order is sent in spec 025.

## Verification

- Six QA commands pass: 563 Vitest tests (26 new: group error 4, methods 5, payment card 15, page 1, form 1; some existing form tests were updated for the required field), 96 root tests, the API suite unchanged, 69 Playwright tests (61 before, 8 new in `checkout-payment.spec.ts`, which call the real API), strict `tsc`, and `vite build` (CSS 25.27 kB, JS 514.34 kB, 159.25 kB gzip; 511.24 kB before).
- The tests were written before the code; I did not run them red as a separate step.
- Measured in Chromium at 1440×900: the options are 179×51 within 2 px, 12 px apart, on one line, starting on the 40 px padding of a 640 px card that is 12 px below the address card; the selected option is `rgb(235, 229, 249)` with a 1 px `rgb(128, 71, 248)` border, the idle ones `rgb(230, 229, 229)`; the radio values are `credit_card`, `debit_card`, and `cash`; a click, Space, and the arrow keys select as expected; a submit with no choice shows "Choose a payment method" in `rgb(204, 41, 55)` with `aria-invalid="true"`, and it goes when an option is chosen. A real-browser axe scan (without `color-contrast`) reports no violation, with and without the message.
- Screenshots `screenshots/checkout_desktop_after.png` (nothing selected) and `screenshots/checkout_filled_desktop_after.png` (sample address, credit card selected), 1440 px wide, taken with a Playwright script because the Playwright MCP is not loaded in this session.

## Consequences

- A failed submit shows the message but does not move the focus to the payment group when it is the only invalid part (the group has no field reference); the address fields still get the focus when they are invalid.
- The e2e tests submit the form with `requestSubmit()`, because the page has no submit button until spec 025.
- A payment method added by the server shows up only after the app knows its label and icon: a new code is ignored until `payment-methods.ts` has it.
- No new library.
