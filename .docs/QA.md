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

The `apps/api` part of each command is `[planned]` for spec 003 and the `apps/app` part for spec 012. Until then the command skips that workspace and still passes.

Gradle tasks behind the API commands: `spotlessApply` (`code:fix`), `spotlessCheck` (`lint`), `compileJava compileTestJava` (`types:check`), `test` (`test`), `e2eTest jacocoTestCoverageVerification` (`test:e2e`, with a minimum of 80% line coverage), and `build` without tests (`build`).

## Local setup and skills

| Action | Command | Status |
| --- | --- | --- |
| Link every skill from `.agents/skills` into `.claude/skills` (runs after `yarn install`) | `yarn skills:link` | `[implemented]` |
| First-time setup (install, env file, infrastructure) | `yarn local:setup` | `[planned]` (spec 002) |
| Create `.env.local` from `.env.example` (never overwrites) | `yarn env:setup` | `[planned]` (spec 002) |
| Start and stop Postgres and Grafana | `yarn infra:up`, `yarn infra:down` | `[planned]` (spec 002) |
| Start the API on port 3000 | `yarn api:dev` | `[planned]` (spec 003) |
| Start the app on port 5173 | `yarn app:dev` | `[planned]` (spec 012) |
| Load test one profile: `smoke`, `load`, `stress`, `spike`, `soak` | `yarn load:smoke`, `yarn load`, `yarn load:stress`, `yarn load:spike`, `yarn load:soak` | `[planned]` (specs 003 and 008) |
| Audit the Home page with Lighthouse (desktop) | `yarn lighthouse` | `[planned]` (spec 029) |

## Rules

- A `[planned]` command does not exist yet. Until it does, run its `[implemented]` replacement if one is listed.
- `yarn test:e2e` will need the local database: run `yarn infra:up` first once spec 002 exists. Without it the API tests that need Postgres use Testcontainers and need only Docker.
- When you add a command, mark it `[implemented]` here in the same change and delete the `[implemented]` commands it replaces.
- Before reporting done, complete the manual QA steps and the end-of-task report defined in [RULES.md](RULES.md).
