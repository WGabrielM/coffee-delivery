# Plan 031: Documentation and capstone handoff

- Number: 031
- Created: 2026-11-08
- Spec: [.specs/031-project-docs-and-handoff.md](../.specs/031-project-docs-and-handoff.md)

## Concept summary

The spec has no open question and asks for no code: it hands the repository over. Choices, each recorded in `adrs/project-docs-and-handoff.md`:

1. **Sync first.** The `docs-keeper` agent runs in fix mode over the final repository and the drift it finds is fixed before anything new is written, so the README and the report are written from a documentation that matches the code.
2. **Metrics from commands run now**, on 2026-11-08, on the final code: the API tests and coverage (`./gradlew cleanTest cleanE2eTest test e2eTest jacocoTestReport`), the app tests, the script tests, the Playwright run (`yarn test:e2e`), `yarn lighthouse`, and the visual comparison. No number comes from an earlier report.
3. **README** rewritten for a stranger: what the product is, the stack, the prerequisites with versions, the three steps (`yarn local:setup`, `yarn api:dev`, `yarn app:dev`), the ports, the commands (including `yarn ci`, `yarn lighthouse`, and the load tests), the folder map, and links.
4. **`docs/CAPSTONE.md`**: the goal, the process, the table of the 31 specs (generated from the files, so every link exists), the final numbers with their commands, who decided what, the deviations from the mold, the known limits, and the lessons.
5. **`docs/PLAN.md`**: every milestone marked as delivered and every exit criterion with its measured result.
6. **Proof of completeness by command:** every spec has a plan and an ADR (a script run now), the link checker finds no broken link in the README and the report, and a search finds no Portuguese UI text outside design quotes and no command that does not exist.
7. **A fresh clone follows the README** in an empty folder, with the one change that this machine needs: its Node is 22.22.0, so `yarn install` takes `--ignore-engines` as the README says; the API already running on port 3000 serves the clone's app (the API start was proved apart in spec 028).
8. **No feature, refactor, dependency, deployment, release, or tag.**

## Tasks

| # | Task | Files | Check |
| --- | --- | --- | --- |
| 1 | Sync the documentation | `docs-keeper` agent (fix), `/health-check` | The agent's report; no drift |
| 2 | Measure | Gradle, Vitest, Playwright, Lighthouse | Numbers from this run |
| 3 | README | `README.md` | Link check; a fresh clone |
| 4 | Capstone report | `docs/CAPSTONE.md` | Link check |
| 5 | Roadmap | `docs/PLAN.md` | Every milestone and criterion has its result |
| 6 | Completeness | A script over `.specs`, `plans`, `adrs` | Every spec has both |
| 7 | Fresh clone | A clone in an empty folder | The app runs; the QA commands pass |
| 8 | Six QA commands | | Green |

## New dependencies

None.

## QA steps and risks

- QA: the six commands, the fresh clone, the link check, and the health check.
- Risk: the first GitHub run of the pipeline is not seen here; its state is stated as found.
- Risk: the fresh clone shares the Docker containers and the API on port 3000 with the working copy.
