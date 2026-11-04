# Plan 001: foundation

- Number: 001
- Created: 2026-11-04
- Spec: [.specs/001-foundation.md](../.specs/001-foundation.md)

## Concept summary

No open question. The spec was approved on 2026-11-04. Choices made in this plan, each recorded in `adrs/foundation.md`:

1. Linting and formatting at the root use `oxlint` and `oxfmt`, as in the mold, so the app (spec 012) reuses them. Java formatting (Spotless) arrives with the API in spec 003.
2. The root runner maps each root task to a fixed Gradle task for `apps/api` and to the script of the same name in `apps/app/package.json`. Spec 003 must provide these Gradle tasks: `spotlessApply`, `spotlessCheck`, `compileJava compileTestJava`, `test`, `e2eTest jacocoTestCoverageVerification`, `build`.
3. `.claude/skills` is gitignored and filled by `yarn skills:link` (a junction on Windows), run by the `prepare` script after `yarn install`, as in the mold.
4. Hooks: `pre-commit` runs lint-staged (oxlint and oxfmt on staged files) and `commit-msg` runs commitlint, as in the mold.
5. Skills are copied unchanged from the mold, except two lines (a Turborepo sentence in `implement-me`, the build folders in `commit-and-push`) and one added line in `commit-and-push` for a push that fails for lack of credentials.

## Tasks

Each task starts with its test. Tests use Node's built-in runner (`node --test`), so the foundation needs no test dependency.

| # | Task | Files | Test first |
| --- | --- | --- | --- |
| 1 | Root package and tooling config | `package.json`, `.oxlintrc.json`, `.oxfmtrc.json`, `commitlint.config.mjs`, `lefthook.yml`, `.gitattributes`, `.gitignore` | `scripts/foundation.test.mjs`: package is private and pins Yarn, hooks and ignore rules exist |
| 2 | Task runner | `scripts/run-task.mjs` | `scripts/run-task.test.mjs`: the plan for each task with and without `apps/api` and `apps/app`; skipped workspaces are named; the first failure stops the run |
| 3 | Skill links | `scripts/link-skills.mjs` | `scripts/foundation.test.mjs`: running the script on a temporary tree links every skill and is safe to run twice |
| 4 | Skills, agents, commands | `.agents/skills/*` (17, copied), `skills-lock.json`, `.claude/agents/*` (6), `.claude/commands/*` (6) | `foundation.test.mjs`: the 17 skills each have `SKILL.md`; the 6 agents and 6 commands exist and have front matter |
| 5 | Documentation hub | `AGENTS.md`, `.docs/*.md` (9), `README.md` | `foundation.test.mjs`: `.docs/AGENTS.md` links the other eight documents; no document mentions the mold's stack or product |
| 6 | Workflow folders | `plans/`, `adrs/`, `.specs/_template.md` | `foundation.test.mjs`: template has the eight sections in order |
| 7 | Verify | `yarn install`, then the six QA commands, commitlint checks, hook check | Acceptance criteria of the spec, one by one |

## New dependencies (dev, root only)

| Package | Why |
| --- | --- |
| `@commitlint/cli`, `@commitlint/config-conventional` | Conventional Commits check, as in the mold |
| `lefthook` | Git hooks, as in the mold |
| `lint-staged` | Format staged files before each commit, as in the mold |
| `oxlint`, `oxfmt` | Lint and format JavaScript, TypeScript, JSON, and CSS, as in the mold |

Versions are the ones the mold pins, checked against the registry on 2026-11-04.

## Observability, accessibility, responsiveness

Not applicable: this spec has no runtime code and no UI.

## QA steps

1. `yarn install` from a clean checkout.
2. `yarn code:fix`, `yarn lint`, `yarn types:check`, `yarn test`, `yarn test:e2e`, `yarn build`: all exit `0`, each prints what it ran and skipped.
3. `echo "bad message" | yarn commitlint` fails and `echo "chore: add skeleton" | yarn commitlint` passes.
4. `git commit -m "bad message"` is rejected by the hook after `yarn install`.
5. `git status` shows no `.fig`, `.pdf`, or `image-frames.png` once `.gitignore` is in place.

## Risks

- The Lefthook hook binary is installed by `yarn install` on the developer's machine; hooks are not active until then. Mitigation: the `prepare` script runs `lefthook install`, and the README says to run `yarn install` first.
- Gradle task names are fixed here before the API exists. Mitigation: spec 003 lists them in its acceptance criteria.
- Windows junctions for skills cannot be tested in the Linux workspace. Mitigation: the link script uses the same call as the mold, which works on Windows; the user confirms with `yarn skills:link` in the end-of-task report.
