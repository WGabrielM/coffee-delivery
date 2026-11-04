---
description: Review scalability and evolution limits and get a spec-sized roadmap with the evolution-advisor agent
argument-hint: "[topic, for example 'online payment' or 'order tracking']"
---

Launch the `evolution-advisor` agent with the Agent tool (`subagent_type: "evolution-advisor"`).

Topic: $ARGUMENTS (if empty, the whole system: the three limits that will hurt first).

Print the agent's review as is. Then ask the user, with `AskUserQuestion` (one question, 2 to 4 options, the recommended one first), which roadmap step to turn into a spec, in the language the user writes in. If they pick one, run the `create-specification` skill for it. If they decline, stop.
