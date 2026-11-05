# API load tests (k6)

Five profiles run the same scenarios with different traffic. Every scenario in `scenarios/` that is exported by `scenarios/index.js` runs in every profile, so a new endpoint is covered by adding its scenario file and listing it there. A scenario file must end with `think()`.

Start the API first (`yarn infra:up`, then `yarn api:dev`) and run a profile from the repository root. k6 is not a Node package: install it (Windows `winget install k6`, macOS `brew install k6`) or run the `grafana/k6` image. This folder was verified with k6 2.3.0.

| Profile | Command | Traffic (virtual users, VUs, are counted per scenario) | Length |
| --- | --- | --- | --- |
| `smoke` | `yarn load:smoke` | 1 VU, to prove every scenario works. Accepts no failure at all | 10 s |
| `load` | `yarn load` | Ramp to 10 VUs in 30 s, hold 2 min, ramp down 30 s | 3 min |
| `stress` | `yarn load:stress` | Ramp to 20, 50, then 100 VUs (1 min each), hold 100 VUs 1 min, ramp down 30 s: finds where the API degrades | 4.5 min |
| `spike` | `yarn load:spike` | 10 VUs, a jump to 100 VUs in 10 s held for 1 min, back to 10 VUs, then ramp down | about 3 min |
| `soak` | `yarn load:soak` | Ramp to 10 VUs in 1 min, hold for `SOAK_DURATION`, ramp down 1 min: looks for leaks | 30 min by default |

## Thresholds

Every profile fails (k6 exits with a non-zero status) when:

- more than 1% of the requests fail (`http_req_failed` rate of 1% or more), or
- the p95 latency is 500 ms or more (`http_req_duration`), or
- 1% or more of the checks fail (the `smoke` profile accepts no failed request and no failed check).

## Settings

Set them as environment variables (`BASE_URL=http://localhost:3000 yarn load`):

| Variable | Default | Meaning |
| --- | --- | --- |
| `BASE_URL` | `http://localhost:3000` | The API under test |
| `THINK_SECONDS` | `0.5` | Pause between iterations of a virtual user. `0` sends requests as fast as the machine allows |
| `SOAK_DURATION` | `30m` | The steady part of the `soak` profile, in k6 duration format (`15s`, `10m`, `2h`) |

## Reading the results

k6 prints a summary at the end: `http_req_duration` (look at `p(95)`), `http_req_failed`, and `checks`. A line with a cross next to a threshold is the reason for a non-zero exit. While a profile runs, the Grafana dashboard "Coffee Delivery API" (`http://localhost:3030`, folder General) shows the same traffic by route: request rate, 5xx rate, p50/p95/p99 latency, JVM heap, and the database pool. Use it to see which route slowed down and whether the heap or the pool filled up.

## Adding a scenario

1. Create `scenarios/<endpoint>.js` that exports one function, calls `getAndCheck` or `postAndCheck` from `lib/http.js`, and ends with `think()`.
2. Export it from `scenarios/index.js`. A test (`yarn test`) fails when a scenario file is not listed there.
