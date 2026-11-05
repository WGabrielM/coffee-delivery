# ADR: Checkout configuration

- Status: Accepted and verified
- Date: 2026-11-04
- Spec: [.specs/007-checkout-config.md](../.specs/007-checkout-config.md)
- Plan: [plans/007-checkout-config-plan.md](../plans/007-checkout-config-plan.md)

## Context

The checkout page shows a delivery fee, an estimate, and three payment methods. The order total (spec 010) must use the same values, so they cannot live in the app.

## Decisions

1. **Slice `orders`, started with `domain`, `application`, and `interfaces`.** There is no `infrastructure` yet because nothing is stored; specs 009 to 011 add it.
2. **`DeliveryPolicy` is the single place for the rules**: `CURRENCY = "USD"`, `DELIVERY_FEE_IN_CENTS = 350`, and `ESTIMATE` (`DeliveryEstimate(20, 30)`). It is a final class with constants, not a table or a flag, because the fee is fixed and does not depend on the address, the cart, or the time (spec). Spec 010 reads the same constants.
3. **`PaymentMethod` is an enum with a wire value** (`credit_card`, `debit_card`, `cash`) and `fromValue(String)` for spec 010. The constant order is the response order. The database check constraint of spec 009 repeats the three values; a test there keeps both in step.
4. **`CheckoutConfig` is a domain record**; `GetCheckoutConfigUseCase.execute()` builds it from the domain rules; `GetCheckoutConfigRequestHandler.handle()` maps it to `{ currency, deliveryFeeInCents, estimatedDeliveryMinutes { min, max }, paymentMethods }` in `CheckoutConfigResponse`.
5. **Tests pin the values.** `DeliveryPolicyTest` and `PaymentMethodTest` fail when the fee, the estimate, the currency, or the list of methods changes. The handler test compares the body strictly (`content().json(..., true)`), and `CheckoutConfigE2ETest` checks the exact key set against the running application.
6. **k6 scenario** `checkout-config.js` checks status 200 and a fee of 350.

## Consequences

- Changing the fee is a code change with a test change, never a data change.
- The estimate is a range in minutes for the whole order; there is no per-address estimate.
- No new library.
