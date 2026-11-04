---
description: Audit the structure of the repository (layers, slices, duplication, dead code) with the structure-auditor agent
argument-hint: "[path, for example apps/api/src/main/java/com/coffeedelivery/catalog]"
---

Launch the `structure-auditor` agent with the Agent tool (`subagent_type: "structure-auditor"`).

Scope: $ARGUMENTS (if empty, the whole repository, starting with `apps/api` and `apps/app`).

Give the agent the scope and tell it to follow its own report format. When it returns, print its report as is, then add one line: the first finding to fix, and how to fix it (`implement-me` with a spec for anything bigger than a small change). Do not edit any file.
