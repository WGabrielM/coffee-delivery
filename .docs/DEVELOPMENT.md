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
- Each endpoint is one request handler: one class in `interfaces`, named `<Action>RequestHandler`, with one route and one public method, `handle`. A request handler depends on exactly one use case, and a use case serves exactly one request handler (one to one).
- `ArchitectureTest` enforces these rules; do not weaken it to make a change pass.

Package names cannot be Java keywords, so the fourth layer is `interfaces` (plural), not `interface`.

**Running the API.** It needs JDK 21 or newer, and Docker for the database. `yarn api:dev` loads `.env.local`, runs `gradlew bootRun` in `apps/api`, and serves on port 3000. Run `yarn infra:up` first. The API reads `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_PORT`, and optionally `OTEL_EXPORTER_OTLP_ENDPOINT` (default `http://localhost:4318`) from the environment; they have no defaults in `application.yaml`. Running from an IDE needs the same variables.

**Format before checking.** `yarn code:fix` applies Spotless (google-java-format). `yarn lint` fails on Java that is not formatted.

**Logs.** The API writes one JSON object per line on stdout (`@timestamp`, `level`, `message`, `traceId`, `spanId`, and the key/value pairs of the event). Each request produces one line, `request completed`, with `method`, `path`, `status`, and `durationMs`; the query string is never logged.

### App (`apps/app`)

- Pages in `src/pages` only compose features. Features by domain in `src/features/<domain>`. Shared presentational components in `src/components`. The API client in `src/api`; helpers in `src/lib`.
- Components do not fetch data directly: features expose hooks (TanStack Query) and components receive data through props.
- Colors, fonts, and sizes come from the theme tokens ([DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)); components contain no hex color literal.

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
- Every endpoint MUST get a k6 scenario in `apps/api/load/scenarios` in the same change, so it is part of every load test.
- The project has no Grafana MCP server. To check logs, traces, or metrics by hand, open Grafana at `http://localhost:3030`.

## UI

- The Playwright MCP server (registered in `.mcp.json` by spec 012) lets Claude Code open the running app in a browser, resize the viewport, and take screenshots. Use it to look at any UI you build or change, and for the `screenshots/` images (`<page>_<viewport>_before.png` and `<page>_<viewport>_after.png`; desktop is 1440×900, tablet 768×1024, mobile 390×844).
- **Accessibility (A11Y)**: all components and UI MUST be accessible (WCAG 2.2 AA): native elements first, visible focus, keyboard operation, labels, and contrast.
- **Responsiveness**: all components and UI MUST work on desktop, tablet, and mobile. The Figma design has only desktop frames: specs 012 to 026 build the screens for the 1440 px design, and spec 027 adds the tablet and mobile layouts. From spec 027 on, every UI change keeps all three working.
- Follow [DESIGN.md](DESIGN.md) and [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md).
