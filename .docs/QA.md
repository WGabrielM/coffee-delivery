# QA

You MUST run every applicable command below after any code change, and all of them MUST pass before the task is done. Run them from the repository root. If a command fails, fix the cause; do not skip or silence the check.

Each command runs one task in every workspace that exists (`scripts/run-task.mjs`) and prints which workspaces it ran and which it skipped. The root runs `oxlint` and `oxfmt` (`code:fix`, `lint`) and the script tests, `node --test scripts/*.test.mjs` (`test`); `apps/api` runs Gradle; `apps/app` runs the script of the same name in its `package.json`.

## Commands

| Check | Command | Status |
| --- | --- | --- |
| Lint and format (auto-fix) | `yarn code:fix` | `[implemented]` |
| Lint and format (check only, used by CI) | `yarn lint` | `[implemented]` |
| Type check | `yarn types:check` | `[implemented]` |
| Unit tests | `yarn test` | `[implemented]` |
| E2E and integration tests (API with Testcontainers, app with Playwright) | `yarn test:e2e` | `[implemented]` |
| Build | `yarn build` | `[implemented]` |

Both parts are `[implemented]`: `apps/api` (spec 003) and `apps/app` (spec 012). The app has no `lint` or `code:fix` script because the root `oxlint` and `oxfmt` already cover it, so the runner reports `apps/app` as skipped for those two. The API part needs JDK 21 or newer; `test:e2e` also needs Docker running.

Gradle tasks behind the API commands: `spotlessApply` (`code:fix`), `spotlessCheck` (`lint`), `compileJava compileTestJava` (`types:check`), `test` (`test`), `e2eTest jacocoTestCoverageVerification` (`test:e2e`, with a minimum of 80% line coverage), and `build` without tests (`build`).

## Continuous integration

| Action | Command | Status |
| --- | --- | --- |
| Run on this machine the commands of the pipeline, in its order (`api`, `app`, `e2e`) | `yarn ci` | `[implemented]` |
| Run one job | `node scripts/ci.mjs api`, `app`, or `e2e` | `[implemented]` |

`yarn ci` is the six checks split as the workflow splits them (see [DEVELOPMENT.md](DEVELOPMENT.md#continuous-integration)); the six QA commands above remain the rule before a commit. After a push, look at the run of `CI` on GitHub: the workflow file must stay valid (`actionlint` checks it).

## Local setup and skills

| Action | Command | Status |
| --- | --- | --- |
| Link every skill from `.agents/skills` into `.claude/skills` (runs after `yarn install`) | `yarn skills:link` | `[implemented]` |
| First-time setup (install, env file, infrastructure) | `yarn local:setup` | `[implemented]` |
| Create `.env.local` from `.env.example` (never overwrites) | `yarn env:setup` | `[implemented]` |
| Start and stop Postgres and Grafana | `yarn infra:up`, `yarn infra:down` | `[implemented]` |
| Start the API on port 3000 (loads `.env.local`; needs `yarn infra:up` first) | `yarn api:dev` | `[implemented]` |
| Start the app on port 5173 (proxies `/api` to port 3000) | `yarn app:dev` | `[implemented]` |
| Install the browser the app's Playwright tests use (once) | `yarn --cwd apps/app playwright install chromium` | `[implemented]` |
| Load test one profile: `smoke`, `load`, `stress`, `spike`, `soak` (needs k6; options in [`apps/api/load/README.md`](../apps/api/load/README.md)) | `yarn load:smoke`, `yarn load`, `yarn load:stress`, `yarn load:spike`, `yarn load:soak` | `[implemented]` |
| Build the API and app images, run them, and open the app on <http://localhost:8080> (not run by the QA commands or the pipeline) | `yarn docker:build`, `yarn docker:up`, `yarn docker:down` | `[implemented]` |
| Check the rate limit of the app image (needs k6 and `yarn docker:up`; sends 20 orders a second for 30 s; options in [`apps/api/load/README.md`](../apps/api/load/README.md)) | `BASE_URL=http://localhost:8080 node scripts/load.mjs rate-limit` | `[implemented]` |
| Back up the database, and restore it into `restore_check` with the row counts (see [RUNBOOK.md](../docs/RUNBOOK.md)) | `yarn db:backup`, `yarn db:restore <file> [--drop]` | `[implemented]` |
| Audit the Home page with Lighthouse (desktop preset; builds the app, serves it on port 5173, needs the API on port 3000 and the Chromium of Playwright, or `CHROME_PATH`; fails under 95 for performance or 95 for accessibility; not run in CI) | `yarn lighthouse` | `[implemented]` |

## Rules

- A `[planned]` command does not exist yet. Until it does, run its `[implemented]` replacement if one is listed.
- **The app e2e tests run against the real API and database** (Playwright, `apps/app/e2e`), with no request mocked, except where a test fakes one answer of the server to reach an error (`checkout-submit.spec.ts`, `order-confirmation.spec.ts`) or fails the request of a script chunk (`first-load.spec.ts`). The only prerequisite is Postgres: run `yarn infra:up` (Docker must be running) before `yarn test:e2e`. The run checks it first and fails at once with `Postgres is not reachable on localhost:5432. Start it with "yarn infra:up"...` when it is down.
- `yarn test:e2e` starts what is missing and reuses what runs: the API (`yarn api:dev`, port 3000, waiting for `/actuator/health`, up to four minutes for the first Gradle build) and the app (`yarn dev` run inside `apps/app`, the same as `yarn app:dev`, port 5173). A server that is already running, for example `yarn api:dev` or `yarn app:dev` in your terminal, is reused and left running; one that the run started is stopped when it ends. `e2e/global-setup.ts` checks that a reused server is the right one: port 5173 must serve the Coffee Delivery app (`<title>Coffee Delivery</title>`) and the API must answer `UP`, or the run fails with a message.
- The e2e tests of the checkout and of the order page create real orders in the local database and never delete them; each test reads only its own orders.
- The e2e files: `happy-path.spec.ts` (browse, filter, add, check out, confirm, reload, and the stored order with `totalInCents` 3320), `checkout-validation.spec.ts` (a blocked empty form with no `POST`, removing a coffee, an unknown coffee in the saved cart), `accessibility.spec.ts` (an axe scan of every screen with `@axe-core/playwright`: no `critical` or `serious` violation), `responsive.spec.ts`, and one file per screen. The accessibility scan keeps the contrast check on, except for the six text color pairs of the design that are below 4.5:1 by the owner's choice (listed in the test and in [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)); a new low-contrast pair fails it.
- **First load** (`first-load.spec.ts`, spec 033): runs on the production build that Playwright builds and serves on port 4173 (`vite preview`, which proxies `/api`). The entry chunk is under 250 kB; Home asks for no JavaScript of the checkout or the order page, and the checkout chunk is asked for only when the person goes there; a first visit to `/checkout` and to `/orders/<id>` works; a chunk that cannot be loaded shows the error page of the router, not a blank page; every coffee photo is a lazy, async-decoded WebP and the hero is `fetchpriority=high` with no `loading`; the home page, until the 14 cards show, transfers under 600 kB (measured with the Chromium network).
- **Visual parity with the design** (`visual-parity.spec.ts`, spec 029): four screens in the state of the design frames (Home with 14 coffees and an empty cart; Checkout with Traditional Espresso × 1 and Latte × 2, an empty form, and no payment; Checkout Filled with the sample address and credit card; Success for a real order) are compared with `e2e/figma-reference/*.png`, the frames cut from the export of the Figma file by `node scripts/cut-figma-references.mjs` (the export `docs/design/image-frames.png` is local to the owner; the four cut images are committed). The test checks the layout boxes of the design within 2 px and fails when more than 2% of the pixels that are not masked differ (per-pixel color distance 0.1, `pixelmatch`). The rectangles in `e2e/visual-masks.ts` ignore only text that differs on purpose (Portuguese and reais against English and dollars), each named; never widen one, and never raise the 2%, to pass. A run prints the share of each screen, and writes the expected, actual, and diff images to `test-results` (the expected and actual images show the masks in magenta).
- Without the database the API tests that need Postgres use Testcontainers and need only Docker.
- When you add a command, mark it `[implemented]` here in the same change and delete the `[implemented]` commands it replaces.
- Before reporting done, complete the manual QA steps and the end-of-task report defined in [RULES.md](RULES.md).
