---
description: Find performance problems in the API and the app, checked against Grafana data, with the performance-analyst agent
argument-hint: "[path, endpoint, or symptom, for example 'the home page is slow']"
---

Launch the `performance-analyst` agent with the Agent tool (`subagent_type: "performance-analyst"`).

Focus: $ARGUMENTS (if empty, sweep `apps/api` and `apps/app`).

Before you launch it, check whether Grafana answers at `http://localhost:3030` (`curl -s -o /dev/null -w "%{http_code}" http://localhost:3030/api/health`). Tell the agent whether the data is available, so it marks findings "measured" or "unmeasured" correctly. If it is not, say once that `yarn infra:up` starts it.

Print the agent's report as is. Add one line with the single change that gives the biggest user-visible gain, and the command that will measure it (`yarn load:smoke` or `yarn load`, with the API running). Do not edit any file.
