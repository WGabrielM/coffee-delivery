# ADR: End-to-end tests on the real stack

- Status: Accepted and verified
- Date: 2026-11-08
- Spec: [.specs/028-app-e2e-happy-path.md](../.specs/028-app-e2e-happy-path.md)
- Plan: [plans/028-app-e2e-happy-path-plan.md](../plans/028-app-e2e-happy-path-plan.md)

## Context

Every screen had unit tests with a mocked API and some Playwright checks, but nothing proved that the app, the API, and the database work together on the main flow. The Playwright run also depended on the person starting the API by hand, and it refused to reuse a server on port 5173.

## Decisions

1. **Three specs, no mock.** `happy-path.spec.ts` is the whole purchase in one test with steps (the cart, the form, and the order depend on each other): the Special and Iced filter shows the Cuban, clearing shows 14, Latte × 2 and Traditional Espresso × 1 give the badge 3 and `$29.70`, `$3.50`, `$33.20`, the design sample with credit card lands on `/orders/<uuid>`, the confirmation shows the street, `20 min - 30 min`, and Credit card with an empty badge and survives a reload, and `GET /api/v1/orders/<uuid>` has `totalInCents` 3320 (items 2970, fee 350, Latte × 2 then Traditional Espresso × 1, credit card). `checkout-validation.spec.ts` checks an empty form (the seven messages, no `POST`), Remove (the totals go to `$13.40`), and an unknown coffee id in `localStorage` (the cart is cleaned to `[]` and the empty state shows). Nothing is deleted from the database.
2. **The runner starts the servers.** `playwright.config.ts` has two `webServer` entries: `yarn api:dev` (cwd: the repository root, waits for `/actuator/health`, four minutes for a first Gradle build) and `yarn dev`. Both have `reuseExistingServer: true`: a server in your terminal is reused and left alone, and a server the run started is stopped when it ends.
3. **Reuse is allowed, so a wrong server is detected.** The old config had `reuseExistingServer: false` and a root test pinned it, so that another project on port 5173 would never be tested by mistake. The spec asks for reuse, so `e2e/global-setup.ts` checks that port 5173 serves `<title>Coffee Delivery</title>` and that the API health is `UP`, and fails with a message otherwise. The root test now pins the new rules (two `webServer` entries, reuse on, the Postgres check, and the global setup).
4. **Postgres is checked before anything starts.** `scripts/check-postgres.mjs` opens a connection to the `POSTGRES_PORT` of `.env.local` (default 5432) and exits 1 with `Postgres is not reachable on localhost:5432. Start it with "yarn infra:up"...` when nothing answers. The config runs it when it loads. It has a Node test: the port, the message, a port that listens, and one that does not.
5. **The accessibility scan keeps contrast on.** `@axe-core/playwright` 4.14.0 (the current version, with `axe-core` 4.14.0 like the repository) scans Home, Home with a filter, Checkout (empty cart, with items, and with every error shown), and the Confirmation, and fails on `critical` and `serious`. Color contrast is `serious`, and six text pairs of the design are below 4.5:1 by the owner's decision (`DESIGN_SYSTEM.md`: white on yellow, white on yellow-dark, yellow-dark on yellow-light, yellow-dark on background, label on input, label on card). The earlier scans switched the whole rule off. Here the test allows exactly those six pairs, read from the foreground and background colors that axe reports for each node, and fails on any other pair. The scan still passes, so no other pair is below AA.
6. **No product bug was found.** The first run of the happy path and the validation tests passed on the existing app.

## Verification

- Six QA commands pass: 638 Vitest tests, 100 root tests (4 new for the Postgres check, and the config test now pins the new rules), the API suite unchanged, 176 Playwright tests (166 before, 10 new: 1 happy path, 3 validation, 6 accessibility), strict `tsc`, and `vite build` (CSS 28.98 kB, JS 522.59 kB).
- `yarn test:e2e` with `yarn api:dev` running and the app stopped: the runner started the app, reused the API, passed, and left nothing on port 5173; the API stayed up.
- The start path of the API was proved on a spare port (`SERVER_PORT=3100`), because the API on 3000 was running in a terminal: Playwright started `yarn api:dev`, waited for the health check, a request got `200`, and after the run nothing listened on 3100.
- The Postgres message is covered by the unit test of `checkPostgres` with a closed port; the database was not stopped to show it in a real run.

## Consequences

- The e2e tests of the checkout and the order page create real orders (about 15 per run). There is no cleanup endpoint, so they stay in the local database.
- The scan of contrast depends on the six pairs in the test. If the owner changes the palette, the list shrinks, and a pair that is fixed but still in the list is not noticed; the list and `DESIGN_SYSTEM.md` change together.
- A run that is killed hard may leave a server it started; the next run reuses it, and `global-setup.ts` checks it.
- Postgres is still not started by the runner (it runs in Docker and `yarn infra:up` owns it).
- New library: `@axe-core/playwright` 4.14.0 (dev).
