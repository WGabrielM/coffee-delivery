# ADR: Documentation and capstone handoff

- Status: Accepted and verified
- Date: 2026-11-08
- Spec: [.specs/031-project-docs-and-handoff.md](../.specs/031-project-docs-and-handoff.md)
- Plan: [plans/031-project-docs-and-handoff-plan.md](../plans/031-project-docs-and-handoff-plan.md)

## Context

The product, the tests, the observability, and the pipeline exist. A reviewer must understand the product, run it in minutes, and see how it was built and what was decided, without asking anyone. The spec adds no feature: it syncs the documents with the code, rewrites the README, writes the capstone report, closes the roadmap, and proves the result.

## Decisions

1. **Sync before writing.** The `docs-keeper` agent ran in fix mode over the final repository and fixed nine files (`ARCHITECTURE.md`, `DEVELOPMENT.md`, `QA.md`, `DESIGN.md`, `DESIGN_SYSTEM.md`, `.env.example`, and two lines of `PLAN.md`). The README and the report were written after, from the repository as it is.
2. **Numbers from commands run on 2026-11-08**, not from earlier reports: the API tests and coverage (`./gradlew cleanTest cleanE2eTest test e2eTest jacocoTestReport`), the app and script tests, the browser tests, `yarn lighthouse`, and the visual comparison. They are in section 4 of `docs/CAPSTONE.md`; the Progress rows of `PLAN.md` keep the numbers measured when each spec was done.
3. **README for a stranger:** what the product is, the stack, prerequisites with versions, `yarn local:setup`, `yarn api:dev`, `yarn app:dev`, the ports, every command (including `yarn ci`, `yarn lighthouse`, and the load tests), the folder map, and links. It says plainly that Node 22.22.2 is needed by some development dependencies while the declared minimum stays 22.12, and what to do on an older 22.x.
4. **`docs/CAPSTONE.md`** has the goal, the process, the 31 specs in a table generated from the files (so every link exists), the final numbers with their commands, who decided what, the deviations from the mold with reasons, the known limits, and the lessons.
5. **`docs/PLAN.md`** now shows all seven milestones as delivered, with each exit criterion and its measured result in a table, and a Progress row for this spec.
6. **The health check is a gate and a source of next steps.** The three advisory agents and a second `docs-keeper` pass (check mode) found no critical finding. Their findings are not fixed here (the spec forbids refactors and features); they are recorded below as the next steps.
7. **No release, tag, deployment, or hosting.**

## Verification

- **Completeness by command:** a script over `.specs`, `plans`, and `adrs` found, for each of the 31 specs, a plan whose name ends with the spec's name and an ADR that links the spec; the only gap was this spec's own plan and ADR, now written.
- **Links:** a link checker over the README, `docs/CAPSTONE.md`, `docs/PLAN.md`, and `.docs/*.md` resolved 168 relative links and their anchors, with no broken link once this ADR exists.
- **No Portuguese UI text outside quoted design references:** a search over the docs, the app, the API, and the scripts finds Portuguese only in the Figma analysis (`docs/design/figma-analysis.md`), in the comments of `visual-masks.ts` that quote the design, in the quotes of specs 014 and 026, and in the sample address typed in tests. No command in the documents is missing from `package.json` (checked by the docs agent).
- **Fresh clone** (a clone of the committed state into an empty folder, following the README): `yarn install --frozen-lockfile --ignore-engines` (22 s; this machine has Node 22.22.0, so the flag the README gives for an older 22.x was needed), `yarn env:setup`, `yarn infra:up` (the containers of this machine were reused), the Playwright browser, then `yarn lint`, `yarn types:check`, `yarn test` (128 script tests, 638 Vitest, the API tests), `yarn build`, and `yarn test:e2e` (the API end-to-end tests, the coverage gate, and 185 Playwright tests) all passed. The script tests are 128 there against 129 here because one test of `extract-figma-assets` needs the `.fig`, which is not committed. The API of this machine, on port 3000 and running the same code, served the clone's tests; the start of the API by the runner was proved on a spare port in spec 028. The app of the clone was started by Playwright and showed the 14 coffees (the e2e tests assert them).
- **The pipeline on GitHub:** the first run failed at `yarn install` (Node 22.22.1 was not enough for `jsdom`); the run of commit `95fc996` passed in `API`, `App`, and `End to end`.
- **Health check:** `docs-keeper` (fix mode) fixed nine documents; `structure-auditor`, `performance-analyst`, and `evolution-advisor` found no critical finding (structure: 15 findings, none High; performance: image weight and one chunk; evolution: duplicate orders on retry); a second `docs-keeper` pass (check mode) found 4 stale documents and 1 gap, all fixed in this spec.
- The six QA commands pass (see the end-of-task report).

## Next steps the health check proposes (not done here)

1. **Idempotent order creation** (an `Idempotency-Key`, a unique column): a lost response on a network error invites a second click and a duplicate order. This is the first limit that will hurt a real customer.
2. **A lighter first load:** lazy routes for checkout and order, `loading="lazy"` and WebP at the displayed size for the photos; the Lighthouse performance of 91 has no room.
3. **Guard more architecture rules** (`application` and Spring, one handler per use case) and move the data and state out of `OrderPage` and `CheckoutPage` into features.
4. **Shared UI blocks** (`LoadingState`, `ErrorState`, `TextLink`), one definition of the 1 to 99 quantity limit, and shared end-to-end helpers.
5. **Batch the order lines** in one insert (`POST /orders` is the slowest route) and read the catalog in one transaction.

## Consequences

- The repository is ready to hand over; nothing was tagged or released.
- The owner decides what the product is after the capstone (deploy it or not); steps 1 and 3 of the evolution review depend on it.
- The report and the README must change when a command or a number changes; `/sync-docs` and `/health-check` check them.
- No new library.
