---
description: Run the structure, performance, and evolution agents in parallel, then check the docs, and print one consolidated report
argument-hint: "[path or area]"
---

Run a health check of the repository. Scope: $ARGUMENTS (if empty, the whole repository).

1. In a single message, launch three agents in parallel with the Agent tool: `structure-auditor`, `performance-analyst`, and `evolution-advisor`, each with the same scope.
2. When they finish, launch `docs-keeper` in **check** mode (it edits nothing) with the same scope.
3. Print one consolidated report, not four:

```
## Health check: <scope>, <date>

### Top 5 actions
<the five most valuable fixes across all agents, most urgent first; for each: the area (structure, performance, evolution, docs), the finding, and the command or skill that handles it>

### Structure   <3 lines + the number of findings by severity>
### Performance <3 lines + measured or unmeasured>
### Evolution   <3 lines + the next limit that will hurt>
### Documentation <3 lines + the number of stale documents>

### Conflicts between agents
<where two reports disagree, for example one proposes splitting a module and another proposes a cache inside it; or "none">
```

Link each section to nothing external: name the agent's own report headings so the user can ask for the full text of one. Edit no file and commit nothing. Finish by suggesting the next command (`/sync-docs`, `/audit-structure <path>`, `/analyze-performance <path>`, `/plan-evolution <topic>`).
