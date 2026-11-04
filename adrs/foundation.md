# ADR: Foundation of the repository and workflow

- Status: Accepted
- Date: 2026-11-04
- Spec: [.specs/001-foundation.md](../.specs/001-foundation.md)
- Plan: [plans/001-foundation-plan.md](../plans/001-foundation-plan.md)

## Context

Coffee Delivery is rebuilt from scratch as a postgraduate capstone, with the same spec-driven workflow as the Module 4 project (the mold). Every later spec needs the same rules, skills, agents, quality commands, and commit checks from the first day. The mold is a Node and Nest.js repository; this one is a Spring Boot API and a React app.

## Decisions

1. **Copy the workflow, rewrite the content.** The 17 skills are copied unchanged, except for three lines: a Turborepo sentence removed from `implement-me`, the build folders in `commit-and-push` changed from `.turbo` to `build` and `.gradle`, and a line added to `commit-and-push` for a push that fails for lack of credentials. The nine documents, six agents, and six commands are rewritten for Coffee Delivery, because their text described Nest.js, Next.js, Supabase, Weaviate, and the AI experts product.
2. **Skills left out.** `code-review` and `refactor-slices` depend on mold scripts for pull requests and for Nest slices; `next-best-practices`, `shadcn`, `supabase-postgres-best-practices`, and `playwright-best-practices` match technology this project does not use. The `code-reviewer` agent stays and is called directly. ArchUnit replaces the slice audit script (spec 003).
3. **Root task runner.** `scripts/run-task.mjs` maps each of the six root tasks to `oxlint` and `oxfmt` (root), Gradle (`apps/api`), and the same-named script of `apps/app`. A workspace that does not exist yet is skipped and named in the output, so the QA commands pass on the skeleton and stay the same for the life of the project. The planner is a pure function with unit tests. The Gradle task names are fixed now and are acceptance criteria of spec 003.
4. **Lint and format with `oxlint` and `oxfmt`,** as in the mold, so the app reuses them (spec 012). Java formatting is Spotless (spec 003).
5. **Hooks as in the mold.** Lefthook runs lint-staged before a commit and commitlint on the message. `prepare` installs the hooks and links the skills after `yarn install`.
6. **No dependency for the foundation tests.** They use Node's built-in test runner.
7. **Design exports stay local.** The `.fig` (8 MB), the PDF (4 MB), and `image-frames.png` are ignored by Git. Figma is the source; the analysis, the extracted assets, and the reference images are tracked.
8. **Line endings.** `.gitattributes` forces LF for text files (`.bat` files keep CRLF). The mold's files arrived with CRLF and were converted.
9. **Yarn 1 and Node 22 or newer.** `packageManager` pins `yarn@1.22.22`, as in the mold. The mold requires Node 24; this project accepts 22 or newer because nothing here needs 24.
10. **A root `workspaces` entry for `apps/app` only.** `apps/api` is a Gradle project and has no `package.json`.

## Consequences

- Every spec ends with the same six commands and the same report, and a spec that adds a workspace needs no change to the runner, only to the workspace.
- Contributors must run `yarn install` once for the hooks to exist; before that, commits are not checked.
- The skills are third-party text copied into the repository; `skills-lock.json` records their sources and hashes for later updates.
- Windows junctions for `.claude/skills` are created by the same call as in the mold; this was verified on Linux by test and must be confirmed on Windows with `yarn skills:link`.
