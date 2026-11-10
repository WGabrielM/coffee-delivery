# Plan 038: Orders, address retention and a rate limit

- Number: 038
- Created: 2026-11-10
- Spec: [.specs/038-orders-address-retention-and-rate-limit.md](../.specs/038-orders-address-retention-and-rate-limit.md)

## Concept summary

The spec has no open question. Choices, each recorded in `adrs/orders-address-retention-and-rate-limit.md`:

1. **One migration (`V5`)** makes the address columns nullable and adds `address_cleared_at`, with one check: the columns are all present for an order that is not cleared and all null for one that is. The other rules of the address still hold, and the existing orders are not changed.
2. **The days are a bean, not an annotation.** The rule of spec 036 lets `application` use only the stereotype of Spring, so `RetentionPolicy` is a plain record (it refuses less than 1 day) that an `infrastructure` configuration builds from `orders.retention.days`.
3. **One use case, one port, one `UPDATE`.** `ClearOldAddressesUseCase` computes the cutoff from the injected `Clock`; `JdbcOrderAddressRetention` clears in one statement with `address_cleared_at IS NULL`, so a second run, or a second instance, does nothing.
4. **A job is an entry point.** `ClearOldAddressesJob` (`@Scheduled(cron = "${orders.retention.cron}")`) has no request handler, so the rule of spec 036 that a use case is used by exactly one handler became "by exactly one request handler or scheduled job", proved on fixtures.
5. **The response says how many days.** The order carries `addressRetentionDays`, so the page can write "removed after 90 days" with the configured number; the address is `null` once cleared.
6. **The limit is at the proxy**, with a map so only `POST` is counted, one zone (10 per minute), a burst of 5, a `429` with the API error body, and a `Retry-After`. No limit in the API (it would not hold with more than one instance).
7. **A k6 script for the limit** runs against the packaged app: 20 requests a second for 30 s from one client; it must see `429` and no more than the allowed number of orders.

## Tasks

| # | Task | Files | Check |
| --- | --- | --- | --- |
| 1 | Migration and its tests | `V5__...sql`, `OrdersMigrationE2ETest` | Check, columns, rules |
| 2 | Use case tests first, then code | `ClearOldAddressesUseCaseTest`, `RetentionPolicy`, the port, the use case | 89 days kept, 91 cleared, once |
| 3 | Repository, job, config | `JdbcOrderAddressRetention`, `ClearOldAddressesJob`, `OrdersRetentionConfiguration`, `application.yaml`, `.env.example` | e2e: aged order, metric, second run |
| 4 | The response | `OrderResponse`, the two handlers | Handler tests; e2e `GET` |
| 5 | The entry-point rule | `ArchitectureRules`, fixtures | Job passes, handler and job fails |
| 6 | App | `api.ts`, `OrderConfirmation`, `submit-errors`, test helpers | Unit tests; two Playwright tests |
| 7 | Rate limit | `nginx.conf`, `scripts/rate-limit.test.mjs`, `load/rate-limit.js` | By hand, then k6 |
| 8 | Docs, ADR, plan, PLAN.md | `.docs/*`, `adrs/`, `docs/PLAN.md` | |
| 9 | Six QA commands | | Green; coverage at least 80% |

## New dependencies

None (scheduling is Spring's; the metric is Micrometer, already there).

## QA steps and risks

- QA: the six commands; the images rebuilt, the packaged app answering `429` after the burst, and the k6 spike.
- Risk: the bucket of the limit refills one slot every 6 seconds, so two checks within a minute see fewer slots; the k6 limit is an upper bound.
- Risk: the dev API of this machine runs the older code; the end-to-end tests that need a cleared order answer it in the browser.
