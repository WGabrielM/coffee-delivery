# ADR: Architecture, guard the stated rules and make the pages compose

- Status: Accepted and verified
- Date: 2026-11-10
- Spec: [.specs/036-architecture-rules-and-page-composition.md](../.specs/036-architecture-rules-and-page-composition.md)
- Plan: [plans/036-architecture-rules-and-page-composition-plan.md](../plans/036-architecture-rules-and-page-composition-plan.md)

## Context

The structure audit of 2026-11-08 found that `ArchitectureTest` guarded fewer rules than `DEVELOPMENT.md` stated, that nothing said whether `application` may use Spring and `shared.error`, and that two pages decided things (`OrderPage` read the order and chose its states; `CheckoutPage` read the cart and kept the focus logic).

## Decisions

1. **`application` may use `@Service` and the exceptions of `shared.error`, and nothing else of Spring or of the web.** All five use cases are `@Service` and three throw `shared.error` exceptions; removing the annotation or adding a registration class would only move the same Spring knowledge. The rule is `onlyDependOnClassesThat` in `domain`, `application`, `shared.error`, `java..`, and `org.springframework.stereotype..`.
2. **Eight new rules** in `ArchitectureRules`, each with a fixture under `fixtures/violations` and a test that the rule fails on it: the application dependencies; `infrastructure` does not use `interfaces`; `shared` uses no slice; `@RestController` is an `interfaces` class named `*RequestHandler`; `@Service` is an `application` class named `*UseCase` (both by annotation, not by name); a handler depends on exactly one use case; a use case is used by exactly one handler; the domain has no `double`, `float`, `Double`, `Float`, or `BigDecimal`. The `clean` fixtures got the stereotypes and a second handler so they follow all rules, and one test checks that the application rule does not name a clean use case.
3. **The real code passed every rule at the first run** (no change in `src/main`): the 26 rule tests and the 15 tests on the real classes are green. The domain rule looks at fields, parameters, and returns, because ArchUnit does not report a primitive `double` as a dependency; a record component is a field.
4. **`OrderStatus` (`features/orders/order-status`) and `CartGate` (`features/checkout/cart-gate`)** hold what the pages decided: the loading, not found, failure, and confirmation states of an order, and the empty cart with the link and the focus after the last coffee is removed. The pages read the route and compose; the DOM, the texts, and the focus behavior are the same. `CheckoutPage` still owns its two-column layout and the one form.
5. **`pages/pages.test.ts` pins it:** a page imports no `@tanstack/*`, no `src/api`, no `features/*/api` module, and no cart context. The checker is a function with its own test that it catches each kind of import and lets a feature component, the router, and the components through.
6. **The tests moved with the code.** The order-state tests are now `OrderStatus.test.tsx` and the empty-cart tests `CartGate.test.tsx`, both through the real route and layout (so the navbar badge is still checked); `OrderPage.test.tsx` keeps one test for the route; `CheckoutPage.test.tsx` keeps the tests of the composition the page owns. The route render helper moved to `src/test/checkout.tsx`.

## Measured (2026-11-10)

| | Before | After |
| --- | --- | --- |
| ArchUnit rules on the real code | 7 | 15 |
| Tests of the rules on fixtures | 10 | 26 |
| Pages that read data or the cart | 2 | 0 |
| Vitest tests | 666 | 671 |
| Playwright tests | 195 | 195 |

## Consequences

- A rule the documents state fails the build when it is broken; a new rule comes with a fixture that breaks it.
- A new page starts from a feature component, not from a hook.
- The domain number rule keeps money in whole cents.
