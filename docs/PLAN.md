# Coffee Delivery — Capstone plan (v2, follows the Module 4 mold)

Goal: rebuild Coffee Delivery from scratch (React + Java/Spring Boot) with AI, using the same spec-driven workflow as `codersuniversity-m4`, from the Figma design.
Inputs: `docs/design/figma-analysis.md` (validated tokens, components, screens, copy) and the Module 4 repository (the mold).
Language: everything in this repository (docs, specs, plans, ADRs, code, UI, API, commits) is en-US, as in the mold's `CONVENTIONS.md`.

## 1. What we take from the mold

| Mold element | In Coffee Delivery |
| --- | --- |
| `.docs/` hub: `AGENTS`, `RULES`, `BUSINESS`, `ARCHITECTURE`, `CONVENTIONS`, `DEVELOPMENT`, `DESIGN`, `DESIGN_SYSTEM`, `QA` | Same files. `DESIGN` and `DESIGN_SYSTEM` are fed by the Figma analysis |
| `.specs/NNN-name.md` from `_template.md` (Scope, Context, Business needs, Acceptance Criteria, What to do, What not to do, Result, Open questions) | Same template, one action per spec, global sequence number |
| `plans/NNN-<spec>-plan.md` before any code; `adrs/<name>.md` after | Same, with the same headers |
| Skills in `.agents/skills` (`feature-concept`, `create-specification`, `breakdown-specs`, `refine-spec`, `implement-me`, `implement-specs`, `commit-and-push`, `tdd`, `grill-me`, `handoff`, `playwright`, `frontend-design`, `web-design-guidelines`, `vercel-react-best-practices`, `vitest`, `skill-creator`, `find-skills`), linked into `.claude/skills` | Copied from the mold. Skills tied to Nest, Next.js, Supabase and shadcn are left out |
| `.claude/agents` and `.claude/commands` (`code-reviewer`, `docs-keeper`, `structure-auditor`, `performance-analyst`, `bug-investigator`, `evolution-advisor`, `/health-check`, `/sync-docs`...) | Copied and adapted to Java and React |
| Vertical slices by domain, layers `domain`, `application`, `infrastructure`, `interface`; one `<Action>UseCase.execute` per flow; one `<Action>RequestHandler.handle` per endpoint | Same architecture in Java: `catalog` and `orders` slices under `apps/api`. ArchUnit tests enforce the rules (the mold used `scripts/audit-slices.mjs`) |
| TDD, QA commands run from the root, end-of-task report (ADR summary, manual QA, modified files, installed libraries, rationale) | Same. Root scripts wrap Gradle and the app: `yarn code:fix`, `types:check`, `test`, `test:e2e`, `build` |
| Conventional Commits with commitlint and Lefthook; work only on `main`; `commit-and-push` after QA | Same (see open decision 1) |
| Observability from day one (OpenTelemetry to Grafana LGTM, dashboard as code), k6 scenario per endpoint | Same, with Micrometer/OpenTelemetry in Spring (see open decision 2) |
| Accessibility and responsiveness mandatory (desktop, tablet, mobile); screenshots with the Playwright MCP (`<page>_<viewport>_after.png`, 1440×900 and 390×844) | Same. The Figma only has desktop, so tablet and mobile are derived in a dedicated spec |
| `CONVENTIONS.md`: `/api/v1/*`, JSON `camelCase`, error shape `{ "error": { "code", "message", "fields" } }`, stable `snake_case` codes | Same |

Left out on purpose: Nest.js (the stack here is Spring Boot), Next.js `web` and `docs` apps, authentication and email, Supabase, Weaviate and every LLM feature (Coffee Delivery has no AI feature; the AI is the way it is built), shadcn (the design is custom).

## 2. Decisions

| Topic | Decision |
| --- | --- |
| Repository | The current one, from scratch. Previous code: local tag `legacy-before-rebuild` (commit `e09d1d7`, on GitHub) |
| Layout | `apps/api` (Spring Boot, Gradle) and `apps/app` (React + Vite + TypeScript), as in the mold. Root `package.json` only orchestrates scripts and Git hooks (no Turborepo, see open decision 3) |
| **Currency** | **US dollars.** Same numeric values as the Figma: coffees `$9.90`, delivery fee `$3.50`, sample total `$33.20`. Formatted with `Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })`. The price keeps the Figma pattern: small `$` (Roboto 14 Regular) next to the amount (Roboto 24 Bold). Proposal for the specs: money as integer cents in the database and the API, formatted only in the UI |
| Cart | Client side (React context + reducer, persisted in `localStorage`). The API only receives the order at checkout (`POST /api/v1/orders` with coffee ids, quantities, address and payment method). The server recalculates prices, subtotal, fee and total and ignores client prices. No server cart: there is no user to attach it to |
| Authentication | None. All endpoints are public (the mold's "private by default" rule does not apply) |
| Tag filters | In scope, although hidden in the Figma. Five chips (Traditional, Special, With milk, Alcoholic, Iced) at the right of the "Our coffees" title (where the hidden frame sits). Multi-select, AND logic, server side: `GET /api/v1/coffees?tags=special,iced`. Selected state is not designed; proposal: `#DBAC2C` fill with white text. Expected results with the 14 coffees: Traditional 9, Special 5, With milk 6, Alcoholic 2, Iced 2, Special + Alcoholic 2, Special + Iced 1 |
| API | `GET /api/v1/coffees`, `GET /api/v1/checkout-config` (fee `3.50`, currency `USD`, delivery estimate 20 to 30 minutes), `POST /api/v1/orders`, `GET /api/v1/orders/{id}`. Payment methods: `credit_card`, `debit_card`, `cash` |
| Database | PostgreSQL in Docker Compose, schema and seed by Flyway migrations (the mold used SQL files in `db/migrations`) |
| App | React, TypeScript, Vite, React Router, TanStack Query, React Hook Form + Zod, Vitest, Playwright, fonts Roboto and Baloo 2 self-hosted. Styling: see open decision 4 |
| Versions | Verified at scaffold time (Java 21 or newer LTS, current stable Spring Boot, current Node LTS); never assumed |

## 3. Roadmap: 31 specs in 7 milestones

Each spec follows the mold's cycle: `feature-concept` (no open questions) → plan in `plans/` → tests first → code → QA commands → ADR in `adrs/` → end-of-task report → `commit-and-push`. Every endpoint spec also adds its k6 scenario; every UI spec also adds its screenshots.

| # | Spec | Outcome |
| --- | --- | --- |
| **M0** | **Foundation** | |
| 001 | foundation | Repo skeleton: `.docs/` hub, skills, agents and commands from the mold, root scripts, commitlint + Lefthook, `.gitattributes` (LF), README |
| 002 | local-infrastructure | Docker Compose with Postgres and Grafana LGTM; `yarn infra:up`, `infra:down`, `env:setup`, `local:setup` |
| **M1** | **API: catalog** | |
| 003 | api-foundation | Spring Boot app, slice layout and ArchUnit rules, `/api/v1` base path, error format, `GET /api/v1`, structured logs and OpenTelemetry, Flyway |
| 004 | catalog-data-model | Migration and seed of the 14 coffees (English copy, USD prices, tags) |
| 005 | catalog-list-coffees | `GET /api/v1/coffees` |
| 006 | catalog-filter-by-tags | `?tags=` with AND logic; the 7 cases above are tests |
| 007 | checkout-config | `GET /api/v1/checkout-config` |
| 008 | api-observability-and-load-tests | Grafana dashboard as code, k6 profiles (smoke, load, stress, spike, soak) |
| **M2** | **API: orders** | |
| 009 | orders-data-model | Migrations for `orders` and `order_items` (price snapshot) |
| 010 | orders-create | `POST /api/v1/orders`: validation, server-side totals, `201` |
| 011 | orders-get | `GET /api/v1/orders/{id}` |
| **M3** | **App foundation and design system** | |
| 012 | app-foundation | Vite app, routes `/`, `/checkout`, `/orders/:id`, API client, Vitest and Playwright set up |
| 013 | app-design-tokens | Theme with the Figma tokens, fonts, USD formatter; `.docs/DESIGN.md` and `DESIGN_SYSTEM.md` |
| 014 | app-assets-from-figma | Logo, 13 icons, 14 coffee photos (mapped by hash), hero image and illustration extracted from the `.fig` |
| 015 | app-base-components | Button, Counter, Input, Select, Tag, cart badge, all accessible |
| 016 | app-navbar | Logo, location pill, cart button with badge |
| **M4** | **Home** | |
| 017 | home-hero | Hero with title, subtitle, four benefits and the cup image |
| 018 | home-coffee-list | "Our coffees" grid of 14 cards (4 columns) with loading, error and empty states |
| 019 | home-coffee-filters | Tag chips wired to the API filter |
| **M5** | **Cart and checkout** | |
| 020 | cart-state | Cart context, reducer and persistence |
| 021 | cart-add-from-card | Card counter and add button; badge shows the sum of quantities |
| 022 | checkout-summary | Selected coffees, quantity, remove, items total, `$3.50` delivery and total |
| 023 | checkout-address-form | Seven fields with validation (ZIP `00000-000`, 2-letter state) |
| 024 | checkout-payment-select | Credit card, debit card and cash |
| 025 | checkout-submit-order | `POST` order, clear the cart, go to the success page |
| 026 | order-success-page | Address, 20 to 30 min estimate and payment from `GET /orders/{id}` |
| **M6** | **Quality and delivery** | |
| 027 | app-responsive | Tablet and mobile adaptation (derived from the desktop design) |
| 028 | app-e2e-happy-path | Playwright flow: add 3 coffees, check out, see the confirmation |
| 029 | app-visual-parity | Desktop screenshots compared with the 4 Figma frames |
| 030 | ci-pipeline | GitHub Actions: API tests, lint, type check, app tests and build |
| 031 | project-docs-and-handoff | README, final docs sync and the capstone report |

Milestone exit criteria (measurable): M1 and M2 API line coverage 80% or more and all QA commands green; checkout total `1 × 9.90 + 2 × 9.90 + 3.50 = 33.20` verified by a test; client-sent prices are ignored (test); M4 and M5 visual difference against Figma 2% of pixels or less at 1440 px; M6 end-to-end flow passes, axe reports no critical violations, Lighthouse desktop on Home at 90 or more (performance) and 95 or more (accessibility).

## 4. How we work

1. The specs are written first (`breakdown-specs` plus `create-specification`) and reviewed by you before any code.
2. Specs run one at a time in order. `implement-specs` can run independent ranges in parallel (for example the API and the app foundation).
3. After each spec I print the mold's end-of-task report. You review; I commit when the rules say so.
4. The ADRs, plans and specs are the evidence of how AI was used and what was decided.

## 5. Decisions and open items

Decided on 2026-11-04:

1. **Commit policy:** adopt the mold. At the end of every spec, once the QA commands pass, `commit-and-push` commits (Conventional Commits) and pushes to `main` without asking. If QA fails and cannot be fixed, nothing is committed. If Git has no credentials on the machine, the commit is made and the user pushes.
2. **Observability:** full parity with the mold (structured logs, OpenTelemetry to Grafana LGTM, dashboard as code, one k6 scenario per endpoint).
3. **Monorepo tooling:** root Yarn scripts wrapping Gradle and the app; Lefthook and commitlint at the root; no Turborepo. Lint and format with `oxlint` and `oxfmt`, as in the mold (spec 001).
4. **Styling:** Tailwind CSS mapped to the Figma tokens; no shadcn.
5. **Heavy design files:** the `.fig`, the PDF, and `image-frames.png` stay on the developer's machine and are ignored by Git (spec 001). The analysis, the extracted assets, and the reference images are tracked.
6. **ZIP code:** the design format `00000-000` is kept (spec 010 and spec 023), although prices are in dollars.
7. **QA commands:** six, with `yarn lint` added to the five listed in section 1, as in the mold.

Open:

8. **Responsive design:** the Figma has only 1440 px; tablet and mobile layouts are proposed in spec 027 and need your approval.

## 6. Progress

| Spec | Status |
| --- | --- |
| 001 foundation | Done (2026-11-04) |
