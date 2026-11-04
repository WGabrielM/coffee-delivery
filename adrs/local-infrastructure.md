# ADR: Local infrastructure

- Status: Accepted
- Date: 2026-11-04
- Spec: [.specs/002-local-infrastructure.md](../.specs/002-local-infrastructure.md)
- Plan: [plans/002-local-infrastructure-plan.md](../plans/002-local-infrastructure-plan.md)

## Context

The API (spec 003) needs PostgreSQL, and the observability work (specs 003 and 008) needs an OpenTelemetry collector and Grafana. A developer must get both with one command and the same result on every machine. The API and the app run on the host, not in containers.

## Decisions

1. **Two services, pinned.** `postgres:18.6-alpine` and `grafana/otel-lgtm:0.39.0`, the latest releases on 2026-11-04. No `latest` tag; a test fails if one appears. A version bump is a deliberate edit of `compose.yaml`.
2. **PostgreSQL 18 data path.** The named volume `postgres-data` is mounted at `/var/lib/postgresql`, where PostgreSQL 18 images keep their data (older images used `/var/lib/postgresql/data`). Mounting the old path would hide the data from the volume.
3. **No defaults in the Compose file.** `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_PORT` are required (`${VAR:?message}`) and come from `.env.local`. `.env.example` is the only place with the development values, and it states they are for local development only.
4. **Localhost only.** Every published port is bound to `127.0.0.1`. This keeps the database and the anonymous-admin Grafana off the network.
5. **Health checks and `--wait`.** `pg_isready` for PostgreSQL. For Grafana LGTM, a `bash` check on `/api/health` and on ports 4317 and 4318, so it does not rely on `curl` being present in the image. `yarn infra:up` uses `docker compose up --detach --wait`, which returns only when both are healthy.
6. **`env:setup` is a Node script.** It copies `.env.example` to `.env.local` only when the target does not exist, the same way on Windows, macOS, and Linux, and has unit tests. `infra:up` and `infra:down` run it first, so they work on a fresh clone; running it again is harmless.
7. **`infra:down` keeps the data.** It never passes `--volumes`. Deleting the database is a documented manual command.
8. **No Grafana volume.** Dashboards are provisioned from files (spec 008), so telemetry data is allowed to disappear on `infra:down`.
9. **Docker is checked in tests only when present.** Two tests run `docker compose config` and are skipped when Docker is not installed; the other tests read the files directly and need nothing.

## Consequences

- A developer needs Docker with Compose v2.
- The runtime behavior (healthy start, data surviving `infra:down` and `infra:up`) cannot be asserted by the unit tests; it is checked by hand and listed in the end-of-task report. The CI spec (030) can add a job that starts the stack.
- The Grafana image tag and the PostgreSQL major version are part of the contract with specs 003 and 008: changing either needs a new ADR note.
