# ADR: API dashboard and load profiles

- Status: Accepted and verified
- Date: 2026-11-04
- Spec: [.specs/008-api-observability-and-load-tests.md](../.specs/008-api-observability-and-load-tests.md)
- Plan: [plans/008-api-observability-and-load-tests-plan.md](../plans/008-api-observability-and-load-tests-plan.md)

## Context

The API already sends traces and metrics to Grafana LGTM (spec 003) and has a k6 smoke profile. The team needs a dashboard that appears by itself and load profiles that can be repeated.

## Decisions

1. **The metric names were read from the running Prometheus, not guessed.** Micrometer through OTLP gives `http_server_requests_milliseconds_{count,sum,bucket}` (labels `uri` as the route template, `method`, `status`, `outcome`), `jvm_memory_used_bytes` and `jvm_memory_committed_bytes` (label `area`), and `hikaricp_connections_{active,idle,pending,max}` (label `pool`). The unit is milliseconds, so a query written for `..._seconds_` would return nothing.
2. **Latency percentiles needed a setting, not only a query.** Without it the histogram had a single `le="+Inf"` bucket and `histogram_quantile` could not work. `management.metrics.distribution.percentiles-histogram[http.server.requests]: true` publishes the buckets; `ApplicationConfigTest` pins it. Endpoint behavior does not change.
3. **One dashboard file** (`infra/grafana/dashboards/coffee-delivery-api.json`, uid `coffee-delivery-api`) with seven panels: request rate by route, error rate (5xx), latency p50, p95, and p99 by route, JVM heap, and database connection pool. Queries use a fixed `[1m]` window because the API pushes a sample every 10 seconds, and filter on `job="coffee-delivery-api"`. Because panels group by `uri`, a new route appears without a change to the dashboard.
4. **Provisioning by two read-only mounts** in `compose.yaml`: the provider file into `/otel-lgtm/grafana/conf/provisioning/dashboards/` (the image reads every file there) and the dashboards folder into `/otel-lgtm/coffee-delivery-dashboards`. The provider sets `allowUiUpdates: false` and the dashboard `editable: false`, so the file stays the source. Running `yarn infra:up` after pulling this change recreates only the Grafana container; the Grafana container holds no data worth keeping.
5. **Five profiles, one options file each**, over the shared `lib/profile.js` (`scenariosFor`, `ramp`): `smoke` (1 VU, 10 s), `load` (10 VUs, 3 min), `stress` (up to 100 VUs, 4.5 min), `spike` (10 to 100 VUs, about 3 min), `soak` (10 VUs for `SOAK_DURATION`, default 30 minutes, in the options file). VUs are per scenario, and every profile runs every scenario of `scenarios/index.js`, so the order scenarios of specs 010 and 011 join all five.
6. **Thresholds are shared** in `lib/config.js`: failed requests below 1%, p95 below 500 ms, checks above 99%. `smoke` keeps its stricter `rate==0` and `checks==1`.
7. **Think time.** Each scenario ends with `think()` (`THINK_SECONDS`, default 0.5). Without it one virtual user sent about 1,500 requests per second and the profiles measured the load generator, not people. A root test fails when a scenario file does not call `think()`.
8. **k6 version.** The current release is 2.3.0 (2026-09-21), and the profiles were checked with `grafana/k6:2.3.0`. The repository does not pin k6 (it is not a package of the project); `load/README.md` states the version it was verified with.
9. **Root scripts** `load`, `load:stress`, `load:spike`, and `load:soak` call `scripts/load.mjs`; tests in `scripts/` guard the profiles, the README, the dashboard JSON, the provider, and the Compose mounts.

## Verification

- `k6 inspect` accepts the five profiles. `smoke` ran with no failed check. All 11 queries of the seven panels return data in Grafana after a smoke run, and the request-rate panel lists `/api/v1/coffees` and `/api/v1/checkout-config`.
- `load`, `spike`, and `soak` (with `SOAK_DURATION=10s`) were run for real; see the end-of-task report for their results.

## Consequences

- The dashboard is the place to look when a load profile slows down. Logs are not in it: they stay on stdout (spec 003), and shipping them to Loki is a separate decision.
- A new dependency-free convention: every scenario ends with `think()`.
- No new library. k6 stays a tool installed on the developer's machine.
