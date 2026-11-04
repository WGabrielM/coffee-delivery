# Plan 003: API foundation

- Number: 003
- Created: 2026-11-04
- Spec: [.specs/003-api-foundation.md](../.specs/003-api-foundation.md)

## Concept summary

No open question. The spec was approved on 2026-11-04. Choices made in this plan, each recorded in `adrs/api-foundation.md`:

1. **Versions** (looked up on 2026-11-04): Java 21 or newer (compiled with `--release 21`, no toolchain download), Spring Boot 4.1.2, Gradle 9.6.1 (wrapper), Spotless 8.7.0 with google-java-format, ArchUnit 1.4.1, JaCoCo 0.8.14. PostgreSQL 18.6 in the tests, the same image as `compose.yaml`.
2. **The layer package is `interfaces`, not `interface`.** `interface` is a reserved word in Java, so it cannot be a package name. Docs and specs 005, 006, 007, 010, and 011 were renamed in this change.
3. **`test` and `e2eTest` split by JUnit tag.** Unit tests run in `test` with no Docker. Tests tagged `e2e` run in `e2eTest` against Spring Boot and a Testcontainers PostgreSQL. JaCoCo merges the data of both and fails below 80% line coverage; `CoffeeDeliveryApplication` is excluded because it only calls `main`.
4. **Testcontainers through `GenericContainer`** (a class that exists in every Testcontainers version), started once per JVM and wired with `@DynamicPropertySource`, so the tests do not depend on the module layout of Testcontainers 2.
5. **The error contract lives in `shared/error`**: one `@RestControllerAdvice`. Codes: `validation_failed` (400, with `fields`), `not_found` (404), `method_not_allowed` (405), `unsupported_media_type` (415), `bad_request` (other 4xx), `unexpected_error` (500, generic message, the exception is only logged).
6. **Logs**: Spring Boot's `logstash` JSON format on stdout (`@timestamp`, `level`, `message`, and `traceId`/`spanId` from the tracing bridge). `RequestLoggingFilter` writes one line per request with `method`, `path`, `status`, and `durationMs` as key/value pairs.
7. **OpenTelemetry** through `spring-boot-starter-opentelemetry`: traces and metrics are sent by OTLP/HTTP to `OTEL_EXPORTER_OTLP_ENDPOINT` (default `http://localhost:4318`).
8. **Architecture rules are code**: `ArchitectureRules` (test sources) is parameterized by a base package, so the same rules run on the real code (`ArchitectureTest`) and on fixture packages that break each rule on purpose (`ArchitectureRulesTest`).
9. **Scripts**: `yarn api:dev` loads `.env.local` into the environment of `gradlew bootRun`; `yarn load:smoke` runs k6 on `apps/api/load/smoke.js`, which runs every scenario listed in `scenarios/index.js`. A test fails when a scenario file is not listed there.

## Tasks

Each task starts with its test.

| # | Task | Test first |
| --- | --- | --- |
| 1 | Architecture rules | `ArchitectureRulesTest` (fixtures that break each rule, and a clean fixture), `ArchitectureTest` (real code) |
| 2 | System slice | `GetApiInfoUseCaseTest`, `GetApiInfoRequestHandlerTest` |
| 3 | Error handling | `ApiExceptionHandlerTest`: invalid JSON, unknown status error, wrong method, wrong media type, unexpected exception without internals |
| 4 | Request logging | `RequestLoggingFilterTest`: one line with method, path, status, duration; status 500 when the chain throws |
| 5 | Configuration | `ApplicationConfigTest`: port, JSON log format, Flyway location |
| 6 | End to end | `ApiE2ETest`: health, Flyway ran, `GET /api/v1`, unknown route, invalid JSON, unexpected error, HTTP server metric |
| 7 | Gradle build | `build.gradle.kts` with the tasks the root runner calls |
| 8 | Root scripts | `scripts/api-scripts.test.mjs`: env file parsing, `api:dev` plan, `load` plan, scenarios listed in the index |
| 9 | k6 harness | `apps/api/load` |
| 10 | Docs | `.docs/*`, `README.md`, `docs/PLAN.md` |

## Verification limit

The workspace has no access to Maven Central or the Gradle plugin portal, so the Java code was written but **not compiled or run there**. The user runs `yarn code:fix`, `yarn types:check`, `yarn test`, `yarn test:e2e`, and `yarn build` on a machine with JDK 21 or newer and Docker, and sends back any error. The Node scripts and their tests run in the workspace.

## New dependencies

API (Gradle): Spring Boot starters `webmvc`, `actuator`, `jdbc`, `flyway`, `opentelemetry`, `test`; `flyway-database-postgresql`; the PostgreSQL JDBC driver; Testcontainers; ArchUnit. Plugins: Spring Boot, Spotless, JaCoCo. Root (Yarn): none.
