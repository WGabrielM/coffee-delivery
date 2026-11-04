# Orders: data model

## Scope
@apps/api/src/main/resources/db/migration/V3__create_orders_tables.sql - New; `orders`, `order_items`
@apps/api/src/test/java/com/coffeedelivery/orders/OrdersMigrationE2ETest.java - New
@.docs/ARCHITECTURE.md - Add the orders data model

## Context
Part of: Coffee Delivery capstone.
Depends on: @.specs/004-catalog-data-model.md
An order stores the address, the payment method, and the lines with a price snapshot, so later price changes never alter a past order. Money is an integer in cents. The order has no user, because the product has no accounts. The delivery fee is stored on the order.

## Business needs
Confirmed orders are stored in a form that keeps their totals correct forever.

## Acceptance Criteria
- After migration, `orders` has: `id` (UUID, generated), `status`, `payment_method`, `zip_code`, `street`, `number`, `complement` (nullable), `neighborhood`, `city`, `state`, `subtotal_in_cents`, `delivery_fee_in_cents`, `total_in_cents`, and `created_at` (timestamp with time zone, default now).
- After migration, `order_items` has: `id`, `order_id` (foreign key to `orders`, deleted with its order), `coffee_id` (foreign key to `coffees`, deletion restricted), `coffee_name`, `unit_price_in_cents`, `quantity`, and `line_total_in_cents`.
- The database rejects: a `status` other than `confirmed`; a `payment_method` outside `credit_card`, `debit_card`, `cash`; a `state` that is not two uppercase letters; a `quantity` below `1` or above `99`; a `unit_price_in_cents` or fee below `0`; two lines with the same `coffee_id` in one order; and an order whose `total_in_cents` is not `subtotal_in_cents + delivery_fee_in_cents`.
- Deleting a coffee that has an order line fails; deleting an order deletes its lines.
- The e2e test inserts a valid order with two lines (`1 × 990` and `2 × 990`, fee `350`, subtotal `2970`, total `3320`) and reads it back with the same values.
- `yarn test:e2e` and the other QA commands pass.

## What to do
- Write the e2e test first, with plain SQL against a Testcontainers Postgres, one assertion per rule above.
- Write the migration with named constraints so failures are readable.

## What not to do
- Do not add Java entities, repositories, or endpoints; specs 010 and 011 do.
- Do not add order statuses beyond `confirmed`, status history, or tracking events.
- Do not add a customer table or a user column.

## Result
The database can store confirmed orders with a price snapshot and rejects every invalid combination listed above.

## Open questions
None
