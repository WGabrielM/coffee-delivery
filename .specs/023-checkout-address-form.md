# Checkout: address form

## Scope
@apps/app/src/features/checkout/checkout-form - New; form container (React Hook Form) shared by the address and payment cards
@apps/app/src/features/checkout/address-card - New; the seven address fields
@apps/app/src/features/checkout/address-schema.ts - New; Zod schema
@apps/app/src/pages/checkout-page.tsx - Render the address card in the left column
@apps/app/src/features/checkout/*.test.tsx - New
@apps/app/e2e/checkout-address.spec.ts - New
@.docs/DESIGN.md, @.docs/BUSINESS.md - Document the fields and rules

## Context
Part of: Coffee Delivery capstone.
Depends on: @.specs/022-checkout-summary.md, @.specs/010-orders-create.md
The Figma address card has a pin icon (`#C47F17`), the title "Delivery address", the line "Enter the address where you want to receive your order", and seven inputs: ZIP code (200 px), Street (560), Number (200) with Complement (348, marked "Optional"), Neighborhood (200), City (276), and State (60); columns are 12 px apart and rows 16 px. The input border is `#E6E5E5` and turns `#C47F17` when active or filled. The API rules (spec 010) are: ZIP `^\d{5}-\d{3}$`, State `^[A-Z]{2}$`, Street, Number, Neighborhood, and City required, Complement up to 60 characters. The same form object will carry the payment choice (spec 024) and be sent by spec 025.

## Business needs
The customer enters a valid delivery address, and sees what is wrong with it before ordering.

## Acceptance Criteria
- The card shows the seven fields with the placeholders "ZIP code", "Street", "Number", "Complement", "Neighborhood", "City", and "State", the "Optional" hint on Complement, and the sizes above (bounding boxes at 1440 px within 2 px).
- Typing digits in ZIP code formats them as `00000-000` (the hyphen is added after the fifth digit and extra digits are ignored); typing in State turns letters into uppercase and stops at two letters.
- After a field loses focus, or on submit, an invalid field shows a message below it, has the error border `#CC2937`, `aria-invalid="true"`, and a linked `aria-describedby`; the messages are: "Enter a ZIP code like 12345-678", "Street is required", "Number is required", "Neighborhood is required", "City is required", "Enter the 2-letter state, like RS", and "Complement must have at most 60 characters".
- The schema accepts the sample address from the design (`90250-440`, `Rua João Daniel Martinelli`, `102`, empty complement, `Farrapos`, `Porto Alegre`, `RS`) and rejects the ZIP codes `1234-567` and `12345678`, the state `R`, and a street made only of spaces; the state `rs` is accepted because the field turns it into `RS`.
- Every field has an accessible name; an axe scan reports no violations; the order of focus follows the visual order.
- Screenshots `checkout_desktop_after.png` (empty form) and `checkout_filled_desktop_after.png` (design sample filled) at 1440×900 are taken with the Playwright MCP and attached to the end-of-task report.
- `yarn code:fix`, `yarn lint`, `yarn types:check`, `yarn test`, `yarn test:e2e`, and `yarn build` pass.

## What to do
- Write the schema tests first, then the form container, the card, and the masks.
- Build the container so the payment field (spec 024) and the submit (spec 025) join the same form without changing the address card.
- Keep the validation rules identical to the API rules and name the shared limits in one place in the schema.

## What not to do
- Do not look up addresses from the ZIP code or call any external service.
- Do not save the address in `localStorage` or in the cart.
- Do not add the payment card or the submit action.
- Do not design tablet or mobile layouts; spec 027 does.

## Result
The checkout page has a masked, validated address form that follows the design and the API rules.

## Open questions
None
