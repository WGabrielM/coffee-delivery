---
name: refine-spec
description: Refine an existing spec in .specs so it is complete, testable, consistent with the project docs, and ready for implement-me. Use when the user says "refine-spec" or asks to improve, review, tighten, or fix a spec.
argument-hint: <spec-path-or-name>
---

# Refine Spec

Improve a spec in place so an agent can implement it without guessing. Preserve the author's intent; sharpen it, do not change it.

## Input

`$ARGUMENTS`: a spec path, or a name or number resolved to `.specs/<NNN>-<name>.md` (for example `foundation` or `001`). If missing or not found, list the files in `.specs/` (excluding `_template.md`) and ask which one.

## Steps

1. **Load context.** Read the spec, `.specs/_template.md`, `.docs/AGENTS.md`, and the documents it maps as relevant (always `BUSINESS.md`, `ARCHITECTURE.md`, `DEVELOPMENT.md`, `QA.md`). Check the repository for the paths and commands the spec mentions.
2. **Audit** the spec against the checklist below. Record each problem.
3. **Fix** every problem you can resolve from the docs, the code, or the spec's own text. Edit the spec file in place.
4. **Ask** about problems that need a decision with the `AskUserQuestion` tool, one question per call, recommended option first and labeled `(Recommended)` (see "Asking questions" in `.docs/AGENTS.md`). If there are many or deep gaps, offer to run `feature-concept`. Apply the answers to the spec.
5. **Report** (see Output).

## Checklist

**Structure**
- Matches `.specs/_template.md`: same sections, same order, same heading levels, exact names (`Acceptance Criteria`, not `Criterias`). Title is a short name.
- No `TODO` or placeholder text left.

**Content**
- **Scope** lists every affected path as `@path - note`, and marks new ones. No path is missing, and no listed path is unaffected.
- **Context** states facts and current state, not wishes.
- **Business needs** states the outcome, not the implementation.
- **Acceptance Criteria** are each observable and testable (a command, a test, a visible behavior). Rewrite vague wording ("works", "fast", "clean") into something checkable. Each criterion should be verifiable on its own, and together they cover everything in **What to do**.
- **What to do** and **What not to do** are concrete and do not contradict each other or the criteria. Over-building traps are named in **What not to do**.
- **Result** describes the end state when all criteria pass.
- **Open questions** is `None`, or lists real unresolved decisions.

**Consistency**
- Terms, commands, paths, and technologies agree with `.docs/` and the repository. Where the spec intentionally differs from a doc (for example a new tool or path), keep the spec's choice and report the conflict so the doc can be updated. Never silently pick one.
- No internal contradictions; one name per concept.
- Single, right-sized unit of work. If the spec bundles unrelated features, recommend splitting it.
- Written in English, imperative, concise. Remove repetition and filler.

## Rules

- Do not change the intent, scope, or decisions of the spec on your own. Ambiguity is a question, not a rewrite.
- Do not invent requirements. Anything added must come from the docs, the code, or the user's answers.
- Do not touch other files. Report doc inconsistencies instead of editing docs.
- Do not implement the spec.

## Output

After editing, reply with:

1. **Changes made**: short list, grouped by section.
2. **Conflicts with docs or code**: each with the spec's version and the doc's version.
3. **Open questions**: anything still unresolved.
4. **Verdict**: ready for `implement-me`, or not, and why.
