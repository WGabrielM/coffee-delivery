# Architecture: guard the stated rules and make the pages compose

## Scope
@apps/api/src/test/java/com/coffeedelivery/architecture/ArchitectureRules.java - New rules
@apps/api/src/test/java/com/coffeedelivery/architecture/ArchitectureRulesTest.java, @apps/api/src/test/java/com/coffeedelivery/architecture/fixtures - A violating fixture for each new rule
@apps/api/src/main/java - Only what a new rule needs to pass (expected: nothing)
@apps/app/src/pages/OrderPage.tsx, @apps/app/src/pages/CheckoutPage.tsx - Only compose features
@apps/app/src/features/orders/order-status - New; the loading, not found, failure, and confirmation states of an order
@apps/app/src/features/checkout/cart-gate - New; the empty cart and the focus after the last coffee is removed
@apps/app/src/pages/pages.test.ts - New; a test that pages import no data or state code
@.docs/DEVELOPMENT.md, @.docs/ARCHITECTURE.md - State the rules the tests now guard, and the decision on `application`

## Context
Part of: Coffee Delivery capstone.
Depends on: @.specs/035-app-shared-ui-blocks.md, @.specs/003-api-foundation.md
The structure audit of 2026-11-08 found that `ArchitectureTest` guards fewer rules than `DEVELOPMENT.md` states, and that two pages break the rule that pages only compose features. In the API, all five use cases import `org.springframework.stereotype.Service` and three throw exceptions of `shared.error`, and no rule or document says if that is allowed. The rules that nothing guards are: a handler depends on exactly one use case and a use case serves exactly one handler; `infrastructure` does not import `interfaces`; `shared` does not import a slice; the domain has no `double`, `float`, or `BigDecimal`; and the classes with `@RestController` or `@Service` are not selected by their names. In the app, `OrderPage` reads the order and decides its states, and `CheckoutPage` reads the cart and keeps the focus logic.

## Business needs
The rules of the structure fail a build when they are broken, so the code stays easy to change as it grows.

## Acceptance Criteria
**API**
- Decision, recorded in the ADR and in `DEVELOPMENT.md`: `application` may use `org.springframework.stereotype.Service` and the exceptions of `shared.error`, and nothing else of Spring or of the web.
- New rules in `ArchitectureRules`, each with a fixture under `fixtures/violations` that breaks it and a test that the rule fails on it, and the real code passes all of them:
  - `application` depends on `domain`, its own slice, `shared.error`, `java.*`, and `org.springframework.stereotype..` only.
  - `infrastructure` does not depend on `interfaces`.
  - `shared` does not depend on any slice.
  - Every class annotated `@RestController` is in `interfaces` and named `*RequestHandler`; every class annotated `@Service` is in `application` and named `*UseCase`.
  - Each request handler depends on exactly one use case, and each use case is used by exactly one handler.
  - Classes of `domain` have no field, parameter, or return type of `double`, `float`, `Double`, `Float`, or `BigDecimal`.
- The existing rules and fixtures stay, and the API tests and coverage pass.

**App**
- `OrderPage` and `CheckoutPage` only choose what to show from the route, and render features: the states of an order are in `features/orders/order-status` and the cart gate (the empty cart, the link, and the focus) is in `features/checkout/cart-gate`. Every existing unit and browser test passes, and the DOM, the texts, and the focus behavior do not change.
- `pages/pages.test.ts` fails when a file in `src/pages` imports `@tanstack/react-query`, `src/api`, a `features/*/api` module, or the cart context, and passes for the new pages.
- The tests that were written against the pages are moved to the features they test, and the page tests keep one test for each route.
- `yarn code:fix`, `yarn lint`, `yarn types:check`, `yarn test`, `yarn test:e2e`, and `yarn build` pass.

## What to do
- Write each rule and its fixture first (the rule must fail on the fixture), then make the real code pass; write the pages test first, then move the code.
- Follow the pattern of the existing rules and fixtures.
- Fix a violation in the smallest place if a new rule finds one, and list it in the report.

## What not to do
- Do not remove `@Service` from the use cases or add a registration class.
- Do not weaken or delete an existing rule or fixture.
- Do not add a rule for a thing the documents do not state.
- Do not change a behavior, a text, or a style in the app.

## Result
The structure rules the documents state are enforced by tests, and the pages of the app only compose.

## Open questions
None
