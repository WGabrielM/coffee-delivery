# ADR: Evidence round, business metrics, a warm start for the tests, and the card feedback

- Status: Accepted and verified
- Date: 2026-11-13
- Spec: none (a feedback round after the capstone delivery; the teacher's points are answered in [docs/FEEDBACK-RESPONSE.md](../docs/FEEDBACK-RESPONSE.md))
- Documents written: [OBSERVABILITY.md](../docs/OBSERVABILITY.md), [TESTING.md](../docs/TESTING.md), [DECISIONS.md](../docs/DECISIONS.md), [AGENTS-IN-ACTION.md](../docs/AGENTS-IN-ACTION.md)

## Context

The capstone feedback (8.2 out of 10, approved) asked for more depth on how observability was integrated and on the automated tests, more reasoning behind the architectural decisions, and examples of how the agents are used. Before writing, the observability and the tests were looked at again to find what was thin, because a document can only be as strong as what it describes.

## Decisions

1. **Business metrics next to the HTTP ones.** The dashboard answered "how fast and how many requests" but not "how many orders, and how many were retries" or "did the retention job run". `CreateOrderRequestHandler` counts `orders.created{outcome=created|replayed}` (registered in the constructor, so the series exist at 0 and `increase()` works from the first request; a refused request is not counted); `ClearOldAddressesJob` already counted `orders.addresses.cleared`. A second counter next to `http_server_requests` was kept on purpose: the HTTP count cannot tell a replay from an order without knowing the status mapping, and the counter survives a change of route. Where business metrics live: counted at the entry point (the handler or the job), with Micrometer, and never in `application` (the architecture rule of spec 036 forbids it). The `structure-auditor` pointed out that a port `OrderMetrics` in `application` would be cleaner; it needs its own spec and is in the backlog.
2. **Three panels** (orders created per minute by outcome, client errors by status, addresses cleared in 24 h), so the dashboard has ten. The names `orders_created_total` and `orders_addresses_cleared_total` were checked in the running Prometheus before they were written in the queries. `scripts/observability.test.mjs` pins the new panels and their metric names; the Java tests pin that the counters count. A first version of a test that matched the Java source text was removed after the review: it would pass with a counter that is never incremented.
3. **The evidence was produced by running the system, not written from memory:** the API built from the current code, a mixed load of about 5 requests a second for 4 minutes (created, replayed, quotes, reads, `400`, `404`, `422`), a screenshot of the ten panels, a log line, and its trace read back from Tempo through the `traceId`. The Grafana container that was running had been created from an old clone of the repository on 2026-11-08 (the fresh-clone check of spec 031), so its mounts pointed at the old dashboard file; it was recreated with `docker compose up --force-recreate grafana` from the real repository, which is the documented way (`yarn infra:up`) and which loses no data worth keeping (no volume, by decision).
4. **A warm start for the end-to-end run.** One run of 9 Playwright failures on 2026-11-10 passed on two reruns with nothing changed. The `bug-investigator` traced it (medium confidence, said so) to a start-up race: the first tests loaded a cold dev server and a cold JVM inside the 5 s expectation (the failures were exactly the first 8 tests of the run plus one more, and one of them sends no API request). The fix is small and read-only: `server.warmup.clientFiles` in Vite for the entry and the two lazy pages, and a warm-up in the global setup that reads the pages and the read endpoints twice and never writes. `scripts/e2e-warmup.test.mjs` (4 tests) pins both, and pins that the expectation timeout is not raised (a longer timeout would hide a slow start, not remove it).
5. **The card feedback of 2026-11-11 reverses a choice of spec 021.** The counter keeps its value after adding, and a badge on the cart button says how many of that coffee are in the cart (out of the flow, so the card keeps its size; `aria-hidden`, with an invisible "N in the cart" description for assistive technology). The `code-reviewer` found that the spoken message could say "Added 5" when the cart was at the cap of 99 and added nothing; the message now says what really went in, or that the coffee is at the maximum, with two tests.
6. **A small duplicate removed at once:** the quote hook used its own copy of the ZIP code regex; it imports `ZIP_CODE_PATTERN` from the address schema (the `structure-auditor` finding 2). The other findings are decisions that need a spec and are listed, not hidden.

## Verified (2026-11-13)

- API: 172 unit and 113 end-to-end tests, coverage 99% of lines, 94% of branches. App: 694 Vitest tests and 199 Playwright tests. Scripts: 165 tests. Total 1,343 ([run log](../docs/evidence/test-run-2026-11-13.txt)).
- Prometheus returned the three new series after the first traffic; the dashboard shows ten panels with data ([screenshot](../docs/evidence/grafana-dashboard.png)).
- A `POST /api/v1/orders` log line (`traceId` 70b7b9c8...) was found in Tempo as a span of 5.17 ms (the log said 4 ms).

## Backlog (from the audits, each needs a spec)

An `OrderSummary` hook and a context that is not called "submit state"; order invariants (quantity range, address format) in the domain; a metrics port in `application`; the `Order` types in `features/orders`; the domain architecture rule as an allow-list; the fingerprint as its own class; Loki for logs and JDBC spans for traces.

## Consequences

- The observability claim is now backed by a screenshot, a trace, and tests that fail when a panel or a metric name drifts.
- The test numbers in the documents come from a dated run with a saved log.
- The end-to-end run reads the pages and the API before the first test; it adds a second or two.
