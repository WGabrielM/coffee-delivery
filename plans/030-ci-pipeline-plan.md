# Plan 030: CI pipeline

- Number: 030
- Created: 2026-11-08
- Spec: [.specs/030-ci-pipeline.md](../.specs/030-ci-pipeline.md)

## Concept summary

The spec has no open question. It puts the quality gates on GitHub, and a local twin. Choices, each recorded in `adrs/ci-pipeline.md`:

1. **`yarn ci` first.** `scripts/ci.mjs` lists the commands of the three jobs (`api`, `app`, `e2e`) and runs them in order; `node scripts/ci.mjs <job>` runs one. The workflow was written from it, and a test (`scripts/ci.test.mjs`) fails if the commands or their order differ between the two.
2. **The API and the app are checked apart.** The root `yarn lint` and the others run every workspace, so the jobs use the underlying commands: Gradle for the API (`spotlessCheck`, `compileJava compileTestJava`, `test`, `build -x test -x e2eTest`), and for the app `oxlint`, `oxfmt --check`, the script tests, and the app's `types:check`, `test`, and `build`. `api` and `app` run in parallel; `e2e` has `needs: [api, app]`.
3. **e2e** installs the browser, starts a Postgres 18.6 service container (the image of `compose.yaml`, the values of `.env.example`, port 5432), and runs `yarn test:e2e`: the API e2e tests (Testcontainers on the runner's Docker) and Playwright, which starts the API and the app by itself (spec 028). In CI the Playwright config adds the HTML report, and the report and the traces are uploaded when the job fails.
4. **Versions are explicit.** Java 21 (Temurin, the `release` of the build), Node 22.22.2 (the least that the dependencies accept; first written as 22.22.1 and corrected after the first run failed), Yarn 1.22.22 from `packageManager` through Corepack, Postgres 18.6. Every action is pinned to the commit SHA of its current release, with the version in a comment; no action uses a moving tag. I read the versions and the SHAs from the public GitHub API today.
5. **Commit messages** are checked with the project's own commitlint (`yarn commitlint --from <base> --to <head>`), not with a third-party action, so the rules are the ones of `commitlint.config.mjs`.
6. **Not in the pipeline:** deployment, releases, images, secrets, Lighthouse, load tests, the observability stack, and a build matrix.

## Tasks

| # | Task | Files | Test first |
| --- | --- | --- | --- |
| 1 | `yarn ci` and its tests | `scripts/ci.mjs`, `scripts/ci.test.mjs`, `package.json` | The test fails without the workflow |
| 2 | The workflows | `.github/workflows/ci.yml`, `commitlint.yml` | `ci.test.mjs` (jobs, order, versions, pins, service, upload) |
| 3 | The CI report | `apps/app/playwright.config.ts` | |
| 4 | Check the files | YAML parse; `actionlint` | See the report |
| 5 | `yarn ci` on this machine | | Exit 0 |
| 6 | Docs | `DEVELOPMENT.md`, `QA.md`, `ARCHITECTURE.md`, `PLAN.md` | Root tests |
| 7 | Six QA commands | | Green |

## New dependencies

None.

## QA steps and risks

- QA: the six commands and `yarn ci`; the first run on GitHub is the owner's to check.
- Risk: the first run on GitHub may reveal a difference from this machine (Linux, a clean cache, Docker for Testcontainers). The Playwright report is uploaded when `e2e` fails.
- Risk: `actionlint` was not run here (the permission to run a downloaded binary was refused); the file is valid YAML with the expected jobs, and the owner should run `actionlint` once.
