# The agents in action

[.docs/AGENTS.md](../.docs/AGENTS.md) lists the six specialist agents, the 17 skills, and the 6 slash commands. This page shows them **working on this repository**: the exact request, what came back, and what was done with it. The examples are real runs of 2026-11-10 to 2026-11-13; the texts are the agents' own reports, shortened where marked, never invented.

## How the agents are built

| Agent | Can edit? | Tools | One-line job |
| --- | --- | --- | --- |
| `code-reviewer` | No | Read, Grep, Glob, Bash, Skill | A diff or branch to Conventional Comments with file and line |
| `structure-auditor` | No | Read, Grep, Glob, Bash, Skill | Layers, slices, duplication, size, dead code, ranked |
| `performance-analyst` | No | Read, Grep, Glob, Bash, Skill | N+1, missing indexes, bundle size, checked against Grafana |
| `evolution-advisor` | No | Read, Grep, Glob, Bash, Skill | What limits growth, and the next step with trade-offs |
| `bug-investigator` | No | Read, Grep, Glob, Bash, Skill, browser tools (read) | A bug to its root cause and a fix plan, with no code change |
| `docs-keeper` | Documents only | Read, Grep, Glob, Bash, Edit, Write | Keeps the documents true to the code |

Design choice: **the agents that judge cannot edit**. The finding and the fix are separate decisions: the agent reports with evidence, the main session (the AI that writes the code) and the owner decide what to do, and a reviewer cannot hide a change. The definitions are in [`.claude/agents/`](../.claude/agents); the commands `/health-check`, `/audit-structure`, `/analyze-performance`, `/plan-evolution`, `/investigate-bug`, and `/sync-docs` launch them.

---

## Example 1. The owner asks for a change; the workflow runs end to end

**Request (the owner, 2026-11-11, with a screenshot of a card showing "3" then "1")**

> i added 3 creamy espressos but when i clicked on the add to cart turn 1, we need to put something to alert the user he already added that amount of itens, but also stay with the amount after add to the cart

**What the workflow did**

1. Read the card, its 19 tests, and the cart context; saw that the first choice of spec 021 was to reset the counter to 1.
2. Decided the shape: the counter keeps its value; a badge (the existing `Badge` component) on the corner of the cart button shows how many of that coffee are in the cart, out of the flow so the card keeps its 256 by 310 size; the button gets an invisible description for screen readers; the live message says the new total.
3. Changed the code and the tests, took a screenshot to look at the result (the badge "3" on the button, the counter still 3), and found that four Playwright tests assumed the old behavior; adapted them and added one that measures that the card and the button do not move.
4. Ran the six commands (692 Vitest tests, 199 Playwright tests), updated `DESIGN.md`, `DESIGN_SYSTEM.md`, and `BUSINESS.md`, and committed and pushed (`98260bd`).

Two days later the `code-reviewer` agent reviewed this commit (example 2) and found a defect the author had missed.

---

## Example 2. `code-reviewer` on the latest change

**Request** (shortened)

> Review the change made today: commit 98260bd ("keep the card quantity after adding and show how many are in the cart") plus the uncommitted working-tree changes: business metrics `orders.created` in `CreateOrderRequestHandler`, three new panels in the Grafana dashboard, and their tests. Follow your usual output format. Read-only.

**What came back** (the findings, shortened; the agent read only and ran nothing)

- `todo (blocking)` `.docs/DEVELOPMENT.md:123`: the list of metrics the dashboard reads is stale; it does not list `orders_created_total` and `orders_addresses_cleared_total`.
- `todo (blocking)` `docs/CAPSTONE.md:135`: "the text is now false": it says the retention job has a metric but no Grafana panel, and this change adds the panel.
- `suggestion` `CoffeeCard.tsx:35`: "The live message can claim an addition that did not happen at the cap. The counter now stays at its value, so the visitor can click again at 99 in the cart ... the message still says 'Added 5 × Latte to cart. 99 in the cart.' even though the cart added nothing."
- `suggestion` `scripts/observability.test.mjs:121`: "The second new test asserts the shape of the Java source, not behavior ... It would still pass if the counter were built but never incremented."
- `question` and `thought`: whether a second counter is needed next to `http_server_requests`, and that metric names are string literals in several places.
- Praise: the panel descriptions say which metric each reads. Verdict: "Blocking comments: 2 (both docs only; the code has no blocking defects). Request changes."

**What was done**

| Finding | Action |
| --- | --- |
| Stale docs (2 blocking) | Fixed in the documentation round (DEVELOPMENT.md, ARCHITECTURE.md, CAPSTONE.md) |
| The message at the cap | Fixed: the message says what really went in ("Added 1 × Latte ... 99 in the cart.") or "Latte is at the maximum of 99 in the cart."; two new tests |
| The shape-of-source test | Removed; the behavior is already covered by `CreateOrderRequestHandlerTest` and `OrderRetentionE2ETest` |
| A second counter | Kept on purpose (it survives route changes and names the business event); the reason is in the [ADR](../adrs/testing-and-observability-evidence.md) |
| Constants class for metric names | Not done: not needed yet; listed in the backlog |

---

## Example 3. `structure-auditor` after eight specs

**Request** (shortened)

> Audit the structure of the `orders` slice of apps/api and of apps/app/src/features/checkout. This is the state after specs 032 to 039 (idempotency, batching, address retention, quote endpoint, shared UI blocks). Report the ranked findings with evidence (file and line). Read-only.

**What came back** (summary of the report)

- "The orders slice is healthy. I found no layer violation, no cross-slice dependency, no `new` of an infrastructure class in a use case, and no `double`/`float` money. `OrderTotals` is the only place that computes totals."
- 12 findings, none High. The first three Medium: `OrderSummary` is a 104-line function that mixes data, state, a cart-mutating side effect and layout; the ZIP-code rule is written twice in the app (`api.ts:105` and `address-schema.ts:5`); order invariants (quantity 1 to 99, address format) live only in the `interfaces` validator, so a second entry point would rely on the database check alone.
- Low findings, for example: the request handler owns a business metric while the job counts in `infrastructure`, so "the docs do not say where business metrics live"; `Order` types live in `checkout/api.ts` and `features/orders` imports them; `CreateOrderUseCase` also builds the request fingerprint; small duplicates (`EstimatedDeliveryMinutes` twice, the `Idempotency-Key` literal three times); dead code only tests use; `ArchitectureTest` has a deny-list for the domain where the docs say "depends on nothing".
- "What is already good": the layers are clean, totals are computed in one place, the app has no pricing code, the idempotency keys are a pure unit.

**What was done**

- Fixed at once, because they were small and safe: the duplicated ZIP rule (`api.ts` now imports `ZIP_CODE_PATTERN`; the build chunk grew by 0.5 kB).
- Written as decisions in [DECISIONS.md](DECISIONS.md) section 7 and in the [ADR](../adrs/testing-and-observability-evidence.md) as the backlog, because each needs a spec: the `OrderSummary` hook, the domain invariants, the metrics port, the `Order` types, the domain allow-list rule. The agent also said which need a spec ("This changes where errors are raised, so write a spec") and which do not.

---

## Example 4. `bug-investigator` on a failure that did not repeat

**Request** (shortened)

> Bug report. On 2026-11-10 at about 11:55, one full `yarn test:e2e` run had 9 Playwright failures: accessibility.spec.ts (6 tests), cart-add.spec.ts (2 tests) and checkout-submit.spec.ts (1 test). The errors were `toHaveCount(expected) failed` (expected 14 articles) and `toBeVisible() failed`. Two reruns right after passed all 195 tests, and nothing was changed in between. Find the most likely root cause with evidence ... say what you can and cannot prove, and propose the smallest fix and a test. Do not change code.

**What came back** (shortened)

- **Root cause (most likely): a start-up race against the default 5 s expectation**, "not a data, backup or Docker-state problem". The readiness probes only check that a port answers; the Vite dev server has transformed nothing and the JVM has not run its first requests; the first batch of tests all load a page at the same moment.
- **Evidence**: `playwright test --list` shows that the 8 failures in the accessibility and cart-add files are exactly the first 8 tests of the run, with 8 workers on a 16-thread machine; and "Test 3 rules out the API and the database": "Checkout with an empty cart" failed, and it sends no API request.
- **Confidence: Medium**, with what it could not prove: no trace or report of that run survives, the Grafana container has no data volume ("Prometheus range queries over 2026-11-09 to 11-13 ... returned no data"), and the checkout-submit failure "is the same cause, but I cannot prove it".
- **Ruled out, with evidence**: the backup and restore (the scripts only write to `restore_check`), the Gradle end-to-end tests (own Testcontainers database), the nginx rate limit (not in the path of port 5173), a stale server, and the working-tree edits (later timestamps).
- **Proposed fix and test (TDD)**: warm the stack before the first test (`server.warmup.clientFiles` in Vite; read-only requests in the global setup), test both as data, and do not raise the expectation timeout.

**What was done**: exactly that. `vite.config.ts` warms `main.tsx` and the two lazy pages; `e2e/global-setup.ts` makes read-only requests to the pages and to the read endpoints of the API (no `POST`); `scripts/e2e-warmup.test.mjs` (4 tests) pins both and pins that the expectation timeout is not raised. The suite was run again and passed (199 tests). The agent's open questions (what else ran at 11:55, which assertion failed in the checkout test) stay open and are written in the ADR: the evidence was gone, and the report says so instead of claiming a certainty.

---

## Example 5. `docs-keeper` after the follow-up specs

**Request** (shortened)

> Fix mode. Specs 032 to 039 were implemented today in this repository. Bring the documentation back in line with the code: .docs, README, docs/CAPSTONE.md (its "known limits" and numbers), .env.example, the agents and skills lists, links, and counts. Edit documentation files only; do not change code, specs, plans, or ADRs except to fix a broken link.

**What came back** (shortened)

- It changed nine documents: ports and layout in ARCHITECTURE.md, the pages and new components in DESIGN_SYSTEM.md, the environment variables in DEVELOPMENT.md, the commands in QA.md, a packaging row in the README, and a table of specs 032 to 039 and a rewritten "known limits" in CAPSTONE.md.
- It re-measured numbers itself (170 and 113 API tests from the result files, 688 Vitest tests and 160 script tests run on the spot, JaCoCo 611 of 617 lines) and said which numbers it did not re-measure: "Playwright: 198 passed, from your count. Lighthouse ... from the ADR."
- It found things it could not fix: "`.docs/DEVELOPMENT.md` (Observability): the rule says a new database call must show up in the dashboard. The metric `orders.addresses.cleared` of the retention job has no Grafana panel ... Decide whether to add a panel or relax the rule."

**What was done**: the panel was added (panel 10 of the dashboard) in the observability round, which is how the teacher's feedback on observability became a concrete improvement; see [OBSERVABILITY.md](OBSERVABILITY.md).

---

## Example 6. The health check that wrote the next eight specs

After the 31 specs of the capstone, `/health-check` launched `structure-auditor`, `performance-analyst`, and `evolution-advisor` in parallel and then `docs-keeper` in check mode. They found no critical problem and proposed the next steps, which became specs 032 to 039 ([record](../adrs/project-docs-and-handoff.md)). Examples of how a finding became work:

| Finding (the review that raised it, as the spec cites it) | Became |
| --- | --- |
| Orders have no idempotency: a lost answer makes a second order (health check, evolution) | Spec 032 |
| One JavaScript chunk of 522 kB and 1.82 MB of PNG photos (health check, performance) | Spec 033 |
| `save` inserts the lines in a loop; the catalog read uses two connections (health check, performance) | Spec 034 |
| The loading and error blocks are written four times (`structure-auditor`) | Spec 035 |
| `ArchitectureTest` guards fewer rules than the documents state (`structure-auditor`) | Spec 036 |
| Nothing has a Dockerfile; no backup (evolution review of 2026-11-08) | Spec 037 |

All eight were then implemented with the `implement-me` skill (concept, plan in `plans/`, tests first, six commands, a decision record in `adrs/`, one commit), and the agents were run again on the result (examples 2 to 5).

## What the agents are not

They do not decide: a reviewer's "request changes" is a recommendation, and in example 2 two comments were kept as they were and said so. They do not replace the tests: every claim that mattered (the root cause, the dashboard, the rules) ended as a test or a measurement. And they can be wrong or silent: example 4 shows an agent stopping at "Medium confidence" instead of inventing a cause.
