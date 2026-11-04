---
name: breakdown-specs
description: Break a large prompt into several small specs in .specs, one single action per spec, so implement-me can deliver one feature at a time. Decomposes the request, shows the list for approval, then writes each spec with create-specification. Use when the user says "breakdown-specs", "break this down into specs", "split this into specs", or gives a prompt that covers many features, for example authentication (sign-up, sign-in, confirm-account, forgot-password) or CRUD for several entities.
argument-hint: <large prompt to break down>
---

# Breakdown Specs

Split one large prompt into small specs, each implementing exactly one feature, and write them to `.specs/` with `create-specification`. This skill delivers spec files only. It does not write plans and does not implement anything.

## Input

`$ARGUMENTS`: the large prompt, or a path to a document that describes it. If empty, ask the user what to break down.

## What counts as one spec

One spec is **one action**: a verb plus an object that a user (or a system) can do, from the first change to the last observable result.

- **Single behavior.** A spec has one main flow and its error and edge cases. If you need "and" to describe it, split it.
- **Vertical slice.** It includes every layer that action needs (data, API, UI, tests), so it can be implemented, tested, and merged on its own. Split by layer only when a single action is too large for one `implement-me` run.
- **Small.** As a guide, up to about six acceptance criteria and one domain. More than that is a sign to split.
- **Independent where possible.** When a spec needs another, say so in its Context (`Depends on: @.specs/<NNN>-<name>.md`). Dependencies must not form a cycle.
- **Shared prerequisites.** Make a prerequisite its own spec (for example a data model or a shared module) only when two or more specs need it. Otherwise it belongs to the first spec that needs it.

### Patterns

| Prompt | Specs (one action each) |
| --- | --- |
| Authentication | `auth-sign-up`, `auth-confirm-account`, `auth-sign-in`, `auth-forgot-password`, `auth-reset-password`, then optional: `auth-sign-out`, `auth-resend-confirmation`, `auth-change-password` |
| CRUD for an entity (for example businesses) | `businesses-create`, `businesses-list`, `businesses-get`, `businesses-update`, `businesses-delete` |
| CRUD for several entities | The same five per entity, in separate specs. Never merge two entities into one spec. |

Name each spec `<NNN>-<domain>-<action>.md` (for example `002-auth-sign-up.md`). `<name>` is `<domain>-<action>` in kebab-case. `<NNN>` is the global sequence number from `create-specification`: the first spec of the breakdown gets the next free number, and the rest follow consecutively **in implementation order**, so the file order is the order to implement them.

## Steps

1. **Load context.** Read `.docs/AGENTS.md` and the documents it maps (`BUSINESS.md`, `ARCHITECTURE.md`, `DEVELOPMENT.md`, `QA.md`), `.specs/_template.md`, and the existing files in `.specs/`. Check the repository for what already exists, so you do not spec work that is done.
2. **Clarify the whole.** If the prompt leaves open decisions that change how it splits (which flows, which entities, which roles), load the `feature-concept` skill, or ask with the `AskUserQuestion` tool (one question per call, recommended option first, labeled `(Recommended)`). Never guess a real gap.
3. **Decompose.** Split the prompt into actions using the rules above. For each one write the spec name, a one-line goal, its dependencies, and what it explicitly leaves out.
4. **Check coverage.** Every part of the prompt must map to exactly one spec or be listed as out of scope. Nothing is missing, nothing is in two specs, and no spec duplicates an existing file in `.specs/`.
5. **Offer missing slices.** If the domain usually needs actions the prompt did not mention (for example sign-out or resend-confirmation for authentication), list them and ask which to include with `AskUserQuestion` (multi-select, none selected by default). Never add them silently.
6. **Approve the breakdown.** Show a table with the order, spec name, goal, and dependencies, plus the out-of-scope list. Ask for approval with `AskUserQuestion` (options: approve, change the breakdown; approve is recommended). Apply requested changes and ask again. Do not write any file before approval.
7. **Create the specs.** For each spec, in dependency order, run the `create-specification` skill with a focused prompt: the spec's name, its single action, its goal, its dependencies, its boundaries, and the relevant decisions already made. Tell it the breakdown is approved, so it asks only about real gaps in that spec and skips its own approval and hand-off (the next step covers both). Put `Depends on: @.specs/<NNN>-<name>.md` and `Part of: <large prompt in a few words>` at the start of each spec's Context.
8. **Verify the set.** Re-read the files and check: every file follows `.specs/_template.md`, names are unique and kebab-case, numbers are consecutive and follow the implementation order, every dependency points to a spec with a lower number (which also rules out cycles), the union of the specs covers the original prompt, and each spec is single-action. Fix any problem you find.
9. **Report.** Give a table of the specs in implementation order with their dependencies, any open questions left in them, and any conflicts with the docs. Suggest `implement-me .specs/<NNN>-<first-spec>.md` as the next step, and note that each spec is implemented in a separate run.

## Rules

- One feature per spec. Do not combine actions to reduce the number of files.
- Do not invent features beyond the prompt, the docs, the code, and the user's answers. Suggested extras need an explicit pick.
- Do not write the plan, implement anything, or commit.
- Write specs in English; ask questions in the user's language.
