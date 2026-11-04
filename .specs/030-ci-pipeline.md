# CI: GitHub Actions pipeline

## Scope
@.github/workflows/ci.yml - New; pipeline for pushes to `main` and for pull requests
@.github/workflows/commitlint.yml - New; commit message check for pull requests
@package.json - New script `ci` that runs the same commands as the pipeline
@.docs/DEVELOPMENT.md, @.docs/QA.md - Document the pipeline

## Context
Part of: Coffee Delivery capstone.
Depends on: @.specs/028-app-e2e-happy-path.md
All quality gates are root scripts: `lint`, `types:check`, `test`, `test:e2e`, and `build`. The project works on `main` and pushes after each spec, so the pipeline is the safety net that runs the same commands on a clean machine. The e2e tests need Postgres; the observability stack is not needed for them.

## Business needs
Every push to `main` and every pull request is checked on a clean machine, so a change that breaks the project is seen at once.

## Acceptance Criteria
- The workflow runs on `push` to `main` and on `pull_request`, with the jobs `api`, `app`, and `e2e`; `api` and `app` run in parallel, and `e2e` starts after both.
- `api` sets up Java and Gradle caching and runs `lint`, `types:check`, `test`, and `build` for the API; `app` sets up Node and Yarn caching and runs the same four tasks for the app.
- `e2e` starts a Postgres service container, runs `yarn test:e2e` (API e2e tests and Playwright), and uploads the Playwright report and traces when it fails.
- The commit message workflow runs commitlint over the commits of a pull request.
- `yarn ci` runs locally the same commands in the same order as the jobs and exits `0` on a clean checkout.
- Tool versions in the workflow (Java, Node, Yarn, and each action) are explicit and match the project's versions; no action uses a moving tag such as `main`.
- The first run on `main` after pushing finishes green (checked by the user, and listed as a manual QA step in the end-of-task report); the workflow file passes `actionlint`.
- `yarn code:fix`, `yarn lint`, `yarn types:check`, `yarn test`, `yarn test:e2e`, and `yarn build` pass.

## What to do
- Write `yarn ci` first and make it green locally, then write the workflow from it.
- Verify the current versions of the actions before pinning them.

## What not to do
- Do not add deployment, releases, Docker image builds, or secrets.
- Do not run Lighthouse, load tests, or the observability stack in CI.
- Do not add a build matrix of several Java, Node, or browser versions.

## Result
Each push and pull request runs lint, type checks, unit tests, builds, and the e2e flow on GitHub, with a matching `yarn ci` command for local use.

## Open questions
None
