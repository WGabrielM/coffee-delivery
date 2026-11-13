# Coffee Delivery

A small coffee store: a visitor browses 14 coffees, filters them by tag, builds a cart, enters a delivery address, chooses how to pay on delivery, and confirms the order. There are no accounts. It is a React app and a Java Spring Boot API with a PostgreSQL database, rebuilt from a Figma design as the capstone of the Applied AI postgraduate module (Coders University). It was built with AI, one spec at a time, following the workflow in [`.docs/`](.docs/AGENTS.md); [`docs/CAPSTONE.md`](docs/CAPSTONE.md) tells how, with the measured results.

## Stack

| Part | Tools |
| --- | --- |
| App (`apps/app`) | React 19, TypeScript (strict), Vite, React Router, TanStack Query, React Hook Form with Zod, Tailwind CSS 4 (the Figma tokens are the theme), Vitest and Testing Library, Playwright |
| API (`apps/api`) | Java 21, Spring Boot 4, Flyway, PostgreSQL 18, JUnit and Testcontainers, JaCoCo |
| Observability | OpenTelemetry traces and metrics to a local Grafana LGTM (logs stay on stdout) and k6 load tests |
| Quality | oxlint and oxfmt, Spotless, commitlint and lint-staged (Lefthook), GitHub Actions |
| Packaging | A Dockerfile for the API and one for the app (nginx, with a limit of 10 orders a minute), a Compose file to run both locally, and a tested `pg_dump` backup and restore ([`docs/RUNBOOK.md`](docs/RUNBOOK.md)); nothing is deployed |

## Prerequisites

| Tool | Version |
| --- | --- |
| Node.js | 22.22.2 or newer (22.12 is the declared minimum, but some development dependencies ask for 22.22.2; on an older 22.x run `yarn install --ignore-engines`) |
| Yarn | 1.22.22 (`corepack enable` uses it) |
| JDK | 21 or newer |
| Docker | with Compose v2 (PostgreSQL and Grafana run in containers; the API tests use Testcontainers; the images and the backup need it too) |
| k6 | only for the load tests (`yarn load:smoke` and the others) |

## Run it

```bash
yarn local:setup   # install the dependencies, create .env.local, start PostgreSQL and Grafana
yarn --cwd apps/app playwright install chromium   # once, for the browser tests
yarn api:dev       # terminal 1: the API on port 3000 (the first start compiles it)
yarn app:dev       # terminal 2: the app on port 5173
```

Open <http://localhost:5173>: the 14 coffees show up. Add some, open the cart (the icon in the top right), fill the address and choose a payment method, and confirm to see the order confirmation.

| Service | Address |
| --- | --- |
| App | <http://localhost:5173> (it sends `/api` to the API) |
| API | <http://localhost:3000/api/v1/coffees> |
| Grafana | <http://localhost:3030> (no login; the port is bound to this machine only) |
| PostgreSQL | `localhost:5432` (the values of `.env.local`) |

`yarn infra:down` stops PostgreSQL and Grafana. `.env.local` comes from `.env.example` and is never committed.

## Commands

| Command | What it does |
| --- | --- |
| `yarn code:fix` | Formats and fixes the code (oxlint, oxfmt, Spotless) |
| `yarn lint` | Checks lint and format |
| `yarn types:check` | Type checks the app (strict `tsc`) and compiles the API |
| `yarn test` | Unit tests: the script tests, the API tests, and the app tests (Vitest) |
| `yarn test:e2e` | The API end-to-end tests and the Playwright tests. It needs PostgreSQL (`yarn infra:up`), starts the API and the app when they are not running, and reuses them when they are |
| `yarn build` | Builds the API and the app |
| `yarn ci` | Runs on your machine the same commands, in the same order, as the GitHub Actions pipeline |
| `yarn docker:build`, `yarn docker:up`, `yarn docker:down` | Build and run the API and app images next to PostgreSQL; the app opens on http://localhost:8080 (see [docs/RUNBOOK.md](docs/RUNBOOK.md)) |
| `yarn db:backup`, `yarn db:restore <file>` | Back up the database to `backups/` and restore it into `restore_check` with the row counts |
| `yarn lighthouse` | Audits the Home page with Lighthouse (desktop); needs the API running; fails under 95 (performance) or 95 (accessibility) |
| `yarn load:smoke`, `yarn load`, `yarn load:stress`, `yarn load:spike`, `yarn load:soak` | The k6 load tests against the API (see [`apps/api/load/README.md`](apps/api/load/README.md)) |

The six commands from `code:fix` to `build` must pass before every commit; [`.docs/QA.md`](.docs/QA.md) has the details and the prerequisites of each.

## Where things are

| Path | What |
| --- | --- |
| [`.docs/`](.docs/AGENTS.md) | The rules: process, product, architecture, conventions, development, design, design system, and QA |
| [`.specs/`](.specs) | The 31 specs of the capstone, one action each, in the order they were built, and the 8 follow-up specs (032 to 039) that the health check proposed and that were built on 2026-11-10 |
| [`plans/`](plans), [`adrs/`](adrs) | One plan before each spec and one decision record after it |
| [`docs/`](docs) | The roadmap ([`PLAN.md`](docs/PLAN.md)), the capstone report ([`CAPSTONE.md`](docs/CAPSTONE.md)), the runbook for the images and the backup ([`RUNBOOK.md`](docs/RUNBOOK.md)), and the Figma analysis |
| [`apps/api`](apps/api) | The Spring Boot API, organized by domain and layers (`catalog`, `orders`, `system`, `shared`), with its load tests |
| [`apps/app`](apps/app) | The React app: `src/pages`, `src/features`, `src/components`, `src/api`, and the Playwright tests in `e2e/` |
| [`scripts/`](scripts) | The scripts behind the commands (`yarn api:dev`, `yarn ci`, `yarn lighthouse`, the env and load helpers) and their tests |
| [`infra/`](infra), [`compose.yaml`](compose.yaml), [`compose.packaged.yaml`](compose.packaged.yaml) | Local PostgreSQL, the Grafana dashboard, and the API and app images for a local check (`backups/`, ignored by Git, holds the database backups) |
| [`.github/workflows/`](.github/workflows) | The pipeline |
| [`screenshots/`](screenshots) | The screenshots taken for each spec, including the tablet and mobile layouts |

## More

- [`docs/CAPSTONE.md`](docs/CAPSTONE.md): the process, the 31 specs and the 8 follow-up specs with their plans and decision records, the numbers (each with its date), what a person decided and what AI decided, the deviations, the limits, and the lessons.
- [`docs/PLAN.md`](docs/PLAN.md): the roadmap with the result of each spec.
- Evidence for review: [`docs/OBSERVABILITY.md`](docs/OBSERVABILITY.md) (signals, dashboard, a trace), [`docs/TESTING.md`](docs/TESTING.md) (1,343 tests, coverage, defects found), [`docs/DECISIONS.md`](docs/DECISIONS.md) (the reasoning behind the architecture), [`docs/AGENTS-IN-ACTION.md`](docs/AGENTS-IN-ACTION.md) (real runs of the agents), and [`docs/FEEDBACK-RESPONSE.md`](docs/FEEDBACK-RESPONSE.md).
- [`.docs/BUSINESS.md`](.docs/BUSINESS.md): what the product does and its rules. [`.docs/ARCHITECTURE.md`](.docs/ARCHITECTURE.md): the endpoints, the data model, and the structure.
- [`.docs/DESIGN.md`](.docs/DESIGN.md): the screens, with the tablet and mobile rules.
