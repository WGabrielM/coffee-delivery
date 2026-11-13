# Response to the review of the capstone

Review received: 8.2 out of 10, approved. The reviewer asked, before the final delivery, for: more detail on how **observability** was integrated, more evidence of the **automated tests**, more reasoning behind the **architectural decisions**, and **examples of interaction** with the specialist agents. Each point has a document, and each document is built on something that was measured or run in this round, not only described. Date of this round: 2026-11-13.

## Point by point

| Review point | What was missing | What changed | Where to read it |
| --- | --- | --- | --- |
| Documentation could be deeper, especially on **observability** | The dashboard and the logs existed but were described in a few lines of an ADR and one paragraph of DEVELOPMENT.md; business events were invisible | A full document: the three signals and what each answers, every metric with its source, the ten panels with the question each answers, how the code and the dashboard are kept in step (which test fails on which drift), a worked investigation, and an honest list of limits. **Three new business panels and two business counters** (orders created by outcome, client errors by status, addresses cleared). **Live evidence:** a screenshot of the ten panels under a mixed load, a real log line, and the same request found as a trace in Tempo through its `traceId` | [docs/OBSERVABILITY.md](OBSERVABILITY.md), [evidence/grafana-dashboard.png](evidence/grafana-dashboard.png) |
| **Automated tests** should be more evident | The tests were many (and gated in CI) but spread over ADRs and QA.md; no single place showed the whole | A testing document: the numbers per layer measured on a dated run (**1,343 automated tests**, API coverage **99% of lines and 94% of branches**), what each kind proves with named examples, the rules that are tests, **eight real defects the tests found**, a spec-to-test traceability table, and how to reproduce every number. The run log is saved. A weakness found while preparing it (a start-up race in the end-to-end run) was fixed with tests | [docs/TESTING.md](TESTING.md), [evidence/test-run-2026-11-13.txt](evidence/test-run-2026-11-13.txt), [ADR](../adrs/testing-and-observability-evidence.md) |
| Expand the **architectural decisions** and their reasoning | 40 ADRs record what was decided, but the reasoning was spread over files and no page showed the whole | One map of the decisions by theme (system shape, data and money, reliability, observability and operation, the app, the way of working with AI): for each, **why**, the cost or trade-off, what was left out on purpose, and the record. Reversed decisions are marked (the card counter, the rule on use cases after the first job). The open decisions that the audits produced are listed | [docs/DECISIONS.md](DECISIONS.md) |
| **Agents**: include examples of interaction | The agents were defined and listed, but no real run was shown | Six real examples with the exact request, what came back (quoted), and what was done with it: a feature request, a code review that found a defect the author missed, a structure audit, a bug investigation of a failure that did not repeat (which ended with an honest "medium confidence"), the documentation sync, and the health check that wrote the last eight specs. It also explains why the judging agents cannot edit | [docs/AGENTS-IN-ACTION.md](AGENTS-IN-ACTION.md) |

## A note on "authentication"

The review mentions an authentication flow. The product has **no accounts and no sign-in by design**: it is a store where the order is paid on delivery, and accounts are listed as out of scope in [BUSINESS.md](../.docs/BUSINESS.md). The flows delivered are the catalog, the cart, the checkout (address, payment, confirmation), and the order page. The consequences of having no accounts are handled explicitly: an order is a public resource with an unguessable id, so addresses are removed after 90 days and order creation is rate limited and idempotent ([DECISIONS.md](DECISIONS.md), sections 1 and 3).

## What else the round improved (found by running the system and the agents)

- Two business counters and three panels, so observability covers what the product does and not only HTTP.
- A fix for a flaky start of the end-to-end run, found by the `bug-investigator` agent and proved by tests.
- A defect in the spoken message of the card at the cart limit, found by the `code-reviewer` agent.
- The card of a coffee now keeps its quantity after "Add to cart" and shows how many are in the cart (the owner's request of 2026-11-11).
- The Grafana container of the machine had been created from an old copy of the repository, so it showed an old dashboard; it was recreated from the real one.

## What was not done, and why

- Logs are not shipped to Loki and traces have no database spans: each needs a dependency and a decision, and is listed as a limit.
- Lighthouse and the visual comparison were not repeated after the last specs.
- The structural backlog from the audit (a hook for the order summary, the order rules in the domain, a metrics port) needs a spec each; they are written as decisions to take, not as changes made in a feedback round.

## Reading order for a reviewer

1. [README](../README.md) (what the product is and how to run it), then [CAPSTONE.md](CAPSTONE.md) (the process and the 39 specs).
2. [DECISIONS.md](DECISIONS.md), then the ADR of any row that interests you.
3. [OBSERVABILITY.md](OBSERVABILITY.md) and [TESTING.md](TESTING.md), with the files in [`evidence/`](evidence).
4. [AGENTS-IN-ACTION.md](AGENTS-IN-ACTION.md).
