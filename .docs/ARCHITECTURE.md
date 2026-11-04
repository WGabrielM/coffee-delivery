# Architecture

Status markers: `[implemented]` exists in the repository; `[planned]` is queued in `.specs/`. Never treat a `[planned]` item as installed. Versions are checked against the registries when each part is scaffolded; this document records the choice, not a version number.

## Tech stack

| Part | Choice | Status |
| --- | --- | --- |
| Package manager and scripts | Yarn 1 (root `package.json`), `scripts/run-task.mjs` runs each root task in every workspace | `[implemented]` |
| Lint and format (JavaScript, TypeScript, JSON, CSS) | `oxlint` and `oxfmt` | `[implemented]` |
| Git hooks | Lefthook: `pre-commit` runs lint-staged, `commit-msg` runs commitlint (Conventional Commits) | `[implemented]` |
| Local infrastructure | Docker Compose: PostgreSQL 18 and Grafana LGTM, versions pinned in `compose.yaml` | `[implemented]` |
| API | Java (LTS) and Spring Boot, built with Gradle, in `apps/api` | `[planned]` (spec 003) |
| Database | PostgreSQL; schema and seed by Flyway migrations | `[planned]` (specs 003, 004, 009) |
| API formatting | Spotless | `[planned]` (spec 003) |
| API tests | JUnit 5, Testcontainers, ArchUnit, JaCoCo (minimum 80% line coverage) | `[planned]` (spec 003) |
| Observability | Structured JSON logs, OpenTelemetry (Micrometer) to Grafana LGTM, dashboard as code | `[planned]` (specs 003 and 008) |
| Load tests | k6, one scenario per endpoint, profiles smoke, load, stress, spike, soak | `[planned]` (specs 003 and 008) |
| App | React, TypeScript, Vite, React Router, TanStack Query, React Hook Form with Zod, in `apps/app` | `[planned]` (spec 012 onward) |
| Styling | Tailwind CSS mapped to the Figma tokens; fonts Roboto and Baloo 2, self-hosted | `[planned]` (spec 013) |
| App tests | Vitest and Testing Library; Playwright with axe | `[planned]` (spec 012 onward) |
| CI | GitHub Actions | `[planned]` (spec 030) |

## Ports

| Service | Port |
| --- | --- |
| API | 3000 |
| App (Vite dev server) | 5173 |
| PostgreSQL | 5432 |
| Grafana | 3030 |
| OpenTelemetry (gRPC, HTTP) | 4317, 4318 |

Compose binds every published port to `127.0.0.1`, so the database and Grafana are reachable only from the developer's machine.

The app calls the API through the Vite dev proxy (`/api` to `http://localhost:3000`), so the API needs no CORS settings.

## Local infrastructure `[implemented]`

`compose.yaml` runs two services and nothing else; the API and the app run on the host.

| Service | Image | Data | Health check |
| --- | --- | --- | --- |
| `postgres` | `postgres:18.6-alpine` | Named volume `postgres-data` (kept by `yarn infra:down`) | `pg_isready` |
| `grafana` | `grafana/otel-lgtm:0.39.0` (Grafana, Loki, Tempo, Prometheus, OpenTelemetry collector) | None; dashboards come from files (spec 008) | `/api/health` and the two OTLP ports |

Database name, user, password, and port come from `.env.local`; the Compose file has no defaults for them. Image versions are pinned and are changed on purpose, in `compose.yaml`, with a note in the ADR.

## Repository layout

```
apps/
  api/            [planned] Spring Boot API (Gradle)
  app/            [planned] React app (Vite)
.agents/skills/   [implemented] workflow skills (linked into .claude/skills)
.claude/          [implemented] agents and commands
.docs/            [implemented] the documentation hub
.specs/           [implemented] specs to implement
plans/            [implemented] one plan per spec execution
adrs/             [implemented] one ADR per decision
docs/             [implemented] PLAN.md and design/ (the Figma analysis)
infra/            [planned] Grafana provisioning and dashboards
scripts/          [implemented] task runner, skill linker, and their tests
compose.yaml      [implemented] PostgreSQL and Grafana LGTM
.env.example      [implemented] development values; `yarn env:setup` copies it to .env.local (ignored by Git)
```

The root package only orchestrates scripts and Git hooks; each app owns its own build.

## API architecture `[planned]`

The API is organized as vertical slices by domain, and each slice has four layers (see [DEVELOPMENT.md](DEVELOPMENT.md)):

```
apps/api/src/main/java/com/coffeedelivery/
  catalog/       coffees and tags
  orders/        checkout configuration and orders
  system/        API information
  shared/        error handling and common configuration
```

Each slice (`catalog`, `orders`, `system`) has the packages `domain`, `application`, `infrastructure`, and `interface`.

- `domain` has entities and rules and depends on nothing but the language. `application` has the use cases (`<Action>UseCase.execute`) and the ports they need. `infrastructure` implements the ports (database access). `interface` has the request handlers (`<Action>RequestHandler.handle`, one per endpoint) and the HTTP mapping.
- Slices do not use each other's `infrastructure` or `interface`. `orders` reads coffee prices through its own `CoffeePriceLookup` port, not through `catalog` classes.
- `ArchitectureTest` (ArchUnit) enforces these rules and fails the build when one is broken.

## Endpoints `[planned]`

| Method and path | Spec | Purpose |
| --- | --- | --- |
| `GET /actuator/health` | 003 | Health check |
| `GET /api/v1` | 003 | API name and version |
| `GET /api/v1/coffees` (`?tags=`) | 005, 006 | List coffees, optionally filtered by tags (AND logic) |
| `GET /api/v1/checkout-config` | 007 | Currency, delivery fee, delivery estimate, payment methods |
| `POST /api/v1/orders` | 010 | Create an order |
| `GET /api/v1/orders/{id}` | 011 | Read an order |

## Data model `[planned]`

- `tags` (`id`, `slug`, `name`, `position`), `coffees` (`id`, `slug`, `name`, `description`, `price_in_cents`, `position`), `coffee_tags` (`coffee_id`, `tag_id`): spec 004.
- `orders` (address, payment method, `subtotal_in_cents`, `delivery_fee_in_cents`, `total_in_cents`, `status`, `created_at`) and `order_items` (`coffee_id`, `coffee_name`, `unit_price_in_cents`, `quantity`, `line_total_in_cents`): spec 009.

## App architecture `[planned]`

- Pages in `src/pages`; features by domain in `src/features` (`catalog`, `cart`, `checkout`, `orders`); shared components in `src/components`; the API client in `src/api`; helpers in `src/lib`; assets in `src/assets`.
- Server state is read with TanStack Query. The cart is client state (a reducer in a context, saved in `localStorage`) and holds only coffee ids and quantities.
- Coffee photos are found by the coffee `slug`; the API sends no image.
