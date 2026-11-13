# Testing

What is tested, with which kind of test, how many, what the tests have found, and how to run them. Numbers were measured on 2026-11-13 from the result files of the runs, not copied from older reports. How the tests fit the process (tests first, six commands, one commit per spec) is in [QA.md](../.docs/QA.md) and [CAPSTONE.md](CAPSTONE.md).

## 1. The numbers

| Layer | Tool | Tests | Files | Needs |
| --- | --- | --- | --- | --- |
| API unit (domain, use cases with fakes, handlers with MockMvc, validators, ArchUnit) | JUnit 5, AssertJ | 172 | 23 classes | Nothing (`./gradlew test`) |
| API end to end (real application, real PostgreSQL) | `@SpringBootTest`, Testcontainers | 113 | 12 classes | Docker (`./gradlew e2eTest`) |
| App unit and component (components, hooks, features with a fake API) | Vitest, Testing Library, axe | 694 | 54 files | Nothing (`yarn test`) |
| App end to end (browser, real API and database) | Playwright (Chromium) | 199 | 18 spec files | The API and PostgreSQL (`yarn test:e2e`) |
| Scripts and repository guards (infrastructure, docs, dashboard, images, backup, rate limit) | `node --test` | 165 | 17 files | Nothing |
| Load | k6 | 5 profiles, 1 limit check, 6 scenarios | `apps/api/load` | k6 or Docker |
| **Total automated** | | **1,343** | | |

Coverage of the API (JaCoCo, unit and end to end together, gate at 80% of lines): **618 of 624 lines (99%)**, 99% of instructions (25 missed of 2,862), **94% of branches** (8 missed of 139). Lowest package: `shared.error` at 96%.

The ratio is on purpose: most behavior is proved close to the code (unit), the contracts and the database are proved once end to end, and the browser tests cover what only a browser can (layout, focus, real network, accessibility, the production build).

## 2. How a change is tested (the process)

1. The spec lists acceptance criteria. `implement-me` writes a plan, and tests come before code where a test can fail first.
2. Six commands must pass before a commit: `yarn code:fix`, `yarn lint`, `yarn types:check`, `yarn test`, `yarn test:e2e`, `yarn build`. A hook (`lefthook`) runs lint on staged files and checks the commit message; the GitHub Actions pipeline repeats the commands in three jobs (API, app, end to end) with a PostgreSQL service ([ADR](../adrs/ci-pipeline.md)).
3. Coverage cannot fall under 80% of lines (`jacocoTestCoverageVerification`).
4. A rule that the documents state is a test (section 4), so it cannot rot.

## 3. What each kind of test proves, with examples

### API unit

- **Domain rules**: `OrderTotalsTest` (the totals rule: 29.70 + 3.50 = 33.20; the fee is the same for every ZIP code; a placed order and the quote have the same numbers), `DeliveryPolicyTest`, `PaymentMethodTest`.
- **Use cases with fakes** (`InMemoryOrderRepository`, `FakeCoffeePriceLookup`): `CreateOrderUseCaseTest` covers a new key, a replay, a conflict, no key, an unknown coffee that must not use up the key, and the race (the fake hides the first lookup to simulate another request taking the key); `ClearOldAddressesUseCaseTest` uses a fixed clock: an order of 89 days is kept, one of 91 days is cleared, the same order is not cleared twice.
- **Handlers**: `CreateOrderRequestHandlerTest` checks `201` then `200` with the same body and `Location`, the `400`s by JSON path, the `422`, and the business metric.
- **Architecture rules** (`ArchitectureRulesTest`, 26 tests, and `ArchitectureTest`, 15 tests on the real code): every rule has a fixture package that breaks it on purpose, and the test fails if the rule does not catch it. A rule that passed on the real code for the wrong reason would be caught by its fixture (section 5, row 7).

### API end to end

These start the real application on a random port against a PostgreSQL container:

- `CreateOrderE2ETest.parallelRequestsWithTheSameKeyStoreExactlyOneOrder`: 8 threads released by one latch send the same order with the same key; the test expects one `201`, seven `200`, one order id, and one row.
- `OrdersMigrationE2ETest` (one assertion per rule of the schema: columns, nullable columns, each check constraint, each foreign key, the check that a cleared order has no address).
- `OrderStatementsE2ETest`: a JDK proxy around the data source counts statements and connections: an order of 1, 3, or 14 lines is 2 statements on 1 connection.
- `OrderRetentionE2ETest`: the test ages an order in the database, runs the job, and reads the metric, the row, and the `GET` answer.
- `QuoteOrderE2ETest`: the quote equals the `201` body of the order for the same cart, and writes no row.

### App unit and component

- Pure logic: the cart reducer, the cart storage (every read and write inside `try/catch`), the order request builder, the idempotency keys, the error mapping, the pricing numbers of the fake server.
- Every component has an axe check (`accessibilityViolations`), and `classes.test.tsx` compiles every Tailwind class of every variant against the theme (jsdom loads no CSS, so a typo would otherwise pass).
- Features run against a fake API (`fakeCheckoutApi`) that follows the server's rules, so the summary, the checkout form, the confirmation and the card are tested with their loading, error, and retry states.
- Structure tests: `components.test.ts` (no hex color, no `className` prop, the router only in two components), `pages.test.ts` (a page imports no data code), `quantity-limits.test.ts` (the number 99 lives in one file).

### App end to end (browser)

- The whole purchase on the real app, API, and database (`happy-path.spec.ts`), and the cases the unit tests cannot reach: a lost answer followed by a second click creates one order; a `429` shows the message; a chunk that fails to load shows the router error page.
- **Accessibility**: `@axe-core/playwright` on Home, Home with a filter, Checkout empty, with items and with errors, and the confirmation: no critical or serious violation.
- **Responsive**: `responsive.spec.ts` checks the four screens at 1440, 1280, 1024, 768, 390, and 320 px for horizontal scroll and 24 by 24 px targets.
- **Visual parity**: `visual-parity.spec.ts` compares four screens with the frames of the design; at most 2% of the unmasked pixels may differ (measured: Home 0.60%, Checkout 0.07%, Checkout filled 0.41%, Success 0.27%).
- **First load** (`first-load.spec.ts`, on the production build): the entry chunk is under 250 kB, Home asks for no checkout code, and Home transfers under 600 kB (measured 512 kB).

### Load

k6 profiles (`smoke`, `load`, `stress`, `spike`, `soak`) with shared thresholds, one scenario per endpoint, and a rate-limit check. See [OBSERVABILITY.md](OBSERVABILITY.md) section 6 for results.

## 4. Rules that are tests (the documents cannot drift)

| Statement in the documents | Test that enforces it |
| --- | --- |
| Layers, slices, one use case per handler, no `double` in the domain, `application` uses only `@Service` | `ArchitectureTest` with 8 more rules and their fixtures |
| Components import no router (two exceptions), pages import no data code | `components.test.ts`, `pages.test.ts` |
| The quantity limit is written once | `quantity-limits.test.ts` |
| Each e2e helper is defined once | `scripts/e2e-helpers.test.mjs` |
| Images are pinned, the API image is not root, the proxy limits only orders | `scripts/db-backup.test.mjs`, `scripts/rate-limit.test.mjs` |
| The dashboard reads the right metrics | `scripts/observability.test.mjs` |
| Postgres image equals the one of Compose | A root test compares them |
| Scenario files are indexed and end with `think()` | `scripts/api-scripts.test.mjs` |

## 5. What the tests found (real defects, not hypothetical)

| # | Found by | What | Fix |
| --- | --- | --- | --- |
| 1 | End-to-end test of an order whose second line fails (spec 032) | A default method on the repository interface skipped the class-level `@Transactional`: the order row stayed when a line failed | The interface has no default method; documented in ARCHITECTURE.md |
| 2 | Playwright layout test (spec 033) | The new 952 by 721 hero made its box 360.5 px high instead of 360 | `aspect-476/360` on the image |
| 3 | Playwright, first run after lazy routes (spec 033) | The dev server re-bundled the checkout libraries on the first visit and reloaded the page | `optimizeDeps.include` |
| 4 | A real run of `db:restore` on Windows (spec 037) | A shell lost the quotes of the SQL | The scripts start `docker` directly |
| 5 | Vitest (spec 039) | Three summary tests and one checkout test assumed immediate totals; Confirm order now waits for the quote | Tests wait for the quote, as the product does |
| 6 | One failed Playwright run (2026-11-10) analysed by the `bug-investigator` agent | A start-up race: the first tests hit a cold dev server and a cold JVM inside the 5 s expectation | Warm-up in the global setup and in Vite, with tests ([ADR](../adrs/testing-and-observability-evidence.md)) |
| 7 | The architecture fixtures (spec 036) | The real code passed every new rule on the first run, so the fixtures are what proves the rules work | n/a |
| 8 | `code-reviewer` agent on the latest change (2026-11-13) | The card's spoken message said "Added 5" at the cap of 99 when nothing was added | The message says what really went in, with two tests |

## 6. Traceability: spec to evidence

| Spec | Main tests |
| --- | --- |
| 010, 011 orders create and get | `OrderTest`, `CreateOrderUseCaseTest`, `CreateOrderRequestHandlerTest`, `CreateOrderE2ETest`, `GetOrderE2ETest`; k6 `orders-create.js`, `orders-get.js` |
| 022 to 026 checkout and success | `OrderSummary.test.tsx`, `CheckoutSubmit.test.tsx`, `OrderConfirmation.test.tsx`, `checkout-*.spec.ts`, `order-confirmation.spec.ts` |
| 028, 029 e2e, visual parity, Lighthouse | `happy-path.spec.ts`, `accessibility.spec.ts`, `visual-parity.spec.ts`, `yarn lighthouse` |
| 032 idempotency | The 7 use case tests, the handler tests, 5 e2e answers and the parallel test, the Playwright lost-answer test |
| 033 first load | `optimize-images.test.mjs`, `first-load.spec.ts` (9 tests), Lighthouse 100 three times |
| 034 batching | `OrderStatementsE2ETest`, `CatalogStatementsE2ETest`, k6 before and after |
| 035, 036 structure | `components.test.ts`, `pages.test.ts`, `ArchitectureRulesTest` |
| 037 packaging, backup | `db-backup.test.mjs` (16 tests) and the drill |
| 038 retention, limit | `ClearOldAddressesUseCaseTest`, `OrderRetentionE2ETest`, `rate-limit.test.mjs`, k6 `rate-limit.js` |
| 039 quote | `OrderTotalsTest`, `QuoteOrderUseCaseTest`, `QuoteOrderE2ETest`, `useQuote` tests, the summary-equals-order Playwright test |

## 7. How to reproduce

```bash
yarn infra:up                # PostgreSQL and Grafana (Docker)
yarn test                    # API unit, app unit, scripts (no Docker needed for the unit tests)
yarn test:e2e                # API end to end (Testcontainers) and Playwright (starts the API and the app)
yarn ci                      # the same commands as the pipeline, in the same order
./gradlew jacocoTestReport   # the coverage report (apps/api)
```

Raw output of the run behind the numbers above: [evidence/test-run-2026-11-13.txt](evidence/test-run-2026-11-13.txt).

## 8. Limits

- The Lighthouse and visual-parity numbers are from after spec 033; they were not repeated after later specs.
- The Playwright tests run in Chromium only.
- The retention job runs at 03:00 in production; the tests call it directly and age rows in the database (they do not wait for the clock).
- Mutation testing is not used; the fixtures of the architecture rules are the closest thing to it.
