# Coffee Delivery: capstone report

The capstone of the Applied AI postgraduate module (Coders University). The numbers in section 4 come from commands run on the code of the day named next to each: 2026-11-08 for the 31 specs of the capstone and 2026-11-10 after the eight follow-up specs (032 to 039). A number with no date was not measured again.

## 1. Goal

Rebuild Coffee Delivery, a small coffee store, from its Figma design with a React app, a Java Spring Boot API, and a PostgreSQL database, using AI as the builder and a spec-driven process as the guard rail. The product is the vehicle; the question of the work is how far a complete, tested, observable product can be built with AI when every step is specified first, planned, tested, checked, and recorded.

The product: a visitor browses 14 coffees, filters them by tag, builds a cart (kept in the browser), enters a delivery address, chooses a payment method for the delivery, and confirms. The server prices the order, stores it, and the app shows the confirmation. There are no accounts, no payment data, and no tracking ([`.docs/BUSINESS.md`](../.docs/BUSINESS.md)).

## 2. The process

The process is the one of the "mold", the Module 4 repository, adapted to Java and React ([`docs/PLAN.md`](PLAN.md), section 1; the rules are in [`.docs/`](../.docs/AGENTS.md)).

1. **Specs first.** The work was broken into 31 small specs, one action each, in [`.specs/`](../.specs), all from one template (scope, context, business needs, acceptance criteria, what to do, what not to do, result, open questions) and refined before any code.
2. **The cycle of one spec** (the `implement-me` skill):
   1. Read the spec and the documents it points to.
   2. Clarify with the `feature-concept` skill: an interview when a decision is open. These specs had no open question, so the cycles of the app specs had no interview and went straight to the plan.
   3. **Plan** in `plans/NNN-<spec>-plan.md` (decisions, tasks, dependencies, risks).
   4. **Tests first** (TDD), then the code.
   5. **QA**: six commands from the root (`code:fix`, `lint`, `types:check`, `test`, `test:e2e`, `build`) must pass.
   6. **ADR** in `adrs/<name>.md` and the end-of-task report (ADR summary, manual QA steps, modified files, installed libraries, rationale).
   7. One Conventional Commit per spec, pushed to `main` (`commit-and-push`).
3. **Skills and agents.** Skills in `.agents/skills` (17) drive the cycle and the engineering practice (`tdd`, `vitest`, `playwright`, `frontend-design`, `web-design-guidelines`, `vercel-react-best-practices`). Six agents in `.claude/agents` review, audit, and keep the docs true: five only read and report, and `docs-keeper` edits documentation files only (it ran for the last spec).
4. **Evidence.** [`.specs/`](../.specs), [`plans/`](../plans), [`adrs/`](../adrs), the commit history, and the reports of each spec. The commit of each spec names it (`(spec 021)`); the commits that are not a spec, such as the first setup commits and the fix of the Node version of the pipeline, do not.

## 3. The 31 specs

| Spec | Title | Plan | Decision record |
| --- | --- | --- | --- |
| 001 | [Foundation: repository skeleton and workflow](../.specs/001-foundation.md) | [plan](../plans/001-foundation-plan.md) | [ADR](../adrs/foundation.md) |
| 002 | [Local infrastructure: Postgres and Grafana](../.specs/002-local-infrastructure.md) | [plan](../plans/002-local-infrastructure-plan.md) | [ADR](../adrs/local-infrastructure.md) |
| 003 | [API: foundation](../.specs/003-api-foundation.md) | [plan](../plans/003-api-foundation-plan.md) | [ADR](../adrs/api-foundation.md) |
| 004 | [Catalog: data model and seed](../.specs/004-catalog-data-model.md) | [plan](../plans/004-catalog-data-model-plan.md) | [ADR](../adrs/catalog-data-model.md) |
| 005 | [Catalog: list coffees](../.specs/005-catalog-list-coffees.md) | [plan](../plans/005-catalog-list-coffees-plan.md) | [ADR](../adrs/catalog-list-coffees.md) |
| 006 | [Catalog: filter coffees by tags](../.specs/006-catalog-filter-by-tags.md) | [plan](../plans/006-catalog-filter-by-tags-plan.md) | [ADR](../adrs/catalog-filter-by-tags.md) |
| 007 | [Checkout: read the configuration](../.specs/007-checkout-config.md) | [plan](../plans/007-checkout-config-plan.md) | [ADR](../adrs/checkout-config.md) |
| 008 | [API: dashboard and load profiles](../.specs/008-api-observability-and-load-tests.md) | [plan](../plans/008-api-observability-and-load-tests-plan.md) | [ADR](../adrs/api-observability-and-load-tests.md) |
| 009 | [Orders: data model](../.specs/009-orders-data-model.md) | [plan](../plans/009-orders-data-model-plan.md) | [ADR](../adrs/orders-data-model.md) |
| 010 | [Orders: create an order](../.specs/010-orders-create.md) | [plan](../plans/010-orders-create-plan.md) | [ADR](../adrs/orders-create.md) |
| 011 | [Orders: get an order](../.specs/011-orders-get.md) | [plan](../plans/011-orders-get-plan.md) | [ADR](../adrs/orders-get.md) |
| 012 | [App: foundation](../.specs/012-app-foundation.md) | [plan](../plans/012-app-foundation-plan.md) | [ADR](../adrs/app-foundation.md) |
| 013 | [App: design tokens, fonts, and money format](../.specs/013-app-design-tokens.md) | [plan](../plans/013-app-design-tokens-plan.md) | [ADR](../adrs/app-design-tokens.md) |
| 014 | [App: assets extracted from the Figma file](../.specs/014-app-assets-from-figma.md) | [plan](../plans/014-app-assets-from-figma-plan.md) | [ADR](../adrs/app-assets-from-figma.md) |
| 015 | [App: base components](../.specs/015-app-base-components.md) | [plan](../plans/015-app-base-components-plan.md) | [ADR](../adrs/app-base-components.md) |
| 016 | [App: navbar and page layout](../.specs/016-app-navbar.md) | [plan](../plans/016-app-navbar-plan.md) | [ADR](../adrs/app-navbar.md) |
| 017 | [Home: hero section](../.specs/017-home-hero.md) | [plan](../plans/017-home-hero-plan.md) | [ADR](../adrs/home-hero.md) |
| 018 | [Home: coffee list](../.specs/018-home-coffee-list.md) | [plan](../plans/018-home-coffee-list-plan.md) | [ADR](../adrs/home-coffee-list.md) |
| 019 | [Home: coffee filters](../.specs/019-home-coffee-filters.md) | [plan](../plans/019-home-coffee-filters-plan.md) | [ADR](../adrs/home-coffee-filters.md) |
| 020 | [Cart: state and persistence](../.specs/020-cart-state.md) | [plan](../plans/020-cart-state-plan.md) | [ADR](../adrs/cart-state.md) |
| 021 | [Cart: add a coffee from its card](../.specs/021-cart-add-from-card.md) | [plan](../plans/021-cart-add-from-card-plan.md) | [ADR](../adrs/cart-add-from-card.md) |
| 022 | [Checkout: order summary](../.specs/022-checkout-summary.md) | [plan](../plans/022-checkout-summary-plan.md) | [ADR](../adrs/checkout-summary.md) |
| 023 | [Checkout: address form](../.specs/023-checkout-address-form.md) | [plan](../plans/023-checkout-address-form-plan.md) | [ADR](../adrs/checkout-address-form.md) |
| 024 | [Checkout: payment method](../.specs/024-checkout-payment-select.md) | [plan](../plans/024-checkout-payment-select-plan.md) | [ADR](../adrs/checkout-payment-select.md) |
| 025 | [Checkout: submit the order](../.specs/025-checkout-submit-order.md) | [plan](../plans/025-checkout-submit-order-plan.md) | [ADR](../adrs/checkout-submit-order.md) |
| 026 | [Order: confirmation page](../.specs/026-order-success-page.md) | [plan](../plans/026-order-success-page-plan.md) | [ADR](../adrs/order-success-page.md) |
| 027 | [App: responsive layouts](../.specs/027-app-responsive.md) | [plan](../plans/027-app-responsive-plan.md) | [ADR](../adrs/app-responsive.md) |
| 028 | [App: end-to-end happy path](../.specs/028-app-e2e-happy-path.md) | [plan](../plans/028-app-e2e-happy-path-plan.md) | [ADR](../adrs/app-e2e-happy-path.md) |
| 029 | [App: visual parity with the design](../.specs/029-app-visual-parity.md) | [plan](../plans/029-app-visual-parity-plan.md) | [ADR](../adrs/app-visual-parity.md) |
| 030 | [CI: GitHub Actions pipeline](../.specs/030-ci-pipeline.md) | [plan](../plans/030-ci-pipeline-plan.md) | [ADR](../adrs/ci-pipeline.md) |
| 031 | [Project: documentation and capstone handoff](../.specs/031-project-docs-and-handoff.md) | [plan](../plans/031-project-docs-and-handoff-plan.md) | [ADR](../adrs/project-docs-and-handoff.md) |

### The 8 follow-up specs

The health check of 2026-11-08 (structure, performance, evolution, and documentation) found no critical problem and proposed eight more specs ([`docs/PLAN.md`](PLAN.md), "Follow-up specs"). They are not part of the 31 that the capstone delivered. All eight were built on 2026-11-10, each with its plan and its decision record.

| Spec | Title | Plan | Decision record |
| --- | --- | --- | --- |
| 032 | [Orders: idempotent order creation](../.specs/032-orders-idempotent-create.md) | [plan](../plans/032-orders-idempotent-create-plan.md) | [ADR](../adrs/orders-idempotent-create.md) |
| 033 | [App: lighter first load](../.specs/033-app-lighter-first-load.md) | [plan](../plans/033-app-lighter-first-load-plan.md) | [ADR](../adrs/app-lighter-first-load.md) |
| 034 | [API: batch the order lines and read the catalog in one transaction](../.specs/034-api-batch-and-read-transactions.md) | [plan](../plans/034-api-batch-and-read-transactions-plan.md) | [ADR](../adrs/api-batch-and-read-transactions.md) |
| 035 | [App: shared UI blocks, one quantity limit, and shared e2e helpers](../.specs/035-app-shared-ui-blocks.md) | [plan](../plans/035-app-shared-ui-blocks-plan.md) | [ADR](../adrs/app-shared-ui-blocks.md) |
| 036 | [Architecture: guard the stated rules and make the pages compose](../.specs/036-architecture-rules-and-page-composition.md) | [plan](../plans/036-architecture-rules-and-page-composition-plan.md) | [ADR](../adrs/architecture-rules-and-page-composition.md) |
| 037 | [Packaging: container images and a tested database backup](../.specs/037-packaging-and-backup.md) | [plan](../plans/037-packaging-and-backup-plan.md) | [ADR](../adrs/packaging-and-backup.md) |
| 038 | [Orders: address retention and a rate limit](../.specs/038-orders-address-retention-and-rate-limit.md) | [plan](../plans/038-orders-address-retention-and-rate-limit-plan.md) | [ADR](../adrs/orders-address-retention-and-rate-limit.md) |
| 039 | [Orders: quote the fee and the total from the server](../.specs/039-orders-quote-endpoint.md) | [plan](../plans/039-orders-quote-endpoint-plan.md) | [ADR](../adrs/orders-quote-endpoint.md) |

The roadmap, its milestones, and the result of each spec are in [`docs/PLAN.md`](PLAN.md).

## 4. Final numbers

| Measure | Result | Command |
| --- | --- | --- |
| API unit tests | 170 passed, 0 failed (2026-11-10; 108 on 2026-11-08) | `./gradlew test` |
| API end-to-end tests (Testcontainers) | 113 passed, 0 failed (2026-11-10; 82 on 2026-11-08) | `./gradlew e2eTest` |
| API coverage (JaCoCo) | 611 of 617 lines (99%), 2,808 of 2,833 instructions (99%), branches 129 of 137 (94%); the gate is 80% of lines (2026-11-10, from the execution data of that day's test runs; 2026-11-08: 460 of 463 lines, branches 92%) | `./gradlew jacocoTestReport` |
| App unit and component tests | 688 passed in 54 files (2026-11-10; 638 in 47 files on 2026-11-08) | `yarn --cwd apps/app test` |
| Root script tests | 160 passed (2026-11-10; 129 on 2026-11-08) | `node --test scripts/*.test.mjs` |
| App end-to-end tests (real API and database, no mock of the stack) | 198 passed (2026-11-10; 185 on 2026-11-08) | `yarn test:e2e` |
| Lighthouse, Home, desktop | 2026-11-10, after spec 033, three runs: performance 100, accessibility 96 (the limits are 95 and 95 now); 2026-11-08: 91 and 96 (limits 90 and 95). Not run again after spec 039 | `yarn lighthouse` |
| Visual difference against the Figma frames at 1440 px (unmasked pixels, limit 2%) | 2026-11-08: Home 0.42%, Checkout 0.07%, Checkout Filled 0.41%, Success 0.27%. 2026-11-10, after spec 033: Home 0.60%; the test still passes (limit 2%, same masks) | `visual-parity.spec.ts` |
| Bundle (2026-11-10) | Entry chunk 237.62 kB (74.33 kB gzip); the React chunk that Home also loads 145.41 kB (47.83 kB gzip), so about 383 kB of JavaScript on Home; checkout chunk 137.70 kB (42.71 kB gzip) and order chunk 3.31 kB, both lazy; CSS 29.38 kB (6.42 kB gzip). On 2026-11-08 it was one JS chunk of 522.68 kB (161.26 kB gzip) and CSS 29.34 kB (6.40 kB gzip) | `yarn build` |
| Images (2026-11-10, spec 033) | The 14 photos 136.8 kB in all (WebP, was 1.82 MB), the hero 87.7 kB (was 516 kB); Home transferred until the 14 cards show: 512 kB (limit 600 kB) | `yarn test:e2e` (`first-load.spec.ts`) |
| Pipeline | `yarn ci` passes: 11 commands in the three jobs (2026-11-08; the commands have not changed) | `yarn ci` |
| Size (2026-11-10) | 155 Java files, 115 TypeScript files in `apps/app/src`, 18 browser test files, 44 commits since the rebuild began on 2026-11-04 (2026-11-08: 103, 102, 17, and 34) | `git ls-files`, `git log` |

The exit criteria of the milestones, with their measured results of 2026-11-08, are in [`docs/PLAN.md`](PLAN.md), section 3; the results of the follow-up specs are in its section 6.

## 5. Who decided what

**The person (the owner) decided:**

- The goal, the Figma design, the stack (React and Spring Boot), and the process (the mold).
- Everything in English and in US dollars; the delivery fee fixed at `$3.50`; the ZIP code format of the design (`00000-000`); the five tag filters even though the Figma hides them; a cart kept in `localStorage`.
- The palette stays as designed although seven pairs are below WCAG AA (spec 015); the filled input border, the 91 px "Remove" button, and the unoptimized images were left as the design and the first specs had them (spec 033 optimized the images later).
- The tablet and mobile rules (spec 027 proposed them, the owner approved them and let the AI choose the pixel sizes).
- To commit and push without asking at the end of each spec, to work only on `main`, and to let the AI run several specs in a row until one needed approval.
- What to do when the AI was blocked by the machine: stop a dev server, free a port, and not let a process the AI could not stop run.

**The AI decided**, inside those limits and each time recorded in an ADR: the structure of the code (slices, layers, components), the state of the cart (a pure reducer, a safe storage), the form and its error mapping, the tests and what each one proves, the masks of the visual comparison and the fixes it found, the pipeline and its pins, and the wording of the documentation. Where a spec had a choice (for example, the counter going back to 1 after adding, or where the alert goes), the AI chose, said so, and the ADR kept the reason.

## 6. Deviations from the mold, and why

| Deviation | Reason |
| --- | --- |
| Spring Boot (Java 21) instead of Nest.js; Next.js `web` and `docs` apps, authentication, email, Supabase, Weaviate, and LLM features left out | The product is a store with no accounts and no AI feature; the AI is the way it is built |
| Yarn 1 and Node 22 or newer instead of Node 24 | The machine and the dependencies; `packageManager` pins Yarn 1.22.22 |
| Root Yarn scripts that wrap Gradle and the app, no Turborepo | One API and one app need no build graph |
| Screenshots with a Playwright script, not the Playwright MCP | The MCP was not loaded in most of the sessions; the script writes the same files at the same sizes |
| The Playwright run reuses a running server (spec 028) after spec 012 forbade it | Spec 028 asked for reuse; `e2e/global-setup.ts` checks that a reused server is the right one |
| The accessibility scan allows six contrast pairs of the design | The owner kept the palette; a new low-contrast pair fails the scan |
| Engines stay at Node 22.12 while CI uses 22.22.2 | Raising them made every `yarn` command refuse to run on the owner's Node 22.22.0 |

## 7. Known limits

As of 2026-11-10, after the follow-up specs.

- **Contrast.** Eight pairs of the palette (six of text and two of borders) are below WCAG AA (documented in [`DESIGN_SYSTEM.md`](../.docs/DESIGN_SYSTEM.md)); Lighthouse accessibility is 96 because of that audit.
- **Images and bundle.** Fixed by spec 033: the photos and the hero are WebP (224.5 kB together, was 2.3 MB) and the checkout and order pages are lazy routes. Home still loads about 383 kB of JavaScript (the entry chunk and the React chunk), and the first visit to `/checkout` waits for a 138 kB chunk.
- **Cart.** Kept in `localStorage`: not shared between tabs or devices, and a coffee that leaves the catalog is dropped when the checkout loads.
- **Orders.** There are no order tracking, no editing, no cancellation, no accounts, and no payment processing. The end-to-end tests create real orders in the local database and do not delete them. An order keeps its items and totals for good, but its address is cleared after 90 days (spec 038): an old order shows "The address was removed after 90 days." and the address cannot be recovered from the order.
- **Idempotency.** Fixed by spec 032: an order sent with the same `Idempotency-Key` and the same content is created once, also for requests in parallel and for more than one API instance. The key is optional (an order sent without one is always created), keys are kept with the order with no expiry, and only `POST /api/v1/orders` uses it.
- **Fee and estimate.** Fixed rules (350 cents, 20 to 30 minutes). The quote endpoint (spec 039) takes a ZIP code so a fee by zone needs no change in the app, but today the fee is the same for every ZIP code.
- **Rate limit.** Only the proxy of the app image limits orders (10 a minute for each client address, with a burst of 5, spec 038). The API has no limit of its own, and neither has the Vite dev server, so a client that calls the API directly is not limited. The limit is by client address, so people behind one address share it.
- **Packaging and backup.** The two images and `compose.packaged.yaml` are for a local check only: no host, no registry, no deployment, and the images are not built by the QA commands or the pipeline. `yarn db:restore` restores into `restore_check` and never into the live database; recovering the live database is a manual step ([`RUNBOOK.md`](RUNBOOK.md)). The scheduled job that clears addresses has a metric (`orders.addresses.cleared`) but no Grafana panel.
- **Observability.** Logs stay on standard output (not in Loki) and traces have one span per request (no JDBC spans); there are no alert rules, and the Grafana container has no data volume, so telemetry can disappear on `infra:down`. The dashboard has ten panels, including the business counters `orders.created` and `orders.addresses.cleared` ([OBSERVABILITY.md](OBSERVABILITY.md)).
- **Visual parity** depends on the font rendering of Chromium on the machine; the filled input border and the filter chips differ from the frames by decision.
- **The pipeline.** The first run of the workflow failed (Node 22.22.1 was not enough for `jsdom`) and the run after the fix passed in all three jobs; the commit message workflow has not run yet, because it runs on pull requests only. `actionlint` was not run: the permission to run the downloaded binary was refused. The runs on GitHub after the commits of 2026-11-10 were not looked at for this report.

## 8. Evidence for review

After the first review of this report (8.2 out of 10), the evidence behind it was written down in four documents, each built on a run of the system: [OBSERVABILITY.md](OBSERVABILITY.md) (signals, panels, a screenshot of the dashboard under load, a log line and its trace), [TESTING.md](TESTING.md) (1,343 tests measured on 2026-11-13, coverage, the defects the tests found, the traceability from spec to test), [DECISIONS.md](DECISIONS.md) (the reasoning behind the architecture), and [AGENTS-IN-ACTION.md](AGENTS-IN-ACTION.md) (real runs of the agents). [FEEDBACK-RESPONSE.md](FEEDBACK-RESPONSE.md) answers each point of the review.

## 9. Lessons learned

- **Small specs keep the AI honest.** One action per spec, with measurable criteria, made every result checkable: a number, a box, a test. The few times a criterion was a feeling, the work needed a second pass.
- **Write the check before the fix, and read what it says.** The pixel comparison of spec 029 found six real deviations in screens that had passed every earlier test, because those tests measured the boxes and the text, not the whole picture. The responsive check found a 22 px link target that had been wrong since the empty cart page was built.
- **Tests of the process matter as much as tests of the code.** A test now pins that the workflow and `yarn ci` run the same commands, that every action is pinned, and that the Playwright config checks the servers it reuses. A rule that only lives in a document drifts.
- **Say what was not done.** Several times the honest report was "written before the code, not run red as a separate step", "not run: the machine refused", or "found because the log needs a login". Those lines cost little and made the reports trustworthy.
- **The machine is part of the product.** Node versions, ports, a process the AI could not stop, and Windows paths in scripts each cost an hour. The fixes were small and went into the scripts and the docs, not into the head of the person.
- **Decisions the AI makes still belong to the person.** The palette, the engines, and the filled input border were left for the owner on purpose, with the evidence next to them.
