# ADR: The checkout form and the address card

- Status: Accepted and verified
- Date: 2026-11-07
- Spec: [.specs/023-checkout-address-form.md](../.specs/023-checkout-address-form.md)
- Plan: [plans/023-checkout-address-form-plan.md](../plans/023-checkout-address-form-plan.md)

## Context

The checkout needs a delivery address that follows the design and the API rules (spec 010), and it needs a form that the payment choice (spec 024) and the submit (spec 025) can join without changing the address card. The messages must show when a field loses focus or on submit, and the ZIP code and state fields must shape what is typed.

## Decisions

1. **One form for the whole checkout.** `CheckoutForm` owns the values and the validation (React Hook Form with a Zod resolver) and shares them through the form context. The page puts it around both columns, so the Confirm order button of the summary can submit it in spec 025. It takes an optional `onSubmit`; without it a submit only validates and shows the messages. Its values are `{ address }` and mirror the body of `POST /api/v1/orders`.
2. **One strict schema, named limits.** `addressSchema` (Zod 4) has the API rules: ZIP `^\d{5}-\d{3}$`, state `^[A-Z]{2}$`, trimmed required text for street, number, neighborhood, and city, and a complement of at most 60 characters counted after trimming. The pattern, the lengths, and the digit counts are constants in the same file and the masks import them. The schema does not repair input (`rs` fails): the fields do, and a test runs `maskState("rs")` through the schema.
3. **Masks are pure functions.** `maskZipCode` keeps digits, at most eight, with the hyphen after the fifth; the hyphen is added with the sixth digit, so Backspace removes a digit and the hyphen together and never gets stuck. `maskState` keeps the letters A to Z, in capitals, at most two. `FormInput` applies a mask in `onChange`, so the form always holds the masked text.
4. **Validation timing is `onTouched`.** A field is checked when it loses focus, then on every change, so a message goes away when the value is right. A submit checks everything and focuses the first invalid field. The browser's own validation is off (`noValidate`) so the only messages are the ones of the schema.
5. **Shared parts for the left column.** `FormCard` (icon, title, line, a `fieldset` named by its title, fields 32 px below) will hold the payment card too; `FormInput` connects the base `Input` to the form by name and passes the schema message as `error`. The address card holds no state and no logic.
6. **Sizes from the design.** Each field has the width of the design in a wrapper (200, 560, 200 + 348, 200 + 276 + 60); the rows are 16 px apart and the columns 12 px; the 42 px height, the borders, and the error color come from the base `Input`. All of it is measured in the browser.
7. **The base `Input` accepts `undefined`** for `hint` and `error` (`exactOptionalPropertyTypes` is on), so a wrapper can pass an optional message through. The `Icon` comment now says `FormCard` passes it a class too.
8. **Nothing is stored or looked up.** The form is not saved in `localStorage` or in the cart, and the ZIP code calls no service. The form lives inside the part of the page that shows coffees, so an emptied cart and a return start with an empty form.
9. **The Complement has no `maxLength`.** The message for 61 characters would never show if the field stopped typing at 60.

## Verification

- Six QA commands pass: 537 Vitest tests (71 new: schema and masks 45, form 5, card 20, page 1), 96 root tests, the API suite unchanged, 61 Playwright tests (51 before, 10 new in `checkout-address.spec.ts`, which fill the cart through the real API), strict `tsc`, and `vite build`.
- The schema and mask tests were run red first (the modules did not exist), then green. The card, form, and page tests were written before the code too; I did not run them red as a separate step.
- Measured in Chromium at 1440×900: the card is 640 px at x=160; ZIP code 200, Street 560, Number 200, Complement 348, Neighborhood 200, City 276, State 60, all 42 px high; 12 px between columns and 16 px between rows; the fields start on the 40 px padding. The idle border is `rgb(230, 229, 229)`, a filled field `rgb(196, 127, 23)`, an invalid one `rgb(204, 41, 55)`. Each of the seven messages shows, with `aria-invalid="true"` and an `aria-describedby` that contains the message id. Typing `902504409999` gives `90250-440`, and `rsx` gives `RS`. The sample of the design shows no message. Tab follows the visual order. A real-browser axe scan (without `color-contrast`) reports no violation, empty or with every message shown.
- Bundle: CSS 25.27 kB (24.81 before); JS 511.24 kB, 158.48 kB gzip (385.84 and 120.35 before). The three libraries add about 125 kB to the single bundle.
- Screenshots `screenshots/checkout_desktop_after.png` (empty form), `screenshots/checkout_filled_desktop_after.png` (the sample), and an extra `screenshots/checkout_errors_desktop_after.png`, 1440 px wide, taken with a Playwright script because the Playwright MCP is not loaded in this session.

## Consequences

- The address card cannot render without a `CheckoutForm` above it (the page and the tests provide it).
- Spec 024 adds `paymentMethod` to `checkoutFormSchema` and a card built from `FormCard`; spec 025 passes `onSubmit` and adds the submit; neither changes the address card.
- The State message wraps on four lines in its 60 px column. The design fixes the width and the spec fixes the text, so it stays.
- The bundle is one chunk, so the form libraries load on the home page too. Splitting the checkout route is a later step if it matters.
- The ZIP pattern, the state pattern, and the 60 characters exist in the API and in the app. A change must be made in both; there is no shared source between them.
- `yarn add` needed `--ignore-engines` here: `lint-staged` asks for Node 22.22.1 or newer and this machine has 22.22.0. The flag is not saved anywhere; without it `yarn add` stopped on that engine check.
- New libraries: `react-hook-form` 7.91.0, `zod` 4.6.7, `@hookform/resolvers` 7.0.3 (which brings `@standard-schema/utils` 0.3.0).
