# Project: documentation and capstone handoff

## Scope
@README.md - Complete rewrite for a new reader
@docs/CAPSTONE.md - New; the capstone report
@docs/PLAN.md - Mark the roadmap as delivered with the real numbers
@.docs - Sync every document with the final code
@adrs - Check that every spec has its ADR

## Context
Part of: Coffee Delivery capstone.
Depends on: @.specs/030-ci-pipeline.md
At this point the product, the tests, the observability, and the pipeline exist. The project is the capstone of the postgraduate module in Applied AI: it shows how a complete product is rebuilt with AI under a spec-driven process. The evidence is in `.specs/`, `plans/`, `adrs/`, the commit history, and the reports of each spec.

## Business needs
A reviewer understands the product, runs it in minutes, and sees how it was built and what was decided, without asking anyone.

## Acceptance Criteria
- The README states what Coffee Delivery is, shows the stack, lists prerequisites with versions, and gives the steps `yarn local:setup`, `yarn api:dev`, and `yarn app:dev`, the ports, the QA commands, the load and Lighthouse commands, the folder map, and links to `.docs/`, `docs/CAPSTONE.md`, and the specs.
- On a fresh clone in an empty folder, following only the README produces a running app on port 5173 with the 14 coffees, and `yarn lint`, `yarn types:check`, `yarn test`, `yarn test:e2e`, and `yarn build` pass; the end-of-task report lists the commands and their results.
- `docs/CAPSTONE.md` has: the goal, the process (the mold, the skills, the cycle of spec, plan, tests, code, QA, ADR, commit), a table of the 31 specs with links to their plan and ADR, the final metrics (API coverage, number of tests, Lighthouse scores, visual difference per screen), the decisions made by the human and the ones made by AI, the deviations from the mold with reasons, the known limits, and lessons learned.
- `docs/PLAN.md` shows every milestone as delivered, and each exit criterion with the measured result.
- Every `.specs/NNN-*.md` has a `plans/NNN-*-plan.md` and an `adrs/*.md`; a script or command in the report proves it, and the `/sync-docs` and `/health-check` commands report no drift and no critical finding.
- No document describes the mold's product, Portuguese UI text outside quoted design references, or a command that does not exist; links in the README and `docs/CAPSTONE.md` resolve (checked by a link checker or by hand, with the result in the report).

## What to do
- Run the `docs-keeper` agent and the sync command, fix every drift, then write the README and the capstone report from the real repository state and the ADRs.
- Take the metrics from commands you run now, not from earlier reports.

## What not to do
- Do not add features, refactors, or dependencies.
- Do not add deployment, hosting, or release automation.
- Do not tag or publish a release.
- Do not claim a result that a command in this run did not produce.

## Result
The repository is ready to be handed over: a README that gets a stranger to a running app, a capstone report with measured results, and documentation that matches the code.

## Open questions
None
