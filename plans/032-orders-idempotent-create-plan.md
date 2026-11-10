# Plan 032: Orders, idempotent create

- Number: 032
- Created: 2026-11-10
- Spec: [.specs/032-orders-idempotent-create.md](../.specs/032-orders-idempotent-create.md)

## Concept summary

The spec has no open question. Choices, each recorded in `adrs/orders-idempotent-create.md`:

1. **The unique index decides.** `orders.idempotency_key` is nullable and unique; the insert is `ON CONFLICT (idempotency_key) DO NOTHING`. When it inserts nothing the use case reads the order by key. No check in memory, so it holds in parallel and with more than one API instance.
2. **A fingerprint tells a replay from a conflict.** A SHA-256 of the items (in the order sent), the trimmed address, and the payment method is stored with the key. The same fingerprint is a replay (`200`), another one is a `422` on `Idempotency-Key`.
3. **Key and fingerprint live together** (a check constraint: both null or both set).
4. **The use case returns a result** (`CreateOrderResult(order, created)`), so the handler answers `201` or `200` without knowing why.
5. **App:** a small pure helper (`createIdempotencyKeys`) keeps the key while the built request is the same JSON, makes a new one when it changes, and resets after an order.
6. **Header parsing in the validator**, with the body errors, so a bad header and a bad body are reported together.

## Tasks

| # | Task | Files | Check |
| --- | --- | --- | --- |
| 1 | Migration V4 | `db/migration/V4__add_order_idempotency_key.sql` | `OrdersMigrationE2ETest` (columns, unique, check, many nulls) |
| 2 | Port and result types | `OrderRepository`, `StoredOrder`, `CreateOrderResult`, `CreateOrderCommand` | Compiles |
| 3 | Use case | `CreateOrderUseCase` | Unit: new key, replay, conflict, no key, unknown coffee, race |
| 4 | JDBC | `JdbcOrderRepository` | e2e: five answers, parallel |
| 5 | Header and `200` | `CreateOrderRequestValidator`, `CreateOrderRequestHandler` | Validator and handler tests |
| 6 | Load scenario | `orders-create.js`, `lib/http.js` | `yarn load:smoke` shape |
| 7 | App | `api/client.ts`, `checkout/api.ts`, `idempotency-keys.ts`, `CheckoutForm.tsx` | Vitest; Playwright lost-answer test |
| 8 | Docs, ADR, plan, PLAN.md | `.docs/*`, `adrs/`, `docs/PLAN.md` | Links |
| 9 | Six QA commands | | Green |

## New dependencies

None (`MessageDigest`, `HexFormat`, and `crypto.randomUUID()` are in the platforms).

## QA steps and risks

- QA: the six commands; the Playwright test aborts the first response after the server stored the order and clicks again.
- Risk: a default method on the repository interface skipped the class-level `@Transactional` (found by the e2e test `ifSavingALineFailsNoOrderRowIsStored`); the interface has no default method now.
- Risk: the migration needs the API of the dev database to restart.
