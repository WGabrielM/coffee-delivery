# Plan 034: API, batch the order lines and read the catalog in one transaction

- Number: 034
- Created: 2026-11-10
- Spec: [.specs/034-api-batch-and-read-transactions.md](../.specs/034-api-batch-and-read-transactions.md)

## Concept summary

The spec has no open question. Choices, each recorded in `adrs/api-batch-and-read-transactions.md`:

1. **Measure first.** The k6 `load` profile runs against the code of spec 032 (the before) and then against the changed code (the after), both as a jar started the same way on port 3001 on the same machine, with the Docker image of k6. The percentiles per route and status come from the k6 JSON output.
2. **One batch for the lines.** `JdbcTemplate.batchUpdate` with one parameter setter, one batch the size of the order. The identity id of `order_items` grows with each row of the batch, so reading the order back (`ORDER BY id`) keeps the order sent.
3. **One read-only transaction for the catalog.** `@Transactional(readOnly = true)` on `JdbcCoffeeRepository`: the coffees and their tags share one connection and one snapshot.
4. **A statement counter in the tests, with no library:** JDK dynamic proxies around the data source, its connections, and their statements (`StatementCounter`), added to the Spring context by `CountingDataSourceConfiguration`. A batch counts as one execution.
5. **The price lookup stays outside `save`:** the use case is not transactional, and a test shows two connections for one `POST` (the lookup, then the transaction of `save`).

## Tasks

| # | Task | Files | Check |
| --- | --- | --- | --- |
| 1 | Baseline load run and the body of the catalog | k6, jar of the before | Numbers saved |
| 2 | Statement counter | `StatementCounter`, `CountingDataSourceConfiguration` | Used by the tests |
| 3 | Tests first | `OrderStatementsE2ETest`, `CatalogStatementsE2ETest` | 2 statements for 1, 3, and 14 lines; 1 connection for the catalog |
| 4 | Batch and transaction | `JdbcOrderRepository`, `JdbcCoffeeRepository` | The tests and the existing e2e tests |
| 5 | Load run after, same procedure | k6, jar of the after | Not higher |
| 6 | Docs, ADR, plan, PLAN.md | `.docs/ARCHITECTURE.md`, `adrs/`, `docs/PLAN.md` | |
| 7 | Six QA commands | | Green; coverage at least 80% |

## New dependencies

None.

## QA steps and risks

- QA: the six commands; the catalog answer is compared byte for byte with the one of the before.
- Risk: the load numbers are noisy on a laptop that also runs the database, Grafana, and the tests; both runs use the same procedure, and a run is repeated if the difference is inside the noise.
