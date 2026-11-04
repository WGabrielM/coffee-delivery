# Plan 002: local infrastructure

- Number: 002
- Created: 2026-11-04
- Spec: [.specs/002-local-infrastructure.md](../.specs/002-local-infrastructure.md)

## Concept summary

No open question. The spec was approved on 2026-11-04. Choices made in this plan, each recorded in `adrs/local-infrastructure.md`:

1. **Images and pins.** `postgres:18.6-alpine` and `grafana/otel-lgtm:0.39.0`, the latest releases found on 2026-11-04 (PostgreSQL 18.6 from 11 Aug 2026, `docker-otel-lgtm` 0.39.0 from 30 Oct 2026). PostgreSQL 18 images keep data under `/var/lib/postgresql`, so the named volume is mounted there, not at `/var/lib/postgresql/data`.
2. **Variables.** `compose.yaml` reads `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_PORT` from `.env.local` and fails with a clear message when one is missing; there are no defaults in the Compose file, so `.env.example` is the single source of the development values.
3. **Ports are bound to `127.0.0.1`.** The database and Grafana are for the developer's machine only; Grafana runs with the image's anonymous admin access.
4. **Health checks.** PostgreSQL uses `pg_isready`. Grafana LGTM uses a `bash` check on `/api/health` (port 3000 inside the container) and on the two OTLP ports, so it does not depend on `curl` being in the image. `docker compose up --wait` returns only when both are healthy.
5. **Scripts.** `env:setup` is a small Node script (`scripts/env-setup.mjs`) so it behaves the same on Windows, macOS, and Linux and can be tested. `infra:up` and `infra:down` run `env:setup` first and then Docker Compose with `--env-file .env.local`. `local:setup` chains `yarn install`, `env:setup`, and `infra:up`.
6. **Volume.** `infra:down` never passes `--volumes`; resetting the database is a documented manual command.
7. **Grafana keeps no volume.** Dashboards are provisioned from files (spec 008), so losing Loki, Tempo, and Prometheus data on `infra:down` is accepted.

## Tasks

Each task starts with its test. Tests use Node's built-in runner.

| # | Task | Files | Test first |
| --- | --- | --- | --- |
| 1 | `env:setup` | `scripts/env-setup.mjs`, `.env.example` | `scripts/env-setup.test.mjs`: creates `.env.local` from `.env.example`; keeps an existing `.env.local` byte for byte; fails with a clear message when `.env.example` is missing |
| 2 | Compose file | `compose.yaml` | `scripts/local-infra.test.mjs`: two services, explicit image versions (no `latest`), health checks, the named volume at `/var/lib/postgresql`, ports bound to `127.0.0.1`, no `.env.local` value written in the file; `docker compose config` accepts it when Docker is installed |
| 3 | Env example | `.env.example` | same file: every variable the Compose file reads is in `.env.example`; the file says its values are for local development only |
| 4 | Package scripts | `package.json` | same file: `env:setup`, `infra:up`, `infra:down`, `local:setup` exist; `infra:down` has no `--volumes`; `local:setup` runs install, `env:setup`, `infra:up` in that order |
| 5 | Documentation | `.docs/DEVELOPMENT.md`, `.docs/ARCHITECTURE.md`, `.docs/QA.md`, `README.md`, `docs/PLAN.md` | the foundation test that scans the documents for the mold's stack still passes; the document map still links all nine |
| 6 | Verify | six QA commands; `docker compose config`; the manual runtime steps below | Acceptance criteria of the spec, one by one |

## Verification limit

The workspace where this plan was executed has the Docker client but no Docker daemon and no access to Docker Hub, so the containers cannot be started there. Static checks (`docker compose config`, the tests above) run in the workspace. The runtime criteria (healthy start, `pg_isready`, `GET /api/health`, data surviving `infra:down` and `infra:up`, second `local:setup`) are manual QA steps for the developer's machine and are listed in the end-of-task report.

## New dependencies

None.
