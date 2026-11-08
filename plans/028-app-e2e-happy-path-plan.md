# Plan 028: End-to-end happy path

- Number: 028
- Created: 2026-11-08
- Spec: [.specs/028-app-e2e-happy-path.md](../.specs/028-app-e2e-happy-path.md)

## Concept summary

The spec has no open question. It proves the purchase on the real app, API, and database, and makes `yarn test:e2e` start what it needs. Choices, each recorded in `adrs/app-e2e-happy-path.md`:

1. **No mocks.** The three new specs call the real API. The tests only read their own orders and delete nothing.
2. **The runner starts the servers.** `playwright.config.ts` has two `webServer` entries (`yarn api:dev` on port 3000, waiting for `/actuator/health`, and `yarn dev` on port 5173), both with `reuseExistingServer: true`. Playwright stops what it started.
3. **A reused server must be the right one.** The old config forbade reuse so that another project on port 5173 could not be tested by mistake (a root test pinned that). With reuse, `e2e/global-setup.ts` checks the title `Coffee Delivery` on 5173 and `UP` on the API health, and fails with a message otherwise. The root test now pins the new rules.
4. **Postgres is checked first.** `scripts/check-postgres.mjs` (with a Node test) connects to the port of `.env.local` and exits with "Postgres is not reachable on localhost:5432. Start it with `yarn infra:up`…". The config runs it when it loads, before any server starts.
5. **Accessibility with `@axe-core/playwright` 4.14.0** (current version, same major as the `axe-core` of the repo). The scan fails on `critical` and `serious` impact. Color contrast is `serious`, and six text color pairs of the design are below 4.5:1 by the owner's decision (DESIGN_SYSTEM.md), so the scan allows exactly those pairs (checked by the foreground and background colors axe reports) and fails on any other pair. This keeps the contrast check on, unlike the earlier scans that switched the rule off.
6. **Flow:** the happy path is one test with steps, because the steps depend on each other (the cart, the form, the order).

## Tasks

| # | Task | Files | Test first |
| --- | --- | --- | --- |
| 1 | The three specs | `happy-path.spec.ts`, `checkout-validation.spec.ts`, `accessibility.spec.ts` | Written against the running stack |
| 2 | The axe library | `@axe-core/playwright` 4.14.0 (dev) | |
| 3 | Postgres check | `scripts/check-postgres.mjs` | `scripts/check-postgres.test.mjs` |
| 4 | Config and global setup | `playwright.config.ts`, `e2e/global-setup.ts`, `scripts/app-config.test.mjs` | The root test |
| 5 | Start and stop proof | A scratch run with the API on a spare port | No process left |
| 6 | Docs | `QA.md`, `ARCHITECTURE.md`, `PLAN.md` | Root tests |
| 7 | Six QA commands | | Green |

## New dependencies

- `@axe-core/playwright` 4.14.0 (dev): runs axe-core inside a Playwright page and reports by impact.

## QA steps and risks

- QA: the six commands; `yarn test:e2e` once with the app stopped (the runner starts it) and once with it running (the runner reuses it).
- Risk: the first start of the API compiles with Gradle, so the API server has a four minute limit.
- Risk: the tests create orders in the local database (about 15 per run).
- Risk: if the runner is killed hard, a server it started may stay up; the next run reuses it.
