# Plan 008: API dashboard and load profiles

- Number: 008
- Created: 2026-11-04
- Spec: [.specs/008-api-observability-and-load-tests.md](../.specs/008-api-observability-and-load-tests.md)

## Concept summary

No open question. The metric names were checked in the running Grafana before writing any query (the spec asks for it). Choices made in this plan, each recorded in `adrs/api-observability-and-load-tests.md`:

1. **Real metric names** (Micrometer through OTLP into Prometheus): `http_server_requests_milliseconds_{count,sum,bucket}` with the labels `uri` (the route template), `method`, `status`, `outcome`; `jvm_memory_used_bytes` and `jvm_memory_committed_bytes` with `area="heap"`; `hikaricp_connections_{active,idle,pending,max}` with `pool`. The time unit is milliseconds.
2. **Latency percentiles need histogram buckets, and the API did not export them** (only `le="+Inf"`). The fix is one setting, `management.metrics.distribution.percentiles-histogram.http.server.requests: true`, pinned by `ApplicationConfigTest`. It changes no endpoint behavior.
3. **The dashboard is one JSON file**, `infra/grafana/dashboards/coffee-delivery-api.json`, with the panels: request rate by route, error rate (5xx), latency p50, p95, and p99 by route, JVM heap, and database connection pool. Queries use a fixed `[1m]` window because the API pushes a sample every 10 seconds.
4. **Provisioning by mount.** The `grafana/otel-lgtm` image reads every provider file in `/otel-lgtm/grafana/conf/provisioning/dashboards/`. Compose mounts `infra/grafana/provisioning/dashboards/coffee-delivery.yaml` there and `infra/grafana/dashboards` at `/otel-lgtm/coffee-delivery-dashboards`, read only. UI edits are not saved (`allowUiUpdates: false`): the file is the source.
5. **Five k6 profiles, one options file each** (`smoke.js` exists; `load.js`, `stress.js`, `spike.js`, `soak.js` are new) on a shared helper `lib/profile.js`. Every profile runs every scenario of `scenarios/index.js`, so the order scenarios of specs 010 and 011 join automatically. VUs are per scenario. A think time (`THINK_SECONDS`, default 0.5) models a person and keeps a local run realistic.
6. **Thresholds** shared in `lib/config.js`: failed requests below 1%, p95 below 500 ms, checks above 99%; smoke keeps its stricter `rate==0` and `checks==1`. The soak duration comes from `SOAK_DURATION` (default `30m`).
7. **Root scripts** `load`, `load:stress`, `load:spike`, `load:soak` use the existing `scripts/load.mjs`. Tests in `scripts/` check the profiles, the thresholds, the README, the dashboard JSON, the provider, and the Compose mounts.

## Tasks

| # | Task | Test first |
| --- | --- | --- |
| 1 | `scripts/observability.test.mjs`: dashboard is valid JSON with the required panels and real metric names; provider path matches the Compose mount; Compose still has two services | Fails, then passes |
| 2 | `scripts/api-scripts.test.mjs`: the five profile files, shared thresholds, `SOAK_DURATION`, README, the four root scripts | idem |
| 3 | `ApplicationConfigTest`: percentile histogram for `http.server.requests` | idem |
| 4 | Dashboard JSON, provider, Compose mounts | The tests above |
| 5 | `lib/profile.js`, `lib/config.js`, the four profile files, `README.md`, think time in `http.js` | idem |
| 6 | Docs: `DEVELOPMENT.md`, `QA.md`, `ARCHITECTURE.md` | Root documentation tests |
| 7 | Manual: `yarn infra:up`, traffic from k6, the dashboard in Grafana shows `/api/v1/coffees` and `/api/v1/checkout-config` | Manual QA |

## New dependencies

None. k6 is pinned in the docs through the `grafana/k6` image used for verification (the owner can use a local k6).
