---
name: create-specification
description: 'Create a refined spec from a prompt or idea and save it to .specs/<NNN>-<name>.md. Loads the feature-concept skill when the idea is vague, reads the project context (.docs/), follows .specs/_template.md, runs refine-spec on the result, and presents it for approval. Does not implement: it only delivers the spec file. ALWAYS use when the user asks to create or generate a spec, or to turn an idea into a spec: "create a spec", "write a spec", "generate a spec for <feature>", "give me a spec for <feature>", "turn this idea into a spec", "crie uma spec", "cria a spec", "spec para <feature>", "gera uma spec de <feature>", "me dá uma spec de <feature>", "escreve a spec de <feature>".'
argument-hint: <what the spec should cover>
---

# Create Specification

Turn a prompt or idea into a complete spec file in `.specs/`, ready for `implement-me`. This skill delivers the spec file only. It does not write the plan and does not implement anything.

## Project conventions

- **Specs folder:** `.specs/`. File name: `.specs/<NNN>-<name>.md`, where `<name>` is a short kebab-case topic and `<NNN>` is a zero-padded global sequence number: one higher than the highest number already in `.specs/` (`001` if there is none). Numbers are never reused or renumbered, so file order is creation order. `_template.md` is not numbered.
- **Template:** `.specs/_template.md` is the canonical structure. Follow it exactly.
- **Context:** `.docs/AGENTS.md` and the documents it maps (`BUSINESS.md`, `ARCHITECTURE.md`, `DEVELOPMENT.md`, `QA.md`, and others when relevant).
- **Language:** the spec is written in English, imperative and concise. Questions to the user are asked in the user's language.

## Input

`$ARGUMENTS`: a description of the work. If empty, ask the user what the spec should cover.

## Steps

1. **Load context.** Read `.specs/_template.md`, `.docs/AGENTS.md`, and the documents it maps as relevant. Read one or two existing specs in `.specs/` for tone and level of detail. Explore the repository for the code the prompt touches.
2. **Clarify.** Decide whether the prompt leaves open decisions that would change the spec (scope, behavior, data, interfaces, boundaries).
   - Idea is vague, large, or unclear: load the `feature-concept` skill and use its confirmed Concept Summary.
   - Minor gaps: ask with the `AskUserQuestion` tool, one question per call, recommended option first and labeled `(Recommended)` (see "Asking questions" in `.docs/AGENTS.md`).
   - Never fill a real gap with a guess.
3. **Name the file.** List `.specs/`, take the highest `<NNN>` prefix, and use the next number: `.specs/<NNN>-<name>.md`. Never overwrite an existing spec. If a spec on the same topic already exists, tell the user and ask whether to refine it instead.
4. **Write the spec** from `.specs/_template.md`: same sections, same order, same headings, no placeholder text. Follow the guidance in the template's comments, then remove those comments.
   - **Scope:** every affected path as `@path - note`, new ones marked.
   - **Acceptance Criteria:** observable and testable, covering everything in **What to do**.
   - **What not to do:** name the boundaries that stop over-building.
   - **Open questions:** `None` if all are resolved; otherwise list the real ones.
5. **Refine.** Run the `refine-spec` skill on the new file and apply its fixes.
6. **Present for approval.** Summarize the spec (goal, scope, acceptance criteria, conflicts with the docs, open questions) and ask for approval with the `AskUserQuestion` tool (options: approve, request changes; approve is recommended). Apply requested changes to the file and ask again.
7. **Hand off.** After approval, suggest `implement-me .specs/<NNN>-<name>.md` as the next step.

## Rules

- Do not invent requirements beyond the prompt, the docs, the code, and the user's answers.
- One spec is one right-sized unit of work. If the prompt covers several independent features, propose splitting it into several specs and confirm with the user.
- Do not implement the spec and do not create the plan.
- When invoked by `breakdown-specs`, skip steps 6 and 7: the caller gets one approval for the whole set and does the hand-off. Still run `refine-spec` (step 5).
