# ADR: App, shared UI blocks, one quantity limit, and shared e2e helpers

- Status: Accepted and verified
- Date: 2026-11-10
- Spec: [.specs/035-app-shared-ui-blocks.md](../.specs/035-app-shared-ui-blocks.md)
- Plan: [plans/035-app-shared-ui-blocks-plan.md](../plans/035-app-shared-ui-blocks-plan.md)

## Context

The structure audit of 2026-11-08 found copies: the loading block (a spinner and a text in an `output`) four times, the error block (an alert, a message, and Try again) four times, the text link classes twice; the quantity limits 1 and 99 in `Counter.tsx` and `cart-reducer.ts` with a literal 99 in `Badge.tsx`; and, in the end-to-end specs, `boxOf` three times, `fillTheSample` twice, `createOrder` and the address literal four times, and a coffee lookup twice.

## Decisions

1. **`LoadingState`, `ErrorState`, and `TextLink` in `src/components`**, each with a test (every variant and an axe check), rendered by `classes.test.tsx` so their classes compile, and listed in `DESIGN_SYSTEM.md`. They render the same DOM as the copies, so the screen tests, the visual comparison, and the responsive checks did not change.
2. **`ErrorState` takes `message` and an optional `onRetry`.** The submit alert of the checkout is another block (it has no retry and moves the focus) and stays where it is.
3. **The router rule has two exceptions, `navbar` and `text-link`.** The structure test lists exactly these two; `DEVELOPMENT.md` says so.
4. **`src/lib/quantity-limits.ts` is the only place with 1 and 99.** `Counter`, `Badge` (`99+` is `${MAX_QUANTITY}+`), `CoffeeCard`, and the cart reducer import it. A test reads every source under `src` and fails on the number 99 anywhere else (the tests and `src/test` aside); four comments that said 99 were reworded.
5. **One set of end-to-end helpers in `e2e/checkout-helpers.ts`:** `sampleAddress`, `field`, `drawn`, `fillTheAddress`, `fillTheSample`, `listCoffees`, `coffeeId`, and `createOrder` (with `paymentMethod`, `complement`, `coffeeName`, and `quantity`), next to the `boxOf` that was already there. Ten specs import them. `checkout-address.spec.ts` only fills the address, so it uses `fillTheAddress`; `fillTheSample` is that plus the credit card. `scripts/e2e-helpers.test.mjs` fails when one of these names is defined in another file, when a spec that used a copy stops importing the helper, and when a spec posts its own order.

## Measured (2026-11-10)

| | Before | After |
| --- | --- | --- |
| Loading block, error block, text link written out | 4, 4, 2 | 1, 1, 1 |
| Files with the quantity limits | 3 (two constants and a literal) | 1 |
| E2E definitions of `boxOf`, `fillTheSample`, `createOrder`, coffee lookup | 3, 2, 4, 2 | 1 each |
| Vitest tests | 651 | 666 (15 new: the components, the limits) |
| Script tests | 136 | 139 (3 new) |
| Playwright tests | 195 | 195 |
| Visual difference with the design | same masks, 2% limit | same |

## Consequences

- A loading, error, or link change is made once; a new screen that waits for the API starts from `LoadingState` and `ErrorState`.
- The two exceptions to the router rule are a test, not a habit: a third needs a new decision.
- No dependency, no state library.
