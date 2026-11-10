# ADR: Orders, idempotent create

- Status: Accepted and verified
- Date: 2026-11-10
- Spec: [.specs/032-orders-idempotent-create.md](../.specs/032-orders-idempotent-create.md)
- Plan: [plans/032-orders-idempotent-create-plan.md](../plans/032-orders-idempotent-create-plan.md)

## Context

When an order is stored but the answer is lost, the checkout shows "We couldn't place your order" and a second click creates a second order. Orders are paid on delivery, so a duplicate is a wasted trip. The health check of 2026-11-08 ranked this the first limit that would hurt a real customer.

## Decisions

1. **An optional `Idempotency-Key` header (a UUID).** Without it nothing changes. With it, the same key and request return the first order (`200`, same body and `Location`); the same key and another request is `422` with `fields["Idempotency-Key"]`; a header that is not a UUID is `400` with the same field name.
2. **The database decides, not memory.** `orders.idempotency_key` is nullable and unique; `INSERT ... ON CONFLICT (idempotency_key) DO NOTHING` returns zero rows when the key is taken, and the use case then reads the order by key. Two requests that arrive together create one row (8 threads in the e2e test: one `201`, seven `200`, one id), and the same holds with more than one API instance. The lines are inserted only when the order row was inserted, in the same transaction.
3. **A fingerprint tells a replay from a conflict.** `request_fingerprint` is the SHA-256 of the items in the order sent, the trimmed address (a missing complement is an empty string), and the payment method, joined with a NUL character. The key itself is not part of it. A check constraint keeps the key and the fingerprint both null or both set.
4. **A refused request does not use up its key.** The key is only stored with the order row, so a validation failure or a `422` for an unknown coffee stores nothing.
5. **The use case returns `CreateOrderResult(order, created)`.** The handler answers `201` or `200` from it. `OrderRepository.save` returns whether it stored the order. There is no default overload on the interface: a default method is declared by the interface, so Spring did not apply the class-level `@Transactional` of `JdbcOrderRepository` to it and a failing line left the order row behind (caught by an e2e test).
6. **App:** `createIdempotencyKeys()` keeps the key while the JSON of the built request is the same, makes a new one when it differs, and is reset after an order. A try again after a failure therefore replays safely, and a changed order never hits the conflict. The mutation still never retries by itself.
7. **k6:** `orders-create.js` sends a key, repeats the request, and checks the `200` and the same id.

## Consequences

- Keys are kept forever with the order: no expiry and no cleanup job (out of scope). Spec 038 decides retention.
- The response body is not stored: a replay reads the order, so it equals the first `201` body.
- Only `POST /api/v1/orders` uses the header.
- Migration `V4` adds two nullable columns; existing orders have no key.
- No new library.
