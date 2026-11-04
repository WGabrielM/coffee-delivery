# API: dashboard and load profiles

## Scope
@infra/grafana/dashboards/coffee-delivery-api.json - New; dashboard as code
@infra/grafana/provisioning - New; dashboard provider
@compose.yaml - Mount the provisioning files into the Grafana service
@apps/api/load - Add the `load`, `stress`, `spike`, and `soak` profiles and shared thresholds
@apps/api/load/README.md - New; what each profile does and how to read results
@package.json - Scripts `load`, `load:stress`, `load:spike`, `load:soak`
@.docs/DEVELOPMENT.md, @.docs/QA.md - Document the dashboard and the profiles

## Context
Part of: Coffee Delivery capstone.
Depends on: @.specs/005-catalog-list-coffees.md, @.specs/006-catalog-filter-by-tags.md, @.specs/007-checkout-config.md
The API already logs in JSON and exports OpenTelemetry data to Grafana LGTM (spec 003), and each catalog and checkout endpoint has a k6 scenario with a smoke profile. The mold keeps its Grafana dashboard as code and runs five load profiles. Order endpoints add their own scenarios in specs 010 and 011.

## Business needs
The team sees how the API behaves under traffic and can repeat the same load runs at any time.

## Acceptance Criteria
- After `yarn infra:up`, Grafana on port 3030 lists a dashboard named "Coffee Delivery API" without any manual import; it is provisioned from `infra/grafana/dashboards/coffee-delivery-api.json`, which is valid JSON.
- The dashboard has panels for request rate by route, error rate (5xx), latency p50, p95, and p99 by route, JVM heap, and database connection pool usage.
- `yarn load:smoke`, `yarn load`, `yarn load:stress`, `yarn load:spike`, and `yarn load:soak` each run every scenario in `apps/api/load/scenarios`; each exits non-zero when a threshold fails.
- Every profile defines these thresholds: failed requests below 1% and p95 latency below 500 ms; stage durations and virtual users are documented in `apps/api/load/README.md`, and the soak duration is configurable by an environment variable.
- After `yarn load:smoke`, the dashboard shows traffic for `/api/v1/coffees` and `/api/v1/checkout-config` (manual QA step in the end-of-task report).
- `yarn code:fix`, `yarn lint`, `yarn types:check`, `yarn test`, `yarn test:e2e`, and `yarn build` pass.

## What to do
- Build the dashboard against the metrics the API already exports; check the metric names in Grafana before writing queries.
- Write the profiles on top of the shared harness from spec 003, one options file per profile.
- Verify the current k6 version before pinning it.

## What not to do
- Do not add alert rules or notification channels.
- Do not change endpoint behavior.
- Do not add load scenarios for the order endpoints; specs 010 and 011 do.

## Result
The dashboard loads by itself in Grafana, and five documented k6 profiles exercise every catalog and checkout endpoint with pass or fail thresholds.

## Open questions
None
