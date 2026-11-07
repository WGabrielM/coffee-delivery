# Plan 023: Checkout, the address form

- Number: 023
- Created: 2026-11-07
- Spec: [.specs/023-checkout-address-form.md](../.specs/023-checkout-address-form.md)

## Concept summary

The spec has no open question, so there was no interview. It puts the address card in the left column of `/checkout`, inside one form that the payment card (spec 024) and the submit (spec 025) join later. Choices, each recorded in `adrs/checkout-address-form.md`:

1. **One form for the whole checkout.** `CheckoutForm` (`features/checkout/checkout-form`) owns the values and the validation with React Hook Form and a Zod resolver, and shares them through the form context. It wraps both columns of the page, so the summary's Confirm order button can submit it later. It takes an optional `onSubmit`; until spec 025 a submit only validates.
2. **One schema, the API rules.** `address-schema.ts` has the Zod schema and names the shared limits once (ZIP pattern, state pattern, 60 characters, the digit counts the masks use). Text is trimmed, so spaces are blank. The schema is strict (`rs` fails); the masks give it the right shape.
3. **Masks are pure functions** (`address-masks.ts`): ZIP code keeps digits, at most eight, hyphen after the fifth (added with the sixth digit so deleting works); state keeps letters, in capitals, at most two. `FormInput` applies a mask in `onChange`.
4. **Validation timing:** `mode: "onTouched"`: a field is checked when it loses focus, then on every change; a submit checks all and focuses the first invalid field.
5. **`FormCard` and `FormInput` are shared parts.** `FormCard` (icon, title, line, 32 px gap, a fieldset named by its title) will hold the payment card too. `FormInput` connects the base `Input` to the form by name and shows the schema message.
6. **Sizes from the design** are widths on each field (200, 560, 200 + 348, 200 + 276 + 60), 12 px between columns, 16 px between rows, checked in the browser.
7. **Base `Input` types** accept `undefined` for `hint` and `error` (the project uses `exactOptionalPropertyTypes`).
8. **Nothing is stored:** no `localStorage`, no cart, no external lookup.

## Tasks

| # | Task | Files | Test first |
| --- | --- | --- | --- |
| 1 | Dependencies | `react-hook-form`, `zod`, `@hookform/resolvers` (exact versions) | |
| 2 | Schema | `features/checkout/address-schema.ts` | `address-schema.test.ts`: the design sample, the rejected values of the spec, every message |
| 3 | Masks | `features/checkout/address-masks.ts` | `address-masks.test.ts` |
| 4 | Form container | `checkout-form/CheckoutForm.tsx`, `checkout-form-schema.ts` | `CheckoutForm.test.tsx`: submit, messages, focus, trimmed values |
| 5 | Parts and card | `checkout-form/FormInput.tsx`, `FormCard.tsx`, `address-card/AddressCard.tsx` | `AddressCard.test.tsx`: fields, hint, order, masks, errors, axe |
| 6 | Page | `pages/CheckoutPage.tsx` | `CheckoutPage.test.tsx`: the card under the heading, one form |
| 7 | Browser tests | `e2e/checkout-address.spec.ts`, `e2e/checkout-helpers.ts` | Sizes, masks, messages, borders, tab order, axe |
| 8 | Screenshots 1440×900 | `checkout_desktop_after.png`, `checkout_filled_desktop_after.png` | A look |
| 9 | Docs | `DESIGN.md`, `BUSINESS.md`, `DESIGN_SYSTEM.md`, `ARCHITECTURE.md`, `QA.md`, `PLAN.md` | Root tests |
| 10 | Six QA commands | | Green |

## New dependencies

- `react-hook-form` 7.91.0: the form state and validation timing; the stack of the project already names it for the checkout.
- `zod` 4.6.7: the schema, the single source of the rules and the messages.
- `@hookform/resolvers` 7.0.3: connects the Zod schema to React Hook Form.

## Accessibility, responsiveness, observability

- Every field has a visually hidden label, `aria-invalid`, and `aria-describedby` to its message; the focus order is the visual order; a failed submit focuses the first invalid field.
- Desktop only (1440 px); tablet and mobile are spec 027.
- No server code, so no new trace or metric.

## QA steps and risks

- QA: the six commands, plus the manual steps in the report.
- Risk: the bundle grows with the three libraries (measured in the report).
- Risk: the 60 px State column wraps its message on four lines (the design fixes the width and the spec fixes the text).
- Risk: the form lives inside the page that shows it only with coffees in the cart, so emptying the cart and coming back starts with an empty form.
