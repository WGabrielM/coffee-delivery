# ADR: Orders, quote the fee and the total from the server

- Status: Accepted and verified
- Date: 2026-11-10
- Spec: [.specs/039-orders-quote-endpoint.md](../.specs/039-orders-quote-endpoint.md)
- Plan: [plans/039-orders-quote-endpoint-plan.md](../plans/039-orders-quote-endpoint-plan.md)

## Context

The server computed the total of an order in `Order.place`, and the app computed it again for the summary (`pricing.ts`) with the fee read from `GET /api/v1/checkout-config`. Nothing checked that the two agreed, and a fee that depends on the address (a zone, a tax) could not be shown before the order was sent.

## Decisions

1. **`OrderTotals` is the one rule of the totals.** `OrderTotals.of(items, zipCode)` in `orders.domain` sums the lines, takes the fee from `DeliveryPolicy.deliveryFeeInCents(zipCode)` (350 cents for every ZIP code and for none: the parameter is where a rule by zone will go), and adds them. `Order.place` calls it, so the results of the order did not change (the existing order tests passed unchanged).
2. **`POST /api/v1/orders/quote`** takes `{ items, zipCode? }` (the item rules of the order; the ZIP code optional, `12345-678` when present) and answers `200` with the priced lines in the order sent, `subtotalInCents`, `deliveryFeeInCents`, `totalInCents`, and `currency`. It stores nothing and returns no id. An unknown coffee is `422` with `fields.items`, an invalid body is `400` with `fields` by path (`items[0].quantity`, `zipCode`).
3. **The lines are priced in one place.** `PricedItems` (package-private) reads names and prices from the catalog through `CoffeePriceLookup` and raises the `422`; `CreateOrderUseCase` and the new `QuoteOrderUseCase` use it. The handler has its own use case, so the rules of spec 036 (one use case per handler) hold.
4. **The app has no pricing code.** `pricing.ts` and its test are removed. `useQuote(lines, zipCode)` posts the lines, sends the ZIP code only when it is complete, is asked again when the cart or a complete ZIP code changes, and keeps the previous numbers while the new quote loads (`keepPreviousData`), so nothing flashes. The form shares what is typed in the ZIP code field with the summary through the form state context (`useWatch` in `CheckoutForm`, so only the ZIP code field triggers it); the quote is not asked on a keystroke of another field.
5. **The summary quotes only what the catalog knows.** It still reads the catalog for the photos and the names and removes a cart line the catalog no longer has (spec 022); it quotes the other lines, so a stale line cannot cause a `422`. A `422` that still happens (the server does not know a coffee) shows the error state with Try again.
6. **Confirm order waits for the quote**, including while a new quote loads (`isPlaceholderData`), so the total on the screen is the total that is charged. The line prices, the items total, the fee, and the total all come from the quote; `GET /api/v1/checkout-config` is unchanged and the payment card still reads the methods from it.
7. **Proof that the two agree, at four levels:** a domain test (a placed order and `OrderTotals.of` give the same numbers), a use case test (the quote and the created order have equal items and totals), an end-to-end test (the quote and the `201` body have equal `items`, `subtotalInCents`, `deliveryFeeInCents`, `totalInCents`, and `currency` for the sample cart: 29.70, 3.50, 33.20), and a browser test (the total of the summary, 33.20, is the `totalInCents` of the order that the checkout creates).
8. **The proxy does not limit the quote** (spec 038 limits only `POST /api/v1/orders`, an exact path), because the summary asks it often. `orders-quote.js` is a k6 scenario in every profile (3320 cents, with and without a ZIP code).

## Verified (2026-11-10)

- API: 170 unit and 113 end-to-end tests, coverage gate passed (new: `OrderTotalsTest`, `QuoteOrderUseCaseTest`, `QuoteOrderRequestHandlerTest`, `QuoteOrderE2ETest` with `200` with and without a ZIP code, `400`, `422`, no row written, and the quote equal to the order).
- App: 688 Vitest tests and 198 Playwright tests (1 new: the summary total equals the created order). The summary tests that read the totals right after a change of quantity now wait for the quote (three adapted), and the test that confirms right after a change waits for the button.
- k6 smoke on the running API, with the new scenario: all checks passed (933 of 933), `p(95)` 6 ms.

## Consequences

- A fee by zone or a tax changes `DeliveryPolicy` and `OrderTotals` only; the app and the quote follow.
- The summary needs one more request (the quote) than before, and one more each time the cart changes; the numbers wait for the server.
- The app cannot price an order offline; this is the cost of one rule.
