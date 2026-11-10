# ADR: Packaging, container images and a tested database backup

- Status: Accepted and verified
- Date: 2026-11-10
- Spec: [.specs/037-packaging-and-backup.md](../.specs/037-packaging-and-backup.md)
- Plan: [plans/037-packaging-and-backup-plan.md](../plans/037-packaging-and-backup-plan.md)

## Context

The API and the app ran only from source on the machine of the developer. Nothing had a Dockerfile, and nothing backed up the orders (which hold addresses) or proved that a backup can be restored. The evolution review of 2026-11-08 called this the gate for any real user. The choice of a host and the deployment are the owner's decision and are not part of this spec.

## Decisions

1. **API image** (`apps/api/Dockerfile`): stage 1 `eclipse-temurin:21.0.13_9-jdk-alpine` runs `./gradlew bootJar -x test`; stage 2 `eclipse-temurin:21.0.13_9-jre-alpine` runs the jar as the user `app` (uid 100), exposes 3000, and has a health check on `/actuator/health`. Settings come from the environment variables of `.env.example`; no secret is in the image. `POSTGRES_HOST` (default `localhost`) is new in `application.yaml`, because the database host was fixed to `localhost`.
2. **App image** (`apps/app/Dockerfile`): `node:22.22.2-alpine` (the Node of CI) runs `yarn install --frozen-lockfile --ignore-scripts` and `vite build`; `nginx:1.30.6-alpine` (the stable line) serves it on port 80. `nginx.conf` sends `/api/` to `http://api:3000`, answers unknown paths with `index.html` (`try_files`), sets `Cache-Control: public, max-age=31536000, immutable` on `/assets/` (hashed files), and `no-cache` on `index.html`. The build context is the root of the repository, because the lock file is there, so the ignore rules are in `apps/app/Dockerfile.dockerignore` (BuildKit reads the file named after the Dockerfile) and not in `apps/app/.dockerignore`.
3. **Pinned bases**: every tag was checked with `docker manifest inspect` before it was written, and a script test fails on a `FROM` that is not an exact version or is `latest`, and on an API image with no `USER`.
4. **`compose.packaged.yaml`** adds `api` and `app` to the `postgres` of `compose.yaml` (the scripts merge the two files). The app is published on `127.0.0.1:8080`; the API has no host port, so it does not clash with `yarn api:dev` on 3000. `yarn docker:down` stops the API and the app and leaves the database up. The images are not built by the QA commands or the pipeline.
5. **Backup**: `yarn db:backup` runs `pg_dump --format=custom` in the postgres container, so the password never leaves it and no client has to be installed, writes `backups/<database>-<date>.dump` (ignored by Git) and prints the size; it fails with "The postgres container is not running" when the service is down.
6. **Restore**: `yarn db:restore <file> [--drop]` recreates a database called `restore_check` (it is a scratch name, so an old one is dropped first), restores the file from stdin with `pg_restore --exit-on-error --no-owner`, and prints the counts of `coffees`, `orders`, and `order_items` of the copy next to those of the live database (read only). It refuses to run when the live database is called `restore_check`, never writes to the live database, and with `--drop` drops the copy at the end. Overwriting the live database is left to a manual step in the runbook, on purpose.
7. **Pure planners with tests** (`scripts/db-backup.test.mjs`, 16 tests): the file name, the arguments of every step, the absence of the password, the refusal for the live name and for a missing file or setting, the counts parser, the package scripts, the pinned images, the proxy rules, the compose file, and the 40-line limit of the runbook. The scripts start `docker` directly, not through a shell, because on Windows a shell lost the quotes of the SQL (found by the first real run).

## Verified (2026-11-10)

- `yarn docker:build`: both images built (4 min 9 s the first time, Gradle download included). Sizes: API 350 MB, app 94.7 MB.
- `yarn docker:up`: the API and the app became `healthy`; `GET http://localhost:8080/` answered 200 with `Cache-Control: no-cache`; `/checkout` answered 200 with `index.html` (`no-cache`); a hashed file of `/assets/` answered with `public, max-age=31536000, immutable`; `GET /api/v1/coffees` through the proxy returned the 14 coffees; `id` in the API container is `uid=100(app)`; an order posted through port 8080 with an `Idempotency-Key` answered `201`. `yarn docker:down` stopped both (port 8080 then refused connections).
- **Drill**, on the dev database (almost all of its orders come from load tests): an order was placed through the app, `yarn db:backup` wrote `backups/coffee_delivery-2026-11-10T13-57-47Z.dump` (1,056,322 bytes) in 1.1 s, and `yarn db:restore <file>` restored it into `restore_check` in 1.8 s: **coffees 14, orders 12,456, order_items 24,198 in the copy and in the live database, equal.** With `--drop` the copy was dropped again (`restore_check` no longer in `pg_database`). `yarn db:restore` with no file exits 2 with the usage, and a missing file exits 1.

## Consequences

- Whoever runs the product can start it from two images and recover the orders from a dump; the dump holds addresses, so `backups/` stays private and ignored.
- There is no schedule, retention, registry, TLS, rate limit, or deployment (the next specs and the owner's choice of a host).
- The first Gradle build in an image downloads the Gradle distribution; the layers are cached until the build files change.
