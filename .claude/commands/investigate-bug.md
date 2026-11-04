---
description: Investigate a bug to its root cause and get a failing test and a fix plan with the bug-investigator agent
argument-hint: "<bug report: what happened, what you expected, error text, endpoint, or failing test>"
---

Launch the `bug-investigator` agent with the Agent tool (`subagent_type: "bug-investigator"`).

Bug report: $ARGUMENTS

If the report is empty, ask the user for the symptom (what happened, what was expected) and stop. Pass the report to the agent word for word, plus the local URLs (app `http://localhost:5173`, API `http://localhost:3000/api/v1`, Grafana `http://localhost:3030`) and whether each one answers.

Print the agent's report as is. Then offer the next step in one line: write the failing test first (TDD, the `tdd` skill) and apply the proposed fix, or stop here. Do not edit any file until the user says yes.
