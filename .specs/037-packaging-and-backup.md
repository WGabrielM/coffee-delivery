# Packaging: container images and a tested database backup

## Scope
@apps/api/Dockerfile, @apps/api/.dockerignore - New; the API image
@apps/app/Dockerfile, @apps/app/nginx.conf, @apps/app/.dockerignore - New; the app image with a static server and a proxy to the API
@compose.packaged.yaml - New; runs the two images with the existing Postgres service, for a local check only
@scripts/db-backup.mjs, @scripts/db-restore.mjs - New; `pg_dump` and restore through the Postgres container
@scripts/db-backup.test.mjs - New; tests of the commands the scripts build
@package.json - Scripts `docker:build`, `docker:up`, `docker:down`, `db:backup`, and `db:restore`
@docs/RUNBOOK.md - New; how to build, run, back up, and restore
@.docs/ARCHITECTURE.md, @.docs/QA.md, @.docs/DEVELOPMENT.md - Document the images, the commands, and the ports

## Context
Part of: Coffee Delivery capstone.
Depends on: @.specs/030-ci-pipeline.md, @.specs/002-local-infrastructure.md
The API and the app run from the source on the machine of the developer. Compose has only PostgreSQL and Grafana, nothing has a Dockerfile, and there is no backup of the orders (which hold addresses) and no proof that one can be restored. The evolution review of 2026-11-08 calls this the gate for any real user. The choice of a host and the deployment are a decision of the owner and are not part of this spec.

## Business needs
Whoever runs the product can start it from images and recover the orders from a backup.

## Acceptance Criteria
**Images**
- `docker build` of `apps/api` makes an image from a multi-stage build (the Gradle `bootJar`, then a Java 21 runtime image) that runs as a non-root user, listens on port 3000, and starts with the settings of the environment variables of `.env.example`. The base images are pinned to exact versions.
- `docker build` of `apps/app` makes an image (the Node of CI, 22.22.2, builds; a static server serves the build) that serves the app on port 80, sends `/api` to the API container, answers unknown paths with `index.html` (the client router), and sends `Cache-Control` of a year for the hashed files in `assets/` and `no-cache` for `index.html`.
- `compose.packaged.yaml` runs the two images with the Postgres of `compose.yaml`; after `yarn docker:up` the app opens on <http://localhost:8080> with the 14 coffees, an order can be placed, and the confirmation shows. `yarn docker:down` stops them.
- A script test, or the commands in the ADR, show that each image starts, answers `/actuator/health` (API) and `/` (app), and stops.

**Backup and restore**
- `yarn db:backup` writes a `pg_dump` of the database (custom format) with the date in its name to `backups/` (ignored by Git) through the Postgres container, and prints the file and its size; it fails with a clear message when the container is not running.
- `yarn db:restore <file>` restores a backup into a new, empty database named `restore_check` (created, then dropped when `--drop` is given), never into the live database, and prints the number of rows of `coffees`, `orders`, and `order_items`.
- A drill, run once and written in the ADR: place an order, back up, restore into `restore_check`, and compare the counts with the live database (they are equal); the drill also names the time it took.
- `docs/RUNBOOK.md` has, in 40 lines or fewer: build, run, back up, restore, and the check of the counts.
- The commands the scripts run are built by pure functions with tests (the names, the arguments, the refusal to restore into the live database).
- `yarn code:fix`, `yarn lint`, `yarn types:check`, `yarn test`, `yarn test:e2e`, and `yarn build` pass; the images are not built by the QA commands or by the pipeline.

## What to do
- Write the script tests first, then the scripts, then the Dockerfiles and the proxy, then the runbook, then run the drill.
- Verify the current versions of the base images before pinning them.
- Keep the secrets out of the images: the API reads its settings from the environment.

## What not to do
- Do not choose a host, add a registry, push an image, or deploy.
- Do not add the images to the pipeline.
- Do not add TLS, a rate limit, or a retention job (spec 038 adds the limit to this proxy).
- Do not back up Grafana or add a backup schedule.

## Result
The product can be started from two images, and its orders can be backed up and restored, with a drill that proves it.

## Open questions
None
