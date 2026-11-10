# Plan 036: Architecture, guard the stated rules and make the pages compose

- Number: 036
- Created: 2026-11-10
- Spec: [.specs/036-architecture-rules-and-page-composition.md](../.specs/036-architecture-rules-and-page-composition.md)

## Concept summary

The spec has no open question. Choices, each recorded in `adrs/architecture-rules-and-page-composition.md`:

1. **Decision on `application`:** it may use `@Service` and the exceptions of `shared.error`, and nothing else of Spring or the web. The rule is one `onlyDependOnClassesThat` over `domain`, `application`, `shared.error`, `java..`, and `org.springframework.stereotype..`.
2. **Each new rule has a fixture that breaks it** under `fixtures/violations` and a test that the rule fails on it; the `clean` fixtures got the stereotypes and a handler for the second use case, so they follow every rule.
3. **Rules by annotation, not by name** for `@RestController` and `@Service`; the one-to-one rule between handlers and use cases counts distinct dependencies.
4. **The domain number rule looks at fields, parameters, and returns** (a record component is a field), because ArchUnit does not report a primitive `double` as a dependency.
5. **`OrderStatus` and `CartGate` hold what the pages decided.** The DOM, the texts, and the focus behavior are the same; `pages.test.ts` fails on a data or state import in a page.
6. **Tests follow the code:** the order states and the empty cart move to the feature test files; the page tests keep one test per route, plus the tests of the composition the checkout page still owns (the two columns, the one form).

## Tasks

| # | Task | Files | Check |
| --- | --- | --- | --- |
| 1 | Rules and fixtures first | `ArchitectureRules`, `ArchitectureRulesTest`, `fixtures` | Each rule fails on its fixture |
| 2 | The real code passes | `ArchitectureTest` | Nothing in `src/main` had to change |
| 3 | Pages test | `pages/pages.test.ts` | Fails on a forbidden import |
| 4 | `OrderStatus`, `CartGate` | `features/orders/order-status`, `features/checkout/cart-gate`, the two pages | Same DOM |
| 5 | Move the tests | `OrderStatus.test.tsx`, `CartGate.test.tsx`, `test/checkout.tsx` | Same tests pass |
| 6 | Docs, ADR, plan, PLAN.md | `.docs/*`, `adrs/`, `docs/PLAN.md` | |
| 7 | Six QA commands | | Green |

## New dependencies

None.

## QA steps and risks

- QA: the six commands; the Playwright count and the visual comparison are the same.
- Risk: a rule that passes on the real code for the wrong reason; each rule is proved on a fixture, and the clean fixtures prove it does not flag a good class.
