# Plan 035: App, shared UI blocks, one quantity limit, and shared e2e helpers

- Number: 035
- Created: 2026-11-10
- Spec: [.specs/035-app-shared-ui-blocks.md](../.specs/035-app-shared-ui-blocks.md)

## Concept summary

The spec has no open question and asks for no visible change. Choices, each recorded in `adrs/app-shared-ui-blocks.md`:

1. **Three components copied from the DOM that exists.** `LoadingState`, `ErrorState`, and `TextLink` render exactly the markup, classes, texts, and roles of the four, four, and two copies, so no existing screen test changes and the visual comparison is untouched.
2. **`ErrorState` has an optional retry**, because the block is an alert with a message and sometimes a button; the checkout submit alert is a different block and stays.
3. **`TextLink` is the second component allowed to import the router**; the structure test lists exactly `navbar` and `text-link`.
4. **One limits file.** `src/lib/quantity-limits.ts` holds 1 and 99; `Counter`, `Badge`, `CoffeeCard`, and the cart reducer import it, and a test scans `src` for the number elsewhere (comments that said 99 were reworded).
5. **One set of e2e helpers.** `checkout-helpers.ts` gets `sampleAddress`, `field`, `drawn`, `fillTheAddress`, `fillTheSample`, `listCoffees`, `coffeeId`, and `createOrder`; the specs import them. `scripts/e2e-helpers.test.mjs` fails when a helper is defined twice.

## Tasks

| # | Task | Files | Check |
| --- | --- | --- | --- |
| 1 | The three components, tests first | `components/loading-state`, `error-state`, `text-link` | Every variant, axe |
| 2 | Replace the copies | `CoffeeList`, `OrderSummary`, `PaymentCard`, `OrderPage`, `CheckoutPage` | Existing tests unchanged |
| 3 | Structure tests | `components.test.ts`, `classes.test.tsx` | Router rule, classes compile |
| 4 | One limits file | `lib/quantity-limits.ts` and its test, `Counter`, `Badge`, `cart-reducer`, `CoffeeCard` | The scan finds no other 99 |
| 5 | E2E helpers | `e2e/checkout-helpers.ts`, ten specs, `scripts/e2e-helpers.test.mjs` | No duplicate; same tests pass |
| 6 | Docs, ADR, plan, PLAN.md | `.docs/*`, `adrs/`, `docs/PLAN.md` | |
| 7 | Six QA commands | | Green; the number of Playwright tests is unchanged |

## New dependencies

None.

## QA steps and risks

- QA: the six commands; the Playwright count and the visual comparison are the same as before.
- Risk: the classes test queried `alert` on the whole document; it now queries inside its container, because the new components are rendered with the other variants.
