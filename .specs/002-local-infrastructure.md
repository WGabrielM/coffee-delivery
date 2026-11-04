# Local infrastructure: Postgres and Grafana

## Scope
@compose.yaml - New; services `postgres` and `grafana` (Grafana LGTM image)
@.env.example - New; development-only values, no real secrets
@package.json - Scripts `env:setup`, `infra:up`, `infra:down`, `local:setup`
@.docs/DEVELOPMENT.md - Document the local setup, ports, and credentials policy
@.docs/ARCHITECTURE.md - Add the infrastructure section

## Context
Part of: Coffee Delivery capstone.
Depends on: @.specs/001-foundation.md
The API (spec 003) needs PostgreSQL, and the observability stack needs an OpenTelemetry collector and Grafana. The mold runs both through Docker Compose with these ports: Postgres 5432, Grafana 3030, OTLP gRPC 4317 and OTLP HTTP 4318. Nothing runs locally yet.

## Business needs
A developer gets the database and the observability stack with one command, and gets the same result on every machine.

## Acceptance Criteria
- `yarn env:setup` creates `.env.local` from `.env.example` and does not overwrite an existing `.env.local`.
- `yarn infra:up` starts `postgres` (port 5432) and `grafana` (port 3030, OTLP on 4317 and 4318) and returns only when both report healthy; `pg_isready` succeeds and `GET http://localhost:3030/api/health` returns `200`.
- After `yarn infra:down` followed by `yarn infra:up`, data written to Postgres before `infra:down` is still there (named volume); `infra:down` removes containers and keeps the volume.
- `yarn local:setup` runs install, `env:setup`, and `infra:up` in that order and exits `0` when run a second time.
- Image tags in `compose.yaml` are explicit versions (no `latest`), and `.env.example` documents that its values are for local development only.
- The QA commands from spec 001 still pass.

## What to do
- Verify the current stable tags for the Postgres image and the Grafana LGTM image before pinning them.
- Add health checks to both services and make `infra:up` wait for them.
- Read database name, user, password, and port from `.env.local` through Compose variables.
- Document the commands, ports, and how to reset the database volume in `.docs/DEVELOPMENT.md`.

## What not to do
- Do not run the API or the app in containers.
- Do not add Redis, a message broker, or any service the plan does not use.
- Do not commit `.env.local`.
- Do not provision Grafana dashboards; spec 008 does.

## Result
`yarn local:setup` brings up Postgres and Grafana LGTM on the documented ports, and the data survives restarts.

## Open questions
None
