# Development

Apply these rules to every task, change, or fix that touches code.

## Principles

- **DRY**: do not duplicate logic. Extract it.
- **Clean code**: small, well-named, single-purpose units.
- **SOLID**.

## Code organization

### API (`apps/api`)

Slice the application by domain (vertical slices), and organize each domain in layers:

```
com.coffeedelivery.<domain>.domain
com.coffeedelivery.<domain>.application
com.coffeedelivery.<domain>.infrastructure
com.coffeedelivery.<domain>.interfaces
com.coffeedelivery.shared                  logic and files used by more than one domain
```

| Layer | Contains |
| --- | --- |
| `domain` | Entities, value objects, and domain rules |
| `application` | Use cases and the ports (interfaces) they need |
| `infrastructure` | Concrete implementations of the ports: database access, clocks, external services |
| `interfaces` | Endpoints, request handlers, HTTP mapping and validation of the request shape |

- Dependencies point inward: `interfaces` and `infrastructure` depend on `application`; `application` depends on `domain`; `domain` depends on nothing (no Spring, no JSON).
- A domain MUST NOT use another domain's `infrastructure` or `interfaces`. Shared code goes in `shared`. When a slice needs data owned by another slice, it declares its own port and implements it in its own `infrastructure`.
- Each flow is one use case: one class in `application`, named `<Action>UseCase`, with one public method, `execute`.
- Each endpoint is one request handler: one class in `interfaces`, named `<Action>RequestHandler`, with one route and one public method, `handle`. A request handler depends on exactly one use case, and a use case has exactly one entry point: one request handler, or one scheduled job (`<Action>Job` in `infrastructure`, spec 038).
- `application` may use `org.springframework.stereotype.Service` and the exceptions of `shared.error`, and nothing else of Spring or of the web: it depends on `domain`, `application`, `shared.error`, `java.*`, and the stereotypes only (decision of spec 036). `infrastructure` does not depend on `interfaces`, and `shared` depends on no slice. Every `@RestController` is in `interfaces` and named `*RequestHandler`; every `@Service` is in `application` and named `*UseCase`. `domain` has no `double`, `float`, `Double`, `Float`, or `BigDecimal` (money is whole cents).
- `ArchitectureTest` enforces these rules (each rule has a fixture that breaks it in `ArchitectureRulesTest`); do not weaken it to make a change pass.

Package names cannot be Java keywords, so the fourth layer is `interfaces` (plural), not `interface`.

**Running the API.** It needs JDK 21 or newer, and Docker for the database. `yarn api:dev` loads `.env.local`, runs `gradlew bootRun` in `apps/api`, and serves on port 3000. Run `yarn infra:up` first. The API reads `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_PORT` from the environment; they have no defaults in `application.yaml`. It also reads, all optional: `POSTGRES_HOST` (default `localhost`; the API image sets it to `postgres`), `OTEL_EXPORTER_OTLP_ENDPOINT` (default `http://localhost:4318`), `ORDERS_RETENTION_DAYS` (default 90, a whole number of at least 1), and `ORDERS_RETENTION_CRON` (default `0 0 3 * * *`). Running from an IDE needs the same variables.

**Repository in a synced folder (OneDrive).** Gradle fails with `Failed to clean up stale outputs` or `Unable to delete directory` when `apps/api/build` is synced. Set the environment variable `ORG_GRADLE_PROJECT_coffeeBuildDir` to a folder outside the repository whose last segment is `build` (for example `%LOCALAPPDATA%\coffee-delivery-api\build`); `ArchitectureTest` needs that name to tell test classes from main classes.

**One setting for every Gradle client.** Put `coffeeBuildDir=C:/Users/<you>/AppData/Local/coffee-delivery-api/build` in `~/.gradle/gradle.properties` (the Gradle user home), so the command line and the VS Code Java extension build in the same folder outside OneDrive. The environment variable does the same for the command line only; without the property, the VS Code Java extension recreates `apps/api/build` inside OneDrive and Gradle can then fail with `Failed to clean up output files`.

**Format before checking.** `yarn code:fix` applies Spotless (google-java-format). `yarn lint` fails on Java that is not formatted.

**Logs.** The API writes one JSON object per line on stdout (`@timestamp`, `level`, `message`, `traceId`, `spanId`, and the key/value pairs of the event). Each request produces one line, `request completed`, with `method`, `path`, `status`, and `durationMs`; the query string is never logged.

### App (`apps/app`)

- **Running the app.** `yarn app:dev` starts Vite on port 5173 (`strictPort`: it fails instead of picking another port). The dev server proxies `/api` to `http://localhost:3000`, so start the API with `yarn api:dev` when a page calls it. The declared minimum is Node 22.12, but `jsdom` (the Vitest environment) asks for 22.22.2 or newer, which is the version CI uses; on an older 22.x, `yarn install --ignore-engines` works.
- **Images and backups (spec 037).** `yarn docker:build`, `yarn docker:up`, and `yarn docker:down` build and run the API and app images next to the Postgres of `compose.yaml` (the app on <http://localhost:8080>; the API container has no host port, so it does not clash with `yarn api:dev` on 3000). The app image is built from the root of the repository (the yarn lock file is there): `docker build -f apps/app/Dockerfile .`. `yarn db:backup` and `yarn db:restore` are in [RUNBOOK.md](../docs/RUNBOOK.md). The images are not built by the QA commands or by the pipeline.
- **Scripts.** The app defines `dev`, `build`, `preview`, `types:check`, `test`, and `test:e2e` only; `yarn lint` and `yarn code:fix` come from the root (`oxlint`, `oxfmt`). The root `yarn test` also runs the script tests (`node --test scripts/*.test.mjs`). `yarn lighthouse` audits the built Home page (see [QA.md](QA.md)). `node scripts/optimize-images.mjs` makes the WebP images of the app from the PNG originals in `apps/app/assets-source` (see [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)). The checkout and the order page are lazy routes (`src/app/routes.tsx`): `yarn build` makes a chunk for each, and Home does not load them; `e2e/first-load.spec.ts` checks this on the build, which Playwright builds and serves on port 4173.
- **Browser for Playwright.** After `yarn install`, run `yarn --cwd apps/app playwright install chromium` once. If you already have a Chromium, set `PLAYWRIGHT_CHROMIUM_PATH` to its executable instead. The `test:e2e` command starts the API and the dev server when nothing answers on port 3000 or 5173, and reuses a server that is already running there (for example `yarn api:dev` or `yarn app:dev`); `e2e/global-setup.ts` fails the run when port 5173 serves another project or the API is not healthy. It needs Postgres (`yarn infra:up`) and fails at once with a message when it is down.
- Pages in `src/pages` only compose features. Features by domain in `src/features/<domain>`. Shared presentational components in `src/components`. The API client in `src/api`; helpers in `src/lib`.
- Components do not fetch data directly: features expose hooks (TanStack Query) and components receive data through props.
- Colors, fonts, and sizes come from the theme tokens ([DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)); components contain no hex color literal (a root test fails on one outside `src/styles/theme.css`). Style with Tailwind classes that use the token names: `bg-card`, `text-title`, `type-title-xl`, `px-page`, `rounded-button`. The default Tailwind palette, font sizes, radii, and shadows do not exist, so `bg-red-500` or `shadow-md` do not compile.
- Money is drawn with `formatMoney` or `formatMoneyParts` from `src/lib/format-money.ts`; never format an amount by hand.
- Screens are assembled from the base components in `src/components` (`Button`, `Counter`, `Input`, `SelectOptionGroup`, `Tag`, `Badge`, `LoadingState`, `ErrorState`, `TextLink`; props and states in [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)). They take no `className` or `style`: if a screen needs something they do not offer, add a prop or a variant to the component, with its test, instead of restyling it. Every component test file includes an axe check (`accessibilityViolations` from `src/test/axe.ts`). jsdom loads no stylesheet, so `src/components/classes.test.tsx` renders every variant of every base component and compiles its classes with the theme of the app: a class that does not exist (`bg-red-500`, `shadow-md`, a typo) fails that test. Add a new component to it. Components import no router, API client, or feature, with two exceptions: `navbar` and `text-link` import `Link` from `react-router` (a test pins exactly these two). A screen that waits for the API uses `LoadingState`, one that failed uses `ErrorState`, and a link in the text uses `TextLink`; do not write the spinner, the alert, or the link classes again. The least and the most of one coffee (1 and 99) live in `src/lib/quantity-limits.ts` only (a test fails when another file under `src` has the number). The Playwright helpers (`boxOf`, `fillTheAddress`, `fillTheSample`, `sampleAddress`, `createOrder`, `coffeeId`, `field`, `drawn`) live in `e2e/checkout-helpers.ts` only (`scripts/e2e-helpers.test.mjs` fails on a copy). Pages render no `main`: `AppLayout` provides `main#main-content`. The app has no pricing code: the summary shows the quote of the server. A page only chooses what to show from the route and composes features: it imports no `@tanstack/react-query`, no `src/api`, no `features/*/api` module, and no cart context (`src/pages/pages.test.ts` pins this). The states of an order are `features/orders/order-status`, and the empty cart with its focus is `features/checkout/cart-gate`.
- Images and icons come from `src/assets/index.ts` only (`coffeeImages[slug]`, `iconSvgs[name]`, `logo`, `heroImage`, `deliveryIllustration`); never import a file from a folder of `src/assets` directly and never add an icon library. Do not edit a generated asset: regenerate it with `node scripts/extract-figma-assets.mjs` (the `.fig` is on your machine only; see [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)). Without the `.fig`, the committed assets are enough to build.

## Local infrastructure

PostgreSQL and Grafana LGTM run in Docker Compose (`compose.yaml`). Install Docker (with Compose v2) first.

| Command | What it does |
| --- | --- |
| `yarn local:setup` | `yarn install`, then `yarn env:setup`, then `yarn infra:up`. Safe to run again. |
| `yarn env:setup` | Creates `.env.local` from `.env.example`. Never overwrites an existing `.env.local`. |
| `yarn infra:up` | Starts both services and returns when both are healthy (Grafana takes up to a minute on the first start). |
| `yarn infra:down` | Stops and removes the containers. The database volume is kept. |

| Service | Address | Credentials |
| --- | --- | --- |
| PostgreSQL | `localhost:5432` (`POSTGRES_PORT`) | Database, user, and password from `.env.local` (defaults in `.env.example`) |
| Grafana | `http://localhost:3030` | No login: the image runs with anonymous admin access, which is acceptable because the port is bound to `127.0.0.1` |
| OpenTelemetry collector | `localhost:4317` (gRPC), `localhost:4318` (HTTP) | None |

- **Credentials policy.** `.env.example` holds development-only values and is committed. `.env.local` is yours and is ignored by Git; never commit it, and never reuse these values anywhere else.
- **Reset the database.** `yarn infra:down` keeps the data. To delete it, run `docker compose --env-file .env.local down --volumes`, then `yarn infra:up`.
- **Check by hand.** `docker compose --env-file .env.local ps` shows `healthy` for both services; `GET http://localhost:3030/api/health` returns `200`.
- **Another port.** If 5432 is taken, change `POSTGRES_PORT` in `.env.local` and run `yarn infra:up` again; the API reads the same variable (spec 003).

## Testing (TDD)

- Write the test first, then the code that makes it pass.
- Every change ships with tests covering its behavior: unit, integration, and end-to-end as applicable.
- Test tooling is listed in [ARCHITECTURE.md](ARCHITECTURE.md). The API runs a minimum of 80% line coverage in `yarn test:e2e`.
- Tests that need PostgreSQL use Testcontainers, so they do not depend on the local database or on its data.

## Continuous integration

GitHub Actions runs the quality gates on a clean machine on every push to `main` and every pull request (`.github/workflows/ci.yml`):

| Job | Runs | After |
| --- | --- | --- |
| `api` | Gradle in `apps/api`: `spotlessCheck`, `compileJava compileTestJava`, `test`, and `build -x test -x e2eTest` (Java 21, Temurin, Gradle cached) | none (parallel with `app`) |
| `app` | `yarn oxlint .`, `yarn oxfmt --check .`, the script tests (`node --test scripts/*.test.mjs`), and `types:check`, `test`, and `build` of `apps/app` (Node 22.22.2, Yarn cached, `yarn install --frozen-lockfile`) | none (parallel with `api`) |
| `e2e` | `yarn test:e2e`: the API e2e tests (Testcontainers) and the Playwright tests against the API and the app, with a Postgres 18.6 service container; the Playwright report and traces are uploaded when it fails | `api` and `app` |

`commitlint.yml` runs commitlint over the commits of a pull request. `yarn ci` runs the same commands in the same order on your machine (`node scripts/ci.mjs`; `node scripts/ci.mjs app` runs one job). It needs `yarn local:setup` first (the dependencies, `.env.local`, and Postgres) and the browser (`yarn --cwd apps/app playwright install chromium`). A test (`scripts/ci.test.mjs`) keeps the workflow and `yarn ci` the same, and checks that the versions are explicit (Java 21, Node 22.22.2, Yarn from `packageManager`) and that every action is pinned to a commit SHA with its version in a comment. Change a command in both places together. The pipeline does not deploy, release, build images, use secrets, or run Lighthouse, load tests, or the observability stack.

## Commits

Commit messages follow [Conventional Commits](https://www.conventionalcommits.org), checked on every commit by commitlint through Lefthook (`commit-msg` hook). The `pre-commit` hook formats staged JavaScript, TypeScript, JSON, CSS, and HTML files.

- Format: `<type>(<optional scope>): <subject>`, for example `feat(api): add the coffee list endpoint`.
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.
- Subject: imperative, lowercase start, no trailing period; the whole header is at most 100 characters.
- Breaking change: add `!` after the type or scope (`feat!: ...`) and a `BREAKING CHANGE:` footer.
- Work only on `main`. Do not create feature branches: commit directly to `main` and push it.
- Fix a rejected message and commit again. Do not bypass the hook with `--no-verify`.

## Observability

- Use the Grafana LGTM stack for all observability.
- Logging and observability MUST be integrated from day one, not added later.
- The API writes structured JSON logs and exports OpenTelemetry traces and metrics to the collector on ports 4317 and 4318.
- The `Coffee Delivery API` dashboard and its provisioning live in `infra/grafana/` and load automatically with `yarn infra:up`. Change them in the files: Grafana does not save UI edits to a provisioned dashboard. A new endpoint, database call, or outbound call MUST show up in the dashboard; add a panel in the same change when the existing ones do not cover it.
- Every endpoint MUST get a k6 scenario in `apps/api/load/scenarios` in the same change (listed in `scenarios/index.js`, ending with `think()`), so it is part of every load test: `smoke`, `load`, `stress`, `spike`, and `soak` (see `apps/api/load/README.md`).
- The dashboard reads the metric `http_server_requests_milliseconds_*` (labels `uri`, `method`, `status`, `outcome`), `jvm_memory_*_bytes`, and `hikaricp_connections_*`. Latency percentiles need the histogram that `management.metrics.distribution.percentiles-histogram` enables for `http.server.requests`; do not remove it.
- The project has no Grafana MCP server. To check logs, traces, or metrics by hand, open Grafana at `http://localhost:3030`.

## UI

- The Playwright MCP server (registered in `.mcp.json` by spec 012) lets Claude Code open the running app in a browser, resize the viewport, and take screenshots. Use it to look at any UI you build or change, and for the `screenshots/` images (`<page>_<viewport>_before.png` and `<page>_<viewport>_after.png`; desktop is 1440×900, tablet 768×1024, mobile 390×844).
- **Accessibility (A11Y)**: all components and UI MUST be accessible (WCAG 2.2 AA): native elements first, visible focus, keyboard operation, labels, and contrast.
- **Responsiveness**: all components and UI MUST work on desktop, tablet, and mobile. The Figma design has only desktop frames: specs 012 to 026 build the screens for the 1440 px design, and spec 027 added the tablet and mobile layouts (the rules are in [DESIGN.md](DESIGN.md)). Every UI change keeps all three working: `e2e/responsive.spec.ts` checks the four screens for horizontal scroll and for 24×24 px targets at 1440, 1280, 1024, 768, 390, and 320 px.
- Follow [DESIGN.md](DESIGN.md) and [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md).
