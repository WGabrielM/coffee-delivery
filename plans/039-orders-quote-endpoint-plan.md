# Plan 039: Orders, quote the fee and the total from the server

- Number: 039
- Created: 2026-11-10
- Spec: [.specs/039-orders-quote-endpoint.md](../.specs/039-orders-quote-endpoint.md)

## Concept summary

The spec has no open question. Choices, each recorded in `adrs/orders-quote-endpoint.md`:

1. **One rule, in the domain.** `OrderTotals.of(items, zipCode)` is the subtotal, the fee (`DeliveryPolicy.deliveryFeeInCents(zipCode)`, 350 for every ZIP code and for none), and the total. `Order.place` uses it, and so does the quote, so a quote and the order created for the same cart are equal by construction, and a unit test, an end-to-end test, and a browser test say so.
2. **One way to price the lines.** `PricedItems` (package-private in `application`) reads names and prices from the catalog and raises the `422`; `CreateOrderUseCase` and `QuoteOrderUseCase` both use it, and the existing order tests did not change.
3. **A new endpoint with its own handler and use case**, under the rules of spec 036 (one use case per handler). `QuoteOrderRequestValidator` reuses the item rules of the order; the ZIP code is optional and checked when present.
4. **The app has no pricing.** `useQuote(lines, zipCode)` asks the server, keeps the previous numbers while a new answer loads (`keepPreviousData`), and sends the ZIP code only when complete (the form shares it with the summary through the form state context). The summary still reads the catalog, for photos and names, and removes lines the catalog does not have; it quotes only the lines the catalog knows, so a stale line cannot make a `422`.
5. **Confirm order waits for the quote**, also while a new quote loads, so the number on the screen is the number that is charged.
6. **The fake server of the unit tests follows the same rule** (prices from the catalog, the fee of the config, the total as the sum), so the summary tests stay fast and exact.

## Tasks

| # | Task | Files | Check |
| --- | --- | --- | --- |
| 1 | Domain rule and its tests | `OrderTotals`, `DeliveryPolicy`, `Order`, `OrderTotalsTest` | The order tests pass unchanged |
| 2 | Use case and tests | `PricedItems`, `QuoteOrderUseCase`, `QuoteOrderUseCaseTest` | Quote equals order |
| 3 | Endpoint | `QuoteOrderRequest`, `QuoteOrderRequestValidator`, `QuoteResponse`, `QuoteOrderRequestHandler`, handler test | 200, 400, 422 |
| 4 | End to end | `QuoteOrderE2ETest` | With and without ZIP, no row, equal to the order |
| 5 | k6 | `orders-quote.js`, `scenarios/index.js` | Smoke |
| 6 | App | `api.ts`, `OrderSummary`, `CheckoutForm`, `submit-state`, `pricing.ts` removed | Unit tests |
| 7 | Browser | `checkout-submit.spec.ts` | Summary total equals the order |
| 8 | Docs, ADR, plan, PLAN.md | `.docs/*`, `adrs/`, `docs/PLAN.md` | |
| 9 | Six QA commands | | Green; coverage at least 80% |

## New dependencies

None.

## QA steps and risks

- QA: the six commands; the k6 smoke profile, which now includes `orders-quote.js`.
- Risk: tests that changed the quantity and read the totals at once now wait for the quote (three tests were adapted), and a test that confirms right after a change waits for the button, because Confirm order is disabled while a new quote loads.
- Risk: the dev API of the machine must be the new one for the browser tests; the owner restarted it.
