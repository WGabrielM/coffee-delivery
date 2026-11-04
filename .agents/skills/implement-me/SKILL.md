---
name: implement-me
description: Execute a spec end to end following the project's rules. Takes a spec file path, reads the project context, runs feature-concept, writes a plan, implements it with TDD, runs QA, delivers the required report, and finishes with commit-and-push. Use when the user says "implement-me" or asks to implement, execute, or build a spec.
argument-hint: <path-to-spec>
---

# Implement Me

Execute the spec passed as the argument, following the project's process exactly. Do the steps in order and do not skip any.

## Input

`$ARGUMENTS`: the path to a spec file. If it is missing or the file does not exist, ask the user for it and stop.

## Steps

### 1. Load context

1. Read the spec fully.
2. Read `.docs/AGENTS.md` and follow it. Then read every document its map says is relevant to this spec. `RULES.md`, `DEVELOPMENT.md`, `ARCHITECTURE.md`, and `QA.md` are always relevant.
3. Read the root `AGENTS.md`, which points to `.docs/AGENTS.md`.
4. Explore the code the spec touches: existing patterns, modules, tests.
5. Identify the skills required by `.docs/AGENTS.md` for this work (for example `frontend-design` and `web-design-guidelines` for any UI) and load them. If a required skill is not available, say so and follow the official documentation of that technology instead.

### 2. Clarify

Invoke the `feature-concept` skill with the spec as input. Run the full interview and obtain the user's confirmation of the Concept Summary. Do not plan or write code with unresolved decisions.

### 3. Plan

1. Write the plan to `./plans/<NNN>-<spec-file-name>-plan.md`, where `<spec-file-name>` is the spec's name without its number and extension (`001-foundation.md` gives `foundation`) and `<NNN>` is the plan's own number, the next zero-padded sequence number in `./plans/` (`001` if empty; never reuse or renumber). Create the `plans/` directory if needed. Start the plan with a header listing its number, creation date (`YYYY-MM-DD`), and spec link (see `RULES.md`).
2. The plan MUST contain:
   - Link to the spec and the confirmed Concept Summary
   - Ordered implementation tasks, each small and independently verifiable
   - For each task: files to create or change, the domain/module and layer (per `DEVELOPMENT.md`), and the tests to write first
   - New dependencies, with justification
   - Observability, accessibility, and responsiveness work where applicable
   - QA steps and risks
3. Show the user the plan, then ask for approval with the `AskUserQuestion` tool (options: approve, change the plan; approve is recommended). Wait for the answer. Apply requested changes to the plan file before continuing.

### 4. Implement

1. Work through the tasks in order. For each one: write the failing test, make it pass, refactor. Update the plan's task status as you go.
2. Follow `DEVELOPMENT.md` (DRY, clean code, SOLID, vertical slices, layers, `src/modules/shared`), `ARCHITECTURE.md`, and for UI `DESIGN.md` and `DESIGN_SYSTEM.md`.
3. Stay inside the spec's scope. If you find the plan is wrong or the spec is incomplete, stop and ask; do not improvise.
4. Do not commit or push during implementation. The commit happens once, at the end (step 7).

### 5. Verify

Run every applicable command in `QA.md`. Fix failures at their cause. All must pass. If a command is marked `[planned]` and your change makes it real, add the script, mark it `[implemented]` in `QA.md`, and remove what it replaces, in the same change. Report any check you could not run, with the reason.

### 6. Deliver

Follow "At the end of every interaction" in `RULES.md`:

1. Create the ADR at `./adrs/<name>.md` and print a summary of it.
2. List manual QA steps.
3. List every modified file.
4. List every installed library.
5. Give your rationale for decisions, implementations, and changes.

State plainly what is done and verified, and what is not.

### 7. Commit and push

Run the `commit-and-push` skill. This is a standing instruction for every spec execution, so do not ask for permission first. Do it only after the QA in step 5 passes. If QA failed and you could not fix it, do not commit: report the failure instead. Include the commit and push result in your final message.
