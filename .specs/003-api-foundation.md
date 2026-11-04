# API: foundation

## Scope
@apps/api - New; Spring Boot project with Gradle wrapper, `build.gradle.kts`, `settings.gradle.kts`
@apps/api/src/main/java/com/coffeedelivery/CoffeeDeliveryApplication.java - New
@apps/api/src/main/java/com/coffeedelivery/shared - New; error handling and common configuration
@apps/api/src/main/java/com/coffeedelivery/system - New slice; `GetApiInfoUseCase`, `GetApiInfoRequestHandler`
@apps/api/src/main/resources/application.yaml - New; port 3000, datasource, Flyway, structured logging, OTLP
@apps/api/src/main/resources/db/migration - New; empty, Flyway location
@apps/api/src/test/java/com/coffeedelivery/ArchitectureTest.java - New; ArchUnit rules
@apps/api/src/test - New; unit tests and `e2e` tests with Testcontainers
@apps/api/load - New; k6 harness and the scenario for `GET /api/v1`
@package.json - Scripts `api:dev`, `load:smoke`; the root tasks now run the API
@.docs/ARCHITECTURE.md, @.docs/CONVENTIONS.md, @.docs/QA.md - Document the API layout, error format, and coverage gate

## Context
Part of: Coffee Delivery capstone.
Depends on: @.specs/002-local-infrastructure.md
The mold builds its API in Nest.js with vertical slices and four layers; here the same architecture is built in Spring Boot. The conventions come from the mold: `/api/v1/*`, camelCase JSON, error shape `{ "error": { "code", "message", "fields" } }` with stable `snake_case` codes, structured logs, OpenTelemetry to Grafana, one k6 scenario per endpoint. Versions of Java (21 or newer LTS), Spring Boot, Gradle, and libraries are verified when scaffolding.

## Business needs
The team has a running, observable, architecture-checked API skeleton where every endpoint spec adds one slice without redoing infrastructure.

## Acceptance Criteria
**Runtime**
- `yarn api:dev` starts the API on port 3000 against the Postgres from spec 002 and applies Flyway; `GET /actuator/health` returns `200` and `"status":"UP"`.
- `GET /api/v1` returns `200` and `{ "name": "coffee-delivery-api", "version": "v1" }`.

**Errors**
- An unknown route under `/api/v1` returns `404` and `{ "error": { "code": "not_found", "message": "..." } }`.
- A request body that is not valid JSON returns `400` and error code `validation_failed`; `fields` is present only for `validation_failed` and maps a JSON path to a message.
- An unhandled exception returns `500` and error code `unexpected_error`, without a stack trace or internal message in the body.

**Architecture**
- `ArchitectureTest` fails when `domain` depends on `application`, `infrastructure`, `interface`, or Spring; when `application` depends on `infrastructure` or `interface`; when `interface` depends on `infrastructure`; when a slice uses another slice's `infrastructure` or `interface`; or when slices form a cycle.
- Every `*UseCase` has exactly one public method, `execute`, and every `*RequestHandler` exactly one, `handle`.

**Observability**
- Logs go to stdout as JSON with timestamp, level, message, and `traceId`; each request produces one line with method, path, status, and duration in milliseconds.
- After a call to `GET /api/v1`, Grafana (port 3030) shows its trace and the HTTP server metrics (manual QA step listed in the end-of-task report).

**Tests and gates**
- `yarn types:check`, `yarn code:fix`, `yarn lint`, `yarn build`, and `yarn test` pass; `yarn test:e2e` runs the Testcontainers tests and a JaCoCo verification that fails below 80% line coverage.
- `yarn load:smoke` runs the k6 scenario for `GET /api/v1` and reports no failed check.

## What to do
- Scaffold the project, configure Spotless (formatting) and the lint rules, and provide the Gradle tasks the root runner calls (spec 001): `spotlessApply`, `spotlessCheck`, `compileJava`, `compileTestJava`, `test` (unit tests, no Docker), `e2eTest` (Spring Boot tests with Testcontainers), `jacocoTestCoverageVerification`, and `build`.
- Write the tests first: use case unit test, e2e tests for the routes and error cases above, and the architecture rules.
- Implement the error handling once in `shared` so every later endpoint inherits it.
- Configure structured logging and OpenTelemetry export to `localhost:4318` through environment-driven settings.
- Create the k6 harness in `apps/api/load` with shared helpers and a smoke profile that runs every scenario in the folder.

## What not to do
- Do not add business endpoints or tables; specs 004 to 011 do.
- Do not add authentication or CORS; the app uses a dev proxy and there are no users.
- Do not add the Grafana dashboard or the other load profiles; spec 008 does.
- Do not add a Dockerfile or deployment settings.

## Result
The API starts, answers `GET /api/v1`, formats every error in the project's shape, logs and traces each request, enforces the slice architecture by test, and has the load and coverage gates in place.

## Open questions
None
