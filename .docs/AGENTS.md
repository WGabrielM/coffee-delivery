# Agents

Mandatory rules for any code agent working in this repository. Read this file first, then the documents listed in [Document map](#document-map).

## Rules

1. You MUST apply the skills `frontend-design` and `web-design-guidelines` whenever you create or change any UI.
2. You MUST apply the skill that matches the context of your work, if one is available. If none is available, follow the official documentation of that technology.

   | Context | Skill |
   | --- | --- |
   | React | `vercel-react-best-practices` |
   | Unit and component tests (Vitest) | `vitest` |
   | Browser automation and screenshots | `playwright` |
   | Test-driven development | `tdd` |
   | Java, Spring Boot, Flyway, PostgreSQL, Gradle | The official documentation of each (no skill) |

   Project skills (defined in `.agents/skills/`) cover the spec workflow. Use them instead of doing the same work ad hoc:

   | Skill | Use when |
   | --- | --- |
   | `create-specification` | You are given a prompt or idea and need a spec. Writes `.specs/<NNN>-<name>.md` from `.specs/_template.md`. |
   | `breakdown-specs` | A prompt covers many features. Splits it into small specs, one action each, and writes them with `create-specification`. |
   | `refine-spec` | A spec exists and must be completed, tightened, or checked against the template and `.docs/`. Edits in place. |
   | `feature-concept` | Requirements are vague or decisions are unstated. Interviews the user until nothing is left to guess. |
   | `implement-me` | A spec is ready to execute. Clarifies, plans, implements with TDD, runs QA, delivers the report, then runs `commit-and-push`. |
   | `implement-specs` | Several specs must be executed at once (`001-010`). Orchestrates one background subagent per spec, each running `implement-me` in its own git worktree, respecting spec dependencies. |
   | `commit-and-push` | Changes are pending and must be committed and pushed. Writes a Conventional Commits message, stages, commits, pushes. Runs at the end of every spec execution. |

   Other skills in `.agents/skills/` are general helpers: `grill-me` and `handoff` (conversation), `skill-creator` and `find-skills` (skills), `frontend-design`, `web-design-guidelines`, `vercel-react-best-practices`, `vitest`, `playwright`, and `tdd` (engineering).

   Project agents live in `.claude/agents/` and are committed. Project commands live in `.claude/commands/` and are committed. Each command runs one agent; use them at the stage of the software lifecycle where they help:

   | Stage | Command | Agent | What it does | Writes? |
   | --- | --- | --- | --- | --- |
   | Review | (ask for it) | `code-reviewer` | Reviews a diff, a branch, or a set of files and returns findings as Conventional Comments | No |
   | Plan | `/plan-evolution [topic]` | `evolution-advisor` | Finds what limits growth and proposes spec-sized next steps | No |
   | Design and refactor | `/audit-structure [path]` | `structure-auditor` | Finds broken layers, cross-slice dependencies, duplication, and dead code | No |
   | Build and operate | `/analyze-performance [path]` | `performance-analyst` | Finds slow paths and checks them against Grafana data | No |
   | Fix | `/investigate-bug <report>` | `bug-investigator` | Reproduces a bug, finds the root cause, proposes a failing test and a fix | No |
   | Maintain | `/sync-docs [check]` | `docs-keeper` | Brings `.docs/`, ADRs, `QA.md`, `.env.example`, and READMEs back in line with the code | Docs only |
   | Maintain | `/health-check` | the four above | Runs the first three in parallel, then `docs-keeper` in check mode, and prints one report | No |

   The agents report and propose; a person (or `implement-me`) makes the change. Run `/sync-docs` before `commit-and-push` when a change touches behavior, and `/investigate-bug` before editing code for a bug whose cause is not obvious. Claude Code reads agents and commands when a session starts: restart it, or run `/agents`, after adding one.

   Claude Code loads skills only from `.claude/skills/`. `yarn install` links every skill in `.agents/skills/` there (through the `prepare` script); run `yarn skills:link` to link again. `.claude/skills` is gitignored.

   Typical flow: `breakdown-specs` (for large prompts) → `create-specification` (or `refine-spec`) → `implement-me` → `commit-and-push` (run by `implement-me`). `implement-specs` runs `implement-me` for a whole range in parallel. `implement-me` always runs `feature-concept`; `create-specification` and `refine-spec` run it when gaps are large.

3. You MUST follow `RULES.md` for the process of every task (plan, deliverables) and `QA.md` before declaring any task done.
4. You MUST ask questions through the `AskUserQuestion` tool, not as plain text, whenever the answer is a choice between options:
   - Ask one question per call, with 2 to 4 mutually exclusive options. Each option has a short label and a description of its consequence.
   - Put your recommended option first and end its label with `(Recommended)`.
   - Do not add an "Other" option; the tool provides it for free-text answers.
   - Use a plain-text question only for open-ended answers (names, values, free descriptions), or if the tool is unavailable.
   - Ask in the language the user is writing in. Write spec files, docs, and code in English.
   - Never ask what you can answer by reading the docs or the code.
5. You MUST NOT contradict these documents. If a document is wrong, outdated, or conflicts with another, stop and report it instead of choosing silently.

## Document map

| File | Read when | Contains |
| --- | --- | --- |
| [RULES.md](RULES.md) | Starting any task | Required process: plan, ADR, end-of-task report |
| [BUSINESS.md](BUSINESS.md) | Needing product context | What Coffee Delivery does; glossary; the catalog; pricing and order rules |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Choosing tools, libraries, or structure | Tech stack, infrastructure, repository layout (`[implemented]` vs. `[planned]`) |
| [CONVENTIONS.md](CONVENTIONS.md) | Writing any text, API endpoint, error, money value, or page route | en-US language rule, `/api/v1` versioning, error format, money in cents, routes |
| [DEVELOPMENT.md](DEVELOPMENT.md) | Writing any code | Engineering principles, code organization, testing, commits, observability |
| [DESIGN.md](DESIGN.md) | Touching any UI | Visual direction, screens, and layout rules from the Figma design |
| [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) | Building or reusing UI components | Color, typography, and component tokens |
| [QA.md](QA.md) | Finishing any change | Commands that must pass |
| [`.specs/`](../.specs) | Starting work from a spec | Specs to implement, named `<NNN>-<name>.md` with a global sequence number (`001-foundation.md`); `_template.md` defines their format |
| [`docs/PLAN.md`](../docs/PLAN.md) | Needing the roadmap | The 31 specs in seven milestones and the exit criteria |
| [`docs/design/figma-analysis.md`](../docs/design/figma-analysis.md) | Needing a design fact | Tokens, components, screens, and copy validated against the Figma render |
