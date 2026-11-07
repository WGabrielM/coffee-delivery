# QA

You MUST run every applicable command below after any code change, and all of them MUST pass before the task is done. Run them from the repository root. If a command fails, fix the cause; do not skip or silence the check.

Each command runs one task in every workspace that exists (`scripts/run-task.mjs`) and prints which workspaces it ran and which it skipped. The root runs `oxlint` and `oxfmt`; `apps/api` runs Gradle; `apps/app` runs the script of the same name in its `package.json`.

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
| Audit the Home page with Lighthouse (desktop) | `yarn lighthouse` | `[planned]` (spec 029) |

## Rules

- A `[planned]` command does not exist yet. Until it does, run its `[implemented]` replacement if one is listed.
- The app e2e tests of the home coffee list (`home-coffees.spec.ts`, `home-filters.spec.ts`) the cart (`cart-add.spec.ts`), and the checkout (`checkout-summary.spec.ts`, `checkout-address.spec.ts`, `checkout-payment.spec.ts`) call the real API: run `yarn infra:up` and `yarn api:dev` (port 3000) before `yarn test:e2e`. The other app e2e tests run without it.
- `yarn test:e2e` will need the local database: run `yarn infra:up` first. Without it the API tests that need Postgres use Testcontainers and need only Docker.
- When you add a command, mark it `[implemented]` here in the same change and delete the `[implemented]` commands it replaces.
- Before reporting done, complete the manual QA steps and the end-of-task report defined in [RULES.md](RULES.md).
