# Foundation: repository skeleton and workflow

## Scope
@package.json - New; private root package that only orchestrates scripts and Git hooks
@scripts/run-task.mjs - New; runs a root task in every workspace that exists and reports the ones skipped
@commitlint.config.mjs - New; Conventional Commits
@lefthook.yml - New; `commit-msg` runs commitlint
@.gitattributes - New; LF line endings for text files
@.gitignore - New
@AGENTS.md - New; entry point that points to `.docs/AGENTS.md`
@.docs - New; AGENTS, RULES, BUSINESS, ARCHITECTURE, CONVENTIONS, DEVELOPMENT, DESIGN, DESIGN_SYSTEM, QA
@.agents/skills - New; skills copied from the Module 4 mold
@.claude/skills - New; links to `.agents/skills`
@.claude/agents - New; reviewer and auditor agents adapted to Java and React
@.claude/commands - New; `/health-check`, `/sync-docs` and the other mold commands
@.specs/_template.md - New
@plans - New; empty folder kept with `.gitkeep`
@adrs - New; empty folder kept with `.gitkeep`
@README.md - New; short start page, completed in spec 031
@docs/design/figma-analysis.md - Stays tracked; the heavy design exports are ignored by Git

## Context
Part of: Coffee Delivery capstone (rebuild with React and Spring Boot, spec-driven, same mold as `codersuniversity-m4`).
The repository holds only `docs/PLAN.md` and `docs/design/` after the reset commit. The mold keeps its working rules in `.docs/`, its procedures in skills, agents and commands, and its quality gates as root Yarn scripts. The design exports in `docs/design/` (a `.fig` of 8 MB, a PDF of 4 MB, and `image-frames.png`) are untracked.

## Business needs
Every later spec can be written, planned, implemented, checked and committed with the same procedure and the same commands, from the first day.

## Acceptance Criteria
**Commands**
- `yarn install` succeeds from a clean clone; the root `package.json` is `private` and pins `packageManager` to a verified Yarn version.
- `yarn code:fix`, `yarn lint`, `yarn types:check`, `yarn test`, `yarn test:e2e`, and `yarn build` exit `0` on the bare skeleton; each prints which workspaces it ran and which it skipped because they do not exist yet.

**Commit rules**
- `echo "bad message" | yarn commitlint` exits non-zero and `echo "chore: add skeleton" | yarn commitlint` exits `0`.
- After `yarn install`, `git commit -m "bad message"` is rejected by the Lefthook `commit-msg` hook.

**Workflow files**
- `.claude/skills/<name>` resolves to `.agents/skills/<name>/SKILL.md` for the 17 skills listed in `docs/PLAN.md`.
- `.claude/agents` has `code-reviewer`, `docs-keeper`, `structure-auditor`, `performance-analyst`, `bug-investigator`, and `evolution-advisor`; `.claude/commands` has the mold's commands.
- `grep -ri -E "nest|next\.js|supabase|weaviate|langchain|shadcn|turborepo" .docs .agents .claude AGENTS.md` returns no match outside skills whose subject is generic (for example `skill-creator`), and every match left is justified in the end-of-task report.

**Docs**
- `.docs/AGENTS.md` maps the other eight documents; each one describes Coffee Delivery (domain, Spring Boot slices, React app, USD, en-US, spec-driven workflow) and none describes the mold's product.
- `docs/design/figma-analysis.md` is tracked; `git status` shows no `.fig`, `.pdf` or `image-frames.png` after the commit.

**Repository hygiene**
- `.gitattributes` forces `eol=lf` for text files; `.gitignore` covers `node_modules`, build outputs for Gradle and Vite, `.env.local`, IDE folders, and the three design exports in `docs/design/`.

## What to do
- Copy the skills, agents, commands and documentation structure from the mold (read-only), then rewrite the content for this project. Link `.claude/skills` the same way the mold does and confirm it works on Windows.
- Write `.docs/BUSINESS.md` from `docs/PLAN.md` and `docs/design/figma-analysis.md`: the product, the four screens, the fixed delivery fee, USD pricing, the 14 coffees, the five tags, and the rule that the server owns prices and totals.
- Write `.docs/ARCHITECTURE.md` (layout `apps/api` and `apps/app`, slices `catalog`, `orders`, `system`, layers `domain`, `application`, `infrastructure`, `interface`, one `UseCase.execute` and one `RequestHandler.handle` per flow), `.docs/CONVENTIONS.md` (en-US, `/api/v1/*`, camelCase JSON, error shape `{ "error": { "code", "message", "fields" } }`, stable `snake_case` codes, money as integer cents in fields suffixed `InCents`), `.docs/DEVELOPMENT.md`, `.docs/QA.md`, `.docs/RULES.md`, `.docs/DESIGN.md` and `.docs/DESIGN_SYSTEM.md` (facts known today; tokens are completed in spec 013).
- Write `scripts/run-task.mjs` so each root task calls the matching task of `apps/api` and `apps/app` when the folder exists. The root scripts are `code:fix`, `lint`, `types:check`, `test`, `test:e2e`, and `build`.
- Add commitlint with Conventional Commits and Lefthook with the `commit-msg` hook. Work only on `main`; never skip hooks.
- Decide and document in `.gitignore` that the `.fig`, the PDF and `image-frames.png` stay local, because Figma is the source and the extracted assets and reference images are committed by specs 014 and 029.

## What not to do
- Do not copy `.env.local`, `.mcp.json`, `node_modules`, or any file with credentials from the mold.
- Do not copy the mold's apps, packages, specs, plans, or ADRs.
- Do not add Turborepo, Nest.js, Next.js, Supabase, Weaviate, shadcn, or any LLM tooling.
- Do not create the Spring Boot or React projects; specs 003 and 012 do.
- Do not write the final README; spec 031 does.

## Result
The repository has the mold's documentation hub, skills, agents, commands, commit rules and QA script names, adapted to Coffee Delivery, and all QA commands run green on the empty skeleton.

## Open questions
None
