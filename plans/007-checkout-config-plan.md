# Plan 007: Checkout configuration

- Number: 007
- Created: 2026-11-04
- Spec: [.specs/007-checkout-config.md](../.specs/007-checkout-config.md)

## Concept summary

No open question. Choices made in this plan, each recorded in `adrs/checkout-config.md`:

1. **New slice `orders`**, layers `domain`, `application`, `interfaces` (no `infrastructure` yet: nothing is stored). Specs 009 to 011 extend it.
2. **`DeliveryPolicy` is the one place for the fee, the currency, and the estimate.** A final class with constants: `CURRENCY = "USD"`, `DELIVERY_FEE_IN_CENTS = 350`, `ESTIMATE = 20 to 30 minutes` (`DeliveryEstimate` record). Spec 010 reads the same constants, so the checkout page and the order total cannot disagree.
3. **`PaymentMethod` is an enum** with the wire value of each constant (`credit_card`, `debit_card`, `cash`) and a lookup by value (spec 010 uses it to validate requests). The order of the constants is the order in the response.
4. **`CheckoutConfig` (domain record)** is what the use case returns; `GetCheckoutConfigUseCase.execute()` builds it from `DeliveryPolicy` and `PaymentMethod.values()`. The values are not read from a table or a flag (spec).
5. **The response is mapped in `interfaces`** (`CheckoutConfigResponse`): `currency`, `deliveryFeeInCents`, `estimatedDeliveryMinutes { min, max }`, `paymentMethods`.
6. **Tests pin the values**: `DeliveryPolicyTest` and `PaymentMethodTest` fail if the fee, the estimate, or the list of methods changes; the handler test compares the exact JSON; the e2e test calls the real endpoint.
7. **k6 scenario** `checkout-config.js` checks status 200 and the fee.

## Tasks

| # | Task | Test first |
| --- | --- | --- |
| 1 | `DeliveryPolicyTest`, `PaymentMethodTest` | Do not compile, then pass |
| 2 | `GetCheckoutConfigUseCaseTest` | idem |
| 3 | `GetCheckoutConfigRequestHandlerTest` (exact JSON) | idem |
| 4 | `CheckoutConfigE2ETest` | Fails with 404, then passes |
| 5 | Domain, use case, request handler | The tests above |
| 6 | k6 scenario and its entry in the index | `scripts/api-scripts.test.mjs` |
| 7 | Docs: `ARCHITECTURE.md` (endpoint and contract), `BUSINESS.md` (checkout rules) | Root documentation tests |

## New dependencies

None.
