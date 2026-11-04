---
description: Bring the documentation back in line with the code with the docs-keeper agent (use "check" to only report)
argument-hint: "[check] [git range, spec, or folder]"
---

Launch the `docs-keeper` agent with the Agent tool (`subagent_type: "docs-keeper"`).

Arguments: $ARGUMENTS

If the first word is `check`, tell the agent to run in **check** mode and edit nothing. Otherwise run it in **fix** mode. The rest of the arguments are the scope (a git range such as `HEAD~3..HEAD`, a spec, or a folder). With no scope, use the changes since the last commit that touched `.docs/` (`git log -1 --format=%H -- .docs`).

Print the agent's report as is. In fix mode, run `git status --short` and `git diff --stat` and show them, so the user sees exactly which documents changed. Do not commit: the user decides, or runs `commit-and-push`.
