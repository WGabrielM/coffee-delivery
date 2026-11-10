# ADR: API, batch the order lines and read the catalog in one transaction

- Status: Accepted and verified
- Date: 2026-11-10
- Spec: [.specs/034-api-batch-and-read-transactions.md](../.specs/034-api-batch-and-read-transactions.md)
- Plan: [plans/034-api-batch-and-read-transactions-plan.md](../plans/034-api-batch-and-read-transactions-plan.md)

## Context

`save` inserted the order and then one row per line in a loop (15 statements for an order of 14 lines), and `POST /api/v1/orders` was the slowest route. `GET /api/v1/coffees` read the coffees and then the tags in two statements on two connections, because the repository was not transactional.

## Decisions

1. **One batch for the lines.** `JdbcOrderRepository.save` runs one `INSERT` for the order and one `JdbcTemplate.batchUpdate` for all the lines, sized to the order, in the one transaction of the class. The identity `id` of `order_items` grows with each row of the batch, so the lines come back in the order sent (a test sends all 14 coffees in reverse). `uq_order_items_order_coffee` and every other constraint still hold, and a line that fails (an unknown coffee in the middle of the batch) rolls back the order and every line.
2. **One read-only transaction for the catalog.** `JdbcCoffeeRepository` is `@Transactional(readOnly = true)`: the coffees and their tags are read on one connection and one snapshot. A request with `?tags=` first reads the list of tags to check the request (a separate step of the use case, one statement and one connection), then the coffees and their tags on one connection.
3. **A statement counter with no library.** `StatementCounter` wraps the data source, its connections, and their statements in JDK dynamic proxies and records one entry per execution (a batch is one) and the number of connections; `CountingDataSourceConfiguration` puts it in the Spring context of a test. The tests prove: 2 statements and 1 connection for orders of 1, 3, and 14 lines; 2 statements and 1 connection for the catalog list; 3 statements and 2 connections for the filtered list.
4. **The price lookup stays outside the transaction of `save`.** One `POST /api/v1/orders` is 3 statements on 2 connections (the lookup, then the insert and the batch together), which a test shows.
5. **No other change.** The ports, the domain, the bodies, the errors, and the tables are as before; the answers of `GET /api/v1/coffees` and `GET /api/v1/coffees?tags=special,iced` are byte for byte the same as before (same SHA-256 of the files saved from the API of the spec 032 and from the changed one).
6. **No `reWriteBatchedInserts`.** The PostgreSQL driver sends the rows of a batch in one round trip; rewriting them into one multi-row statement is a driver option for later if the numbers ask for it.

## Measured (2026-11-10)

The k6 `load` profile (the file `apps/api/load/load.js`: 5 scenarios, 10 virtual users each, 3 minutes) against a jar of the before (spec 032) and a jar of the after, each started the same way on port 3001 with the same database on this laptop, with the Docker image `grafana/k6:2.3.0`. The percentiles come from the k6 JSON output, per route and status. Each version was run twice, because the laptop also runs the database, Grafana, and the tests and the runs are noisy; the second pair ran in the order after, before. Times in ms.

| Route | Before run 1 (p50 / p95 / p99) | Before run 2 | After run 1 | After run 2 |
| --- | --- | --- | --- | --- |
| `POST /api/v1/orders` (201, an order of 2 lines) | 7.4 / 17.0 / 68.1 | 6.9 / 27.3 / 276.3 | 6.3 / 9.6 / 33.4 | 6.1 / 12.3 / 44.9 |
| `POST /api/v1/orders` (200, the replay of spec 032) | 3.6 / 5.1 / 16.7 | 3.4 / 5.8 / 42.7 | 3.3 / 4.6 / 6.7 | 3.2 / 4.3 / 10.1 |
| `GET /api/v1/coffees` | 2.7 / 4.8 / 42.3 | 2.6 / 7.8 / 206.5 | 3.1 / 7.4 / 12.8 | 3.0 / 4.2 / 18.7 |

Read: the p95 and p99 of the order creation are lower in both pairs (p95 about 17 to 27 before and 10 to 12 after; p99 about 68 to 276 before and 33 to 45 after). The p95 of the catalog list moves between 4.2 and 7.8 ms in both versions, so the difference is noise; its p99 is lower after (13 and 19 ms against 42 and 207). The scenario sends orders of two lines, so the gain is in the transaction and the round trips, and it grows with the number of lines (the tests prove 2 statements for 14 lines, against 15 before).

## Consequences

- A repository that needs several statements for one step puts them in one transaction; a default method on a repository interface does not get the class-level `@Transactional` (found in spec 032).
- The filtered catalog list still uses two connections per request (the tag check and the read); folding the check into the read is a later step if it matters.
- No new library; the statement counter is test code.
