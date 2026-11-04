# ADR: API foundation

- Status: Accepted and verified (compiled, tested, and run on 2026-11-04; see Verification)
- Date: 2026-11-04
- Spec: [.specs/003-api-foundation.md](../.specs/003-api-foundation.md)
- Plan: [plans/003-api-foundation-plan.md](../plans/003-api-foundation-plan.md)

## Context

Every endpoint spec (004 to 011) needs the same base: a running Spring Boot API, one error format, structured logs and traces, architecture rules that fail the build, and test, coverage, and load gates. The mold builds this in Nest.js; here the same architecture is built in Java.

## Decisions

1. **Stack and versions** (looked up on 2026-11-04): Java 21 or newer compiled with `--release 21` (no toolchain download, so a newer JDK also works), Spring Boot 4.1.2, Gradle 9.6.1 through the wrapper, Spotless 8.7.0 with google-java-format, ArchUnit 1.4.1, JaCoCo 0.8.14. Spring Boot 3.5 is out of support, and 4.1 is the current line.
2. **The layer package is `interfaces`.** `interface` is a Java keyword and cannot be a package name. The other three layers keep their names. Docs, specs 005, 006, 007, 010, 011, and the `structure-auditor` agent use the new name.
3. **`test` and `e2eTest` are one source set split by the JUnit tag `e2e`.** `test` excludes the tag and needs no Docker; `e2eTest` runs only tagged tests. JaCoCo reads the data of both tasks and fails below 80% line coverage. `CoffeeDeliveryApplication` is excluded from the count because it only calls `main`.
4. **Testcontainers through `GenericContainer`** with the same PostgreSQL image as `compose.yaml` (a root test keeps them equal), started once per JVM and wired by `@DynamicPropertySource`. This uses only classes that exist in every Testcontainers version, and the tests need no `@ServiceConnection`.
5. **One error handler.** `ApiExceptionHandler` (`shared.error`) maps invalid JSON to `400 validation_failed` with `fields.body`, framework errors by status (`404 not_found`, `405 method_not_allowed`, `415 unsupported_media_type`, other 4xx `bad_request`), and everything else to `500 unexpected_error`. Messages are fixed sentences; the exception is only logged.
6. **Architecture rules are code with a base-package parameter.** `ArchitectureRules` runs on the real code (`ArchitectureTest`) and on fixture packages that break each rule on purpose (`ArchitectureRulesTest`), so a rule that stops working fails a test. Rules: domain depends on no other layer, no Spring, no JSON library; application does not use infrastructure or interfaces; interfaces do not use infrastructure; a slice does not use another slice's infrastructure or interfaces; slices form no cycle; use cases have one public method, `execute`; request handlers have one public method, `handle`. The one-to-one link between a handler and a use case is a convention, not a rule yet.
7. **Logs and telemetry.** Spring Boot's `logstash` JSON format on stdout; a servlet filter inside the observation filter writes one `request completed` line per request with `method`, `path`, `status`, and `durationMs` as key/value pairs and never the query string. Traces and metrics go by OTLP/HTTP to `OTEL_EXPORTER_OTLP_ENDPOINT` (default `http://localhost:4318`) through `spring-boot-starter-opentelemetry`.
8. **Settings come from the environment.** `application.yaml` has no database defaults; `yarn api:dev` loads `.env.local` into the environment of `gradlew bootRun`. `.env.example` stays the only place with the development values.
9. **Only the health endpoint is exposed by Actuator.**
10. **k6 harness.** `apps/api/load/scenarios/index.js` lists every scenario; `smoke.js` builds one k6 scenario per export. A root test fails when a scenario file is not in the index. k6 is run from the machine (`yarn load:smoke` explains how to install it when missing).
11. **Lint** for the API is Spotless plus `javac -Xlint:all`; warnings do not fail the build yet.

## Verification (2026-11-04)

The code was first written in a workspace with no access to Maven Central, then compiled, tested, and run on a development machine (JDK 21, Docker, Windows). Everything compiled and passed without a change to a decision. The three points that were uncertain:

1. **Starter names are correct** in Spring Boot 4.1.2: `spring-boot-starter-webmvc`, `spring-boot-starter-flyway`, and `spring-boot-starter-opentelemetry` all resolve from Maven Central. `spring-boot-starter-actuator`, `-jdbc`, and `-test` keep their names.
2. **OTLP properties are correct and current**, checked against the `spring-configuration-metadata.json` of the 4.1.2 jars. Traces: `management.opentelemetry.tracing.export.otlp.endpoint` (the older `management.otlp.tracing.*` is deprecated). Metrics: `management.otlp.metrics.export.url` and `.step`. Sampling: `management.tracing.sampling.probability`. The defaults (`http://localhost:4318/v1/traces` and `/v1/metrics`) equal the configured values, so the check was made on the metadata and not on the behavior alone. After a call to `GET /api/v1`, Tempo shows the `http get /api/v1` trace (service `coffee-delivery-api`) and Prometheus shows the `http_server_requests_milliseconds_*` series plus the Hikari and JVM metrics.
3. **The `logstash` format puts key/value pairs at the top level.** A request line is `{"@timestamp":...,"message":"request completed","logger_name":...,"level":"INFO","traceId":...,"spanId":...,"method":"GET","path":"/api/v1","status":200,"durationMs":29}`. The query string never appears.

Other findings:

- **Logs stay on stdout.** The spec asks for JSON on stdout, and nothing ships them to Loki, so Grafana shows traces and metrics but no logs. Shipping logs needs the OpenTelemetry logback appender (a new dependency, plus `management.opentelemetry.logging.export.otlp.endpoint`); it is a candidate for spec 008, not part of this decision.
- **Coverage:** 97% of lines over `test` and `e2eTest`; the gate is 80%.
- **Windows:** the task runner and `yarn api:dev` call `.\gradlew.bat` (explicit path). With `NoDefaultCurrentDirectoryInExePath=1`, `cmd` does not look in the current directory, so a bare `gradlew.bat` fails.
- **OneDrive:** with the repository inside a OneDrive folder, Gradle can fail with `Unable to delete directory build\test-results\...\binary` because OneDrive turns old build files into placeholders. Deleting the folder fixes one run; keeping the repository (or at least `apps/api/build`) out of OneDrive's sync avoids it.
- `yarn test:e2e` on the app reuses any server already on port 5173; another project's Vite server on that port makes the smoke tests read the wrong page.
- `.mcp.json` (spec 012, decision 9) was missing from the tree and is added with the app commit.

## Consequences

- A developer needs JDK 21 or newer and Docker; the load tests also need k6 (or the `grafana/k6` image).
- `spotlessCheck` passes after `yarn code:fix`; Git hooks do not run Spotless on staged Java.
- On Linux and macOS the wrapper script `gradlew` must be executable; its Git mode is `100755`.
