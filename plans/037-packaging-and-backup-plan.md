# Plan 037: Packaging, container images and a tested database backup

- Number: 037
- Created: 2026-11-10
- Spec: [.specs/037-packaging-and-backup.md](../.specs/037-packaging-and-backup.md)

## Concept summary

The spec has no open question. Choices, each recorded in `adrs/packaging-and-backup.md`:

1. **Two multi-stage images, base images pinned and checked to exist** (`docker manifest inspect`): `eclipse-temurin:21.0.13_9-jdk-alpine` and `-jre-alpine`, `node:22.22.2-alpine` (the Node of CI), `nginx:1.30.6-alpine` (the stable line). The API runs as a non-root user; no secret is in an image.
2. **The app image is built from the root of the repository**, because the yarn lock file is there. Its ignore rules are `apps/app/Dockerfile.dockerignore` (BuildKit reads the file named after the Dockerfile), not `apps/app/.dockerignore`, which would only apply to a context inside `apps/app`.
3. **`POSTGRES_HOST` is a new optional setting** of the API (default `localhost`), so the same settings of `.env.example` work in a container; `compose.packaged.yaml` sets it to `postgres`.
4. **`compose.packaged.yaml` is merged with `compose.yaml`** by the `docker:*` scripts; the API has no host port, so it does not clash with `yarn api:dev`.
5. **Backup and restore through the container, with pure planners.** `pg_dump` runs in the postgres container (the password stays there); the restore goes only into `restore_check` (recreated each time), from stdin with `pg_restore --exit-on-error`, and the script prints the counts of the copy and of the live database. The commands are built by functions with tests.
6. **A drill on the real database**, with its time, in the ADR.

## Tasks

| # | Task | Files | Check |
| --- | --- | --- | --- |
| 1 | Script tests first | `scripts/db-backup.test.mjs` | Names, arguments, refusal, pinned images, proxy rules |
| 2 | Backup and restore scripts | `db-backup.mjs`, `db-restore.mjs`, `package.json`, `.gitignore` | Tests; a real run |
| 3 | Images and proxy | the two `Dockerfile`s, ignore files, `nginx.conf`, `compose.packaged.yaml`, `application.yaml` | Build; start; health; stop |
| 4 | Drill | order, backup, restore, counts | Equal; time written |
| 5 | Runbook and docs | `docs/RUNBOOK.md`, `.docs/*`, `README.md` | At most 40 lines |
| 6 | ADR, plan, PLAN.md | | |
| 7 | Six QA commands | | Green; no image is built by them |

## New dependencies

None.

## QA steps and risks

- QA: the six commands; the images are built and run by hand (about 4 minutes the first time).
- Risk: on Windows, a child process started through a shell loses the quotes of the SQL; the scripts start `docker` directly.
