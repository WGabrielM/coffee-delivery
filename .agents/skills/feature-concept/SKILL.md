---
name: feature-concept
description: Deeply interview the user about a feature, spec, or change until every decision is explicit and nothing is left to guess. Use before planning or implementing anything, when a request is vague or has unstated decisions, or when the user says "feature-concept", "grill me", or asks to stress-test an idea.
---

# Feature Concept

Interview the user relentlessly until you and they share a complete, unambiguous understanding of what to build. The goal is assertiveness: when the interview ends, a plan can be written and executed without further questions.

## Input

A feature description, a spec file path, or a vague idea. If a spec file is given, read it fully first.

## Process

1. **Gather context before asking.** Read `.docs/AGENTS.md` and the documents relevant to the topic (at minimum `BUSINESS.md`, `ARCHITECTURE.md`, `DEVELOPMENT.md`). Explore the codebase for related code, patterns, and constraints. Never ask a question you can answer by reading the repository.
2. **Map the decision tree.** List the decisions this feature depends on and the order they depend on each other. Resolve parent decisions before their children.
3. **Interview, one question at a time.** For each question:
   - Ask it with the `AskUserQuestion` tool (see "Asking questions" in `.docs/AGENTS.md`): one question per call, 2 to 4 options, your recommended option first and labeled `(Recommended)`, each option with a description of its consequence. The user can accept your recommendation in one click or answer "Other" freely.
   - Put the context that makes the question matter in the question text.
   - For open-ended answers that cannot be reduced to options, ask in plain text and give your recommended answer.
   - Wait for the answer before asking the next question.
4. **Probe, don't accept vagueness.** Follow up on answers that are fuzzy, contradictory, or that conflict with the `.docs/` files or the existing code. Name the conflict explicitly.
5. **Cover every dimension that applies** (skip only what is clearly irrelevant, and say you skipped it):
   - Goal and user value; who the users are; what success looks like
   - Scope: what is in, what is explicitly out, what is deferred
   - Behavior: main flow, alternative flows, edge cases, error and empty states
   - Data: entities, relationships, validation, migrations, retention, permissions
   - API and interfaces: endpoints, contracts, events, external connectors
   - UI: screens, states, copy, accessibility, responsiveness (per `DESIGN.md` and `DESIGN_SYSTEM.md`)
   - Non-functional: security, privacy, performance, scale, observability
   - Architecture fit: which domain/module, which layers, shared code, new dependencies
   - Testing: which behaviors must be covered by unit, integration, and E2E tests
   - Rollout: feature flags, backwards compatibility, risks, open dependencies
6. **Challenge the idea.** Point out simpler alternatives, hidden costs, and risks. Disagree with the user when you have a reason; do not just agree.
7. **Stop when done.** Stop when no open decision remains that would change the implementation. Do not pad the interview. Typically a small change needs a few questions; a large feature needs many.

## Output

End with a **Concept Summary** and ask the user to confirm it:

- **Goal**: one or two sentences.
- **Scope**: in / out / deferred.
- **Decisions**: every decision made, each with its rationale.
- **Behavior and edge cases**: as testable statements.
- **Impacted areas**: domains, modules, packages, data, external services.
- **Test expectations**: behaviors each test level must cover.
- **Risks and open items**: anything unresolved, with an owner.

Do not write code and do not write the plan file. If the user confirms, return the summary to the caller (for example `implement-me`) or, when invoked on its own, offer to turn it into a plan saved at `./plans/<NNN>-<spec-file-name>-plan.md` (`<spec-file-name>` is the spec's name without number and extension; numbering rules in `.docs/RULES.md`).

## Rules

- One question per call. No lists of questions.
- Always include a recommended answer, as the first option labeled `(Recommended)`.
- Ask in the user's language.
- Never assume. If a decision is unspoken, ask.
- Never proceed to implementation from this skill.
