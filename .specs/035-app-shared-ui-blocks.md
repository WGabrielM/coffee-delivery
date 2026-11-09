# App: shared UI blocks, one quantity limit, and shared e2e helpers

## Scope
@apps/app/src/components/loading-state - New; `LoadingState`
@apps/app/src/components/error-state - New; `ErrorState`
@apps/app/src/components/text-link - New; `TextLink`
@apps/app/src/components/classes.test.tsx, @apps/app/src/components/components.test.ts - Add the three components and the router rule
@apps/app/src/features/catalog/coffee-list/CoffeeList.tsx, @apps/app/src/features/checkout/order-summary/OrderSummary.tsx, @apps/app/src/features/checkout/payment-card/PaymentCard.tsx, @apps/app/src/pages/OrderPage.tsx, @apps/app/src/pages/CheckoutPage.tsx - Use them
@apps/app/src/lib/quantity-limits.ts - New; `MIN_QUANTITY` and `MAX_QUANTITY`
@apps/app/src/components/counter/Counter.tsx, @apps/app/src/components/badge/Badge.tsx, @apps/app/src/features/cart/cart-reducer.ts - Use it
@apps/app/e2e/checkout-helpers.ts - `boxOf`, `fillTheSample`, `sampleAddress`, `createOrder`, and the coffee lookup, once
@apps/app/e2e - The specs that had their own copies use the helpers
@.docs/DESIGN_SYSTEM.md, @.docs/DEVELOPMENT.md, @.docs/ARCHITECTURE.md - Document the components, the rule, and the limit

## Context
Part of: Coffee Delivery capstone.
Depends on: @.specs/029-app-visual-parity.md
The structure audit of 2026-11-08 found copies. The loading block (a spinner and a text in an `output`) is written four times, the error block (an alert, a message, and a "Try again" button) four times, and the text link class string twice. The limits 1 and 99 of the quantity are defined in `Counter.tsx` and in `cart-reducer.ts`, and `Badge.tsx` has a literal 99. The end-to-end specs copy `boxOf` three times, `fillTheSample` twice, and `createOrder` twice, with the same address literal.

## Business needs
A change of a loading state, an error state, a link, or the quantity limit is made in one place, so the screens cannot drift apart.

## Acceptance Criteria
- `LoadingState` takes a text and renders the spinner (`data-spinner`, hidden from assistive technology, still under `prefers-reduced-motion`) and the text inside an `output`; `ErrorState` takes a message and an optional `onRetry` and renders `role="alert"`, the message, and, with `onRetry`, the secondary "Try again" button; `TextLink` takes `to` and children and renders the underlined `purple-dark` link at least 24 px high with the focus ring of the design.
- Every place that had its own copy uses the component, and the rendered DOM, the classes, the texts, and the roles are the same as before: no existing unit test changes except for its imports, and `visual-parity.spec.ts` and the responsive checks pass unchanged.
- Each new component has its test (every variant, the axe check from `src/test/axe.ts`), is rendered by `classes.test.tsx` so every class compiles, and is listed in `DESIGN_SYSTEM.md`.
- `TextLink` imports `Link` from `react-router`: the test that pins which component may import the router lists exactly `navbar` and `text-link`, and `DEVELOPMENT.md` says so.
- `src/lib/quantity-limits.ts` is the only place with 1 and 99: `Counter`, `Badge` (`99+`), and the cart reducer import it, and a test fails when a file under `src` other than the limits file, the tests, and the API mirror (`address-schema.ts` has its own limits) contains the number 99 as a quantity limit.
- Each of `boxOf`, `fillTheSample`, `sampleAddress`, `createOrder`, and the coffee lookup is defined once in `e2e/checkout-helpers.ts`; a test (or a command in the ADR) lists the duplicate definitions and finds none. The number of Playwright tests and their results do not change.
- `yarn code:fix`, `yarn lint`, `yarn types:check`, `yarn test`, `yarn test:e2e`, and `yarn build` pass.

## What to do
- Write the component tests first, then the components, then replace the copies one by one, running the tests after each.
- Keep the names the tests look for (`data-spinner`, "Loading your order…", "We couldn't load …", "Try again").
- Update the rule in `DEVELOPMENT.md` (components import no router, with the two exceptions) and the test that pins it.

## What not to do
- Do not change a color, a size, a text, or a behavior.
- Do not add a dependency or a state library.
- Do not move the chips, the cards, or the form components; only the three blocks.
- Do not rewrite the specs of the end-to-end tests beyond using the helpers.

## Result
One loading state, one error state, one text link, one quantity limit, and one set of end-to-end helpers, with the screens and the tests unchanged.

## Open questions
None
