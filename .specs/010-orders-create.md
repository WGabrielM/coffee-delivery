# Orders: create an order

## Scope
@apps/api/src/main/java/com/coffeedelivery/orders/domain - `Order`, `OrderItem`, `Address`, totals rule
@apps/api/src/main/java/com/coffeedelivery/orders/application - New; `CreateOrderUseCase`, `OrderRepository` and `CoffeePriceLookup` ports
@apps/api/src/main/java/com/coffeedelivery/orders/infrastructure - New; adapters for both ports
@apps/api/src/main/java/com/coffeedelivery/orders/interfaces - New; `CreateOrderRequestHandler` for `POST /api/v1/orders`
@apps/api/src/test/java/com/coffeedelivery/orders - New; unit and e2e tests
@apps/api/load/scenarios/orders-create.js - New
@.docs/ARCHITECTURE.md, @.docs/BUSINESS.md - Document the contract and the pricing rule

## Context
Part of: Coffee Delivery capstone.
Depends on: @.specs/009-orders-data-model.md, @.specs/007-checkout-config.md
The cart lives in the browser, so the server receives only coffee ids, quantities, the address, and the payment method. The server must never trust prices from the client. The `orders` slice does not import the `catalog` slice: it reads coffee prices through its own `CoffeePriceLookup` port. The design address has seven fields; ZIP codes use the design format `00000-000`.

## Business needs
A customer confirms an order and gets a stored order whose prices, fee, and total are computed by the server.

## Acceptance Criteria
**Request**
- `POST /api/v1/orders` accepts `{ "items": [{ "coffeeId", "quantity" }], "address": { "zipCode", "street", "number", "complement", "neighborhood", "city", "state" }, "paymentMethod" }`; `complement` is optional.

**Validation (`400`, error code `validation_failed`, `fields` keyed by JSON path such as `address.zipCode`)**
- `items` must have at least one entry; `coffeeId` must be a UUID; `quantity` must be an integer from `1` to `99`; the same `coffeeId` twice is rejected in `fields.items`.
- `zipCode` must match `^\d{5}-\d{3}$`; `state` must match `^[A-Z]{2}$`; `street`, `number`, `neighborhood`, and `city` must be non-blank after trimming, and `complement` is at most 60 characters.
- `paymentMethod` must be one of `credit_card`, `debit_card`, `cash`.
- A `coffeeId` that is a valid UUID but not in the catalog returns `422` and error code `unprocessable_content` with `fields.items` naming the id.

**Result**
- A valid request returns `201`, a `Location` header `/api/v1/orders/{id}`, and the order: `id`, `status` `confirmed`, `items` (each with `coffeeId`, `name`, `quantity`, `unitPriceInCents`, `lineTotalInCents`), `address`, `paymentMethod`, `subtotalInCents`, `deliveryFeeInCents`, `totalInCents`, `currency` `USD`, `estimatedDeliveryMinutes` `{ "min": 20, "max": 30 }`, and `createdAt`.
- A test orders 1 × one coffee and 2 × another at `990` cents: `subtotalInCents` is `2970`, `deliveryFeeInCents` is `350`, and `totalInCents` is `3320`.
- A request that also sends `priceInCents`, `unitPriceInCents`, or `totalInCents` anywhere in the body is accepted and those values are ignored; the stored prices come from the catalog.
- If saving any line fails, no order row is stored (transaction test).
- `apps/api/load/scenarios/orders-create.js` creates an order and checks status `201` and total `3320`; `yarn load:smoke` reports no failed check.
- The architecture test stays green and `yarn code:fix`, `yarn lint`, `yarn types:check`, `yarn test`, `yarn test:e2e`, and `yarn build` pass.

## What to do
- Write the tests first, then validation, domain totals, use case, adapters, request handler, and scenario.
- Take the fee and the estimate from `DeliveryPolicy` (spec 007) and store the fee on the order.
- Keep the validation messages in en-US and readable by end users.

## What not to do
- Do not add authentication, idempotency keys, rate limiting, or payment processing.
- Do not look up the address or check that the ZIP code exists.
- Do not add stock checks, coupons, or order updates.
- Do not import classes from the `catalog` slice.

## Result
`POST /api/v1/orders` validates the request, prices the order on the server, stores it atomically, and returns the confirmed order with its totals.

## Open questions
None
