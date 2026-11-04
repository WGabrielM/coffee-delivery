---
name: implement-specs
description: Implement a range of specs in parallel. Takes a spec range such as 001-010, acts as an orchestrator, and launches one background subagent per spec, each running implement-me end to end in its own git worktree, while tracking progress and dependencies. Use when the user says "implement-specs" or asks to implement, execute, or build several specs at once.
argument-hint: <range, e.g. 001-010 | 003 | 001,004,007-009>
---

# Implement Specs

Orchestrate the implementation of several specs at once. You do not implement anything yourself: you validate the batch, launch one background subagent per spec, keep track of their progress and dependencies, and report. Each subagent runs the [`implement-me`](../implement-me/SKILL.md) process for its spec, in isolation.

## Input

`$ARGUMENTS`: a spec selection. Accepted forms: a range `001-010`, a single number `007`, or a comma-separated mix `001,004,007-009`. Numbers match the prefix of `.specs/<NNN>-<name>.md`. An optional `--max-parallel=<N>` caps how many subagents run at once (default: no cap).

If the argument is missing, malformed, or a range is inverted (`010-001`), ask the user for it and stop. A number with no matching file is skipped with a warning; if nothing is left, stop.

## Why this is not just "10 agents in one folder"

Parallel agents in one working tree would see each other's half-written code in `yarn test`, rewrite each other's files in `yarn code:fix`, and commit each other's changes. So the process below isolates every subagent in its own git worktree and serializes the few steps that touch shared state (integration to `main`, shared infrastructure).

## Steps

### 1. Pre-flight

1. Read `.docs/AGENTS.md`, `.docs/RULES.md`, and `.docs/QA.md`. Read the root `AGENTS.md`.
2. For every selected spec, read it fully and check:
   - **Open questions** is `None`. A spec with open questions is not ready: list it for the user and leave it out of the batch unless the user chooses otherwise.
   - **Dependencies**: parse the `Depends on:` line in `## Context`. A dependency is satisfied when it is part of this batch, or when it is already implemented (its ADR exists at `./adrs/<spec-file-name>.md`, and `git log` shows its commit). A dependency that is neither makes the spec **unrunnable**: report it and leave it out, together with everything that depends on it.
   - **Already implemented**: if the spec's own ADR already exists, ask with `AskUserQuestion` whether to skip it (recommended) or implement it again.
3. Build the dependency graph. Detect cycles and stop on one.
4. If a spec has an ambiguity that would change the implementation, ask the user now, batched here, one question per call (see rule 4 in `.docs/AGENTS.md`). Subagents cannot interview the user, so everything the spec leaves open must be settled before launch.
5. Reserve plan numbers. Find the highest `NNN` in `./plans/`, and assign the next numbers in ascending spec order, one per spec. Subagents use the number they were given and never compute their own, so parallel plans cannot collide.
6. Create the run directory outside the repository, with a short path (the repository sits in a synced folder, and worktrees with `node_modules` hit path-length limits): `<system-temp>/ws-<run-id>/`, where `<run-id>` is `YYYYMMDD-HHMM`. It holds:
   - `status/<NNN>.log`: one progress file per spec
   - `locks/`: lock directories (see step 3)
   - `trees/<NNN>/`: one git worktree per spec
7. Show the user the execution plan as a table: spec, reserved plan number, dependencies, and the order they will start in (specs with no pending dependency start first). Ask for approval with `AskUserQuestion` (approve is recommended). This single approval replaces the per-spec plan approval of `implement-me`. Apply requested changes before continuing.

### 2. Launch

Run a spec as soon as every dependency is **done and pushed to `main`**, never earlier: a dependent needs its dependency's code. At the start, launch every spec whose dependencies are already satisfied. Each time a subagent finishes, launch whichever specs that unblocked. Respect `--max-parallel`.

For each spec to launch:

1. Create its worktree from the latest `main`, detached, so no branch is created (the team works only on `main`):
   ```
   git fetch origin
   git worktree add --detach <run-dir>/trees/<NNN> origin/main
   ```
2. Create the git-ignored `.env.local` with `yarn env:setup` in the worktree (after its `yarn install`), which writes the local defaults from `.env.example`. Never copy the main checkout's `.env.local`: it may point at a real or hosted mail provider (for example Mailtrap), and the browser tests read their emails from the local mail catcher.
   Also check that ports 3000 and 5173 are free. The Playwright tests reuse a server that is already running there, so a `yarn dev` left running in the main checkout would make them test the wrong code. If either port is in use, stop and ask the user to stop that server.
3. Launch one subagent for it, **in the background**, using the Claude Code `Agent` tool with `run_in_background: true` and the `general-purpose` type. Launch every spec that is ready in a single message so they actually run in parallel. Give each one the prompt in "Subagent prompt" below.

### 3. Supervise

Do not poll in a loop: the harness notifies you when a background subagent finishes. While waiting, you may read `status/<NNN>.log` files to show progress.

On every notification, and whenever the user asks, print a progress table: spec, state (`waiting`, `running`, `blocked`, `done`, `failed`, `skipped`), latest phase from its status log, and the commit hash when done. Then:

- **done**: confirm that its commit is on `origin/main`. Launch the specs it unblocked. Remove its worktree (`git worktree remove --force <path>`).
- **blocked** (the subagent hit a decision the spec does not cover): ask the user the question with `AskUserQuestion`, then send the answer to the same subagent (`SendMessage` if available; otherwise relaunch it in the same worktree with the answer added to the prompt). Other subagents keep running.
- **failed**: keep its worktree for inspection and mark every spec that depends on it, directly or not, as `skipped (dependency <NNN> failed)`. Independent specs continue.

Shared-state rules every subagent follows, which you enforce by putting them in the prompt:

- **Integration lock.** Rebasing and pushing to `main` happens under the lock `locks/integrate`.
- **Infrastructure lock.** `yarn test:e2e` (and anything else that uses the shared Docker services, ports, or database rows) runs under the lock `locks/infra`. Two concurrent runs of the same suite delete each other's test rows and fight for ports, even though each suite only touches its own email suffix.
- A lock is a directory taken atomically with `mkdir <lock-dir>` (it fails if it exists) and released with `rmdir`. When taken, wait a few seconds and retry; never delete another agent's lock. Release it in every exit path, including failures.

### 4. Final report

When no subagent is running and none can still be launched, print:

1. A table of every selected spec with its final state, commit hash, and plan and ADR paths.
2. For each failed, blocked, or skipped spec: the reason and what the user must do next.
3. Aggregated from the subagents' reports, per `RULES.md`, "At the end of every interaction": the ADR summaries, the manual QA steps, every modified file, every installed library, and the rationale. Keep each spec's part separate and labeled.
4. Anything that could not be verified, stated plainly.

Run `git worktree prune` and delete the run directory only if every spec is done; otherwise tell the user where the kept worktrees are.

## Subagent prompt

Fill in the placeholders and give each subagent this prompt, nothing less:

```
You implement exactly one spec, end to end, as part of a parallel batch.

Spec: <absolute path of the spec in YOUR worktree>
Plan number: <NNN>  (write the plan to plans/<NNN>-<spec-file-name>-plan.md; do not pick another number)
Worktree: <run-dir>/trees/<NNN>   (work ONLY here; never touch the main checkout or another worktree)
Status file: <run-dir>/status/<NNN>.log
Lock directory: <run-dir>/locks
Orchestrator: <how to message it, if available>

Follow the implement-me skill (.agents/skills/implement-me/SKILL.md), steps 1 and 3 to 7, with these overrides for batch mode:

1. Setup: in your worktree run `yarn install` before anything else.
2. No interview and no approval prompt. You cannot ask the user, and the orchestrator already obtained approval of the batch. Derive the Concept Summary from the spec and the .docs/ files yourself, record it in the plan, and continue. If a decision is NOT covered by the spec and would change the implementation, do not guess: append `BLOCKED | <question and your recommended answer>` to the status file, message the orchestrator if you can, and stop with that as your final answer.
3. Scope: change only what your spec covers. Other specs are being implemented at the same time by other agents; do not "help" them and do not edit their files.
4. Verify (step 5) in your worktree. Run `yarn test:e2e` only while holding <lock-dir>/infra, and release it right after. Everything else runs freely.
5. Commit and push (step 7) is changed because you are on a detached HEAD, not on `main`:
   a. Run the commit-and-push skill stages 1 to 5 (inspect, protect, group, message, stage and commit) in your worktree. The "no other branch" rule does not apply: detached HEAD is intended here. Include the plan and the ADR in the commit.
   b. Take the lock <lock-dir>/integrate.
   c. `git fetch origin`, then `git rebase origin/main`. This rebases only your own unpublished commit, which is allowed here and is the only history rewriting allowed. If it conflicts, resolve it keeping both sides' intent (typical files: `.docs/QA.md`, package.json, routes, module registration). For `yarn.lock`, resolve package.json first, then regenerate it with `yarn install`. Never resolve by dropping the other spec's change.
   d. If the rebase brought in other specs' commits, re-run `yarn code:fix`, `yarn types:check`, and `yarn test` after it. Fix what broke at its cause. If you changed anything, commit it (a new commit, no `--no-verify`).
   e. `git push origin HEAD:main`. Never force-push, never use `--no-verify`. If it is rejected because `main` moved, repeat from c while still holding the lock.
   f. Release the lock, in every case, including when something above failed.
6. If QA cannot be made to pass, do not push. Append `FAILED | <reason>` to the status file and report the failure.

Report progress by appending one line per event to the status file, in the form `<ISO time> | <PHASE> | <message>`, with the phases STARTED, CONTEXT, PLAN, IMPLEMENT (include `task i/n`), VERIFY, DELIVER, INTEGRATE, DONE, BLOCKED, FAILED. Also message the orchestrator at PLAN, VERIFY, DONE, BLOCKED, and FAILED if you have a way to.

Your final answer is a structured report: spec; state (DONE, BLOCKED, or FAILED); commit hash on main; plan path; ADR path and a summary of it; manual QA steps; every modified file; every installed library; your rationale; and anything you could not verify. State plainly what is done and verified and what is not.
```

## Rules

- You orchestrate; you do not write code, plans, ADRs, or commits yourself.
- Never launch a spec before its dependencies are pushed to `main`.
- Never create a branch, never force-push, never skip hooks. Everything lands on `main`.
- Never lower the bar: a spec is `done` only when its QA passed and its commit is on `origin/main`.
- Ask the user in their language, through `AskUserQuestion`, one question per call. Write plans, ADRs, and code in English.
