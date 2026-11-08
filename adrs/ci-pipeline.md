# ADR: The CI pipeline and `yarn ci`

- Status: Accepted; the first run on GitHub is not yet seen
- Date: 2026-11-08
- Spec: [.specs/030-ci-pipeline.md](../.specs/030-ci-pipeline.md)
- Plan: [plans/030-ci-pipeline-plan.md](../plans/030-ci-pipeline-plan.md)

## Context

The project works on `main` and pushes after each spec. The pipeline is the safety net that runs the same checks on a clean machine, and `yarn ci` lets a person run the same checks first.

## Decisions

1. **One list of commands, used twice.** `scripts/ci.mjs` holds the commands of the jobs `api`, `app`, and `e2e`; `yarn ci` runs them in order and `node scripts/ci.mjs app` runs one job. The workflow has the same commands as its `run:` steps, and `scripts/ci.test.mjs` fails when the commands or their order differ, or when a job loses its working directory or its dependency. So the local run cannot drift from the remote one.
2. **The jobs use the underlying commands, not the root scripts.** The root `yarn lint`, `types:check`, `test`, and `build` run every workspace, so calling them in two parallel jobs would run each twice. `api` runs Gradle (`spotlessCheck`; `compileJava compileTestJava`; `test`; `build -x test -x e2eTest`) in `apps/api`; `app` runs `oxlint`, `oxfmt --check`, `node --test scripts/*.test.mjs`, and the app's `types:check`, `test`, and `build`. `api` and `app` run in parallel; `e2e` has `needs: [api, app]` and runs `yarn test:e2e` (the API e2e tests and Playwright).
3. **Postgres for e2e is a service container**: the image of `compose.yaml` (`postgres:18.6-alpine`), the database, user, and password of `.env.example`, on port 5432 with a `pg_isready` health check. Spec 028's runner checks that port first and then starts the API and the app. The Grafana stack is not started.
4. **Explicit versions, pinned actions.** Java 21 (Temurin; `options.release = 21`), Node 22.22.1 (`lint-staged` needs 22.22.1 or newer; the Node of this machine, 22.22.0, is why my local installs used `--ignore-engines`), Yarn 1.22.22 through `corepack enable` and the `packageManager` field, Postgres 18.6. Every action is pinned to the 40-character commit SHA of its current version, with the version in a comment: checkout 7.0.1, setup-java 6.2.0, setup-gradle 6.4.1, setup-node 7.1.0, upload-artifact 7.0.2. A test rejects a reference that is not a SHA, has no version comment, or is `main`, `master`, `latest`, or a moving major tag. I read the versions and the SHAs from the public GitHub API when I wrote the workflow.
5. **Caching** comes from the actions: Gradle (`setup-gradle`) and Yarn (`setup-node` with `cache: yarn`). `corepack enable` runs after `setup-node`, because the shims belong to the Node that is active.
6. **A failed e2e run leaves evidence.** In CI the Playwright config also writes the HTML report, and the job uploads `apps/app/playwright-report` and `apps/app/test-results` (traces on failure) with `if: failure()`, for seven days.
7. **Commit messages** are checked by the project's own commitlint over the commits of a pull request (`yarn commitlint --from <base sha> --to <head sha> --verbose`, full history checked out), not by a third-party action, so the rules are those of `commitlint.config.mjs`. Pushes to `main` are checked by the hook on the machine.
8. **Small safety defaults:** the token only reads the repository (`permissions: contents: read`), runs of the same ref cancel each other, and every job has a timeout.
9. **Not included**, as the spec says: deployment, releases, image builds, secrets, Lighthouse, load tests, the observability stack, and a build matrix.

## Verification

- `yarn ci` passes on this machine: 11 commands in the three jobs, in about two minutes with Gradle up to date (129 script tests, 638 Vitest tests, 185 Playwright tests). It found one formatting problem in my new script on its first run, which shows it is as strict as the pipeline.
- `scripts/ci.test.mjs` (18 tests) passes: the script, the order, the commands of each job against the workflow, the triggers, `needs`, the working directory of `api`, the pins and version comments, the explicit versions, the Postgres service and the failure upload, no secrets or deployment or matrix, the timeouts and permissions, and the commitlint workflow.
- Both workflow files parse as YAML with the expected structure (`api`, `app`, and `e2e` with `needs: [api, app]`; `commitlint`).
- **Not done:** `actionlint` was not run. I downloaded the release asset (its SHA-256 matched the published checksum) and the permission system refused to let me run the downloaded binary, so I did not run it or work around it. **The first run of the workflow on GitHub has not been seen** (the spec leaves that to the owner).

## Consequences

- A change to a command must be made in the workflow and in `scripts/ci.mjs` together; the test tells which one is missing.
- The e2e job depends on Docker for Testcontainers and on a free port 5432 on the runner (the GitHub runner has both).
- The e2e tests create orders in the Postgres of the job, which is thrown away with the runner.
- Moving an action to a new version means a new SHA; the version comment and the test make it visible.
- No new library.
