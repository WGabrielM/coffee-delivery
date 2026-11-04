# Coffee Delivery

A coffee store with a React app and a Java Spring Boot API, rebuilt from a Figma design as the capstone of the Applied AI postgraduate module (Coders University). It is built with AI, spec by spec, following the workflow in [`.docs/`](.docs/AGENTS.md).

Status: under construction. The roadmap is in [`docs/PLAN.md`](docs/PLAN.md) and the work is queued in [`.specs/`](.specs). Specs 001 (foundation) and 002 (local infrastructure) are done; the complete README arrives with spec 031.

## Start

Requirements: Node.js 22 or newer and Yarn 1 (`corepack enable`). Docker (Compose v2) is needed for the local database and Grafana; a Java LTS is needed from spec 003.

```bash
yarn local:setup   # install, create .env.local, start PostgreSQL and Grafana
yarn lint
yarn test
```

`yarn install` installs the Git hooks (commitlint and lint-staged) and links the Claude Code skills. The QA commands are `yarn code:fix`, `yarn lint`, `yarn types:check`, `yarn test`, `yarn test:e2e`, and `yarn build`; see [`.docs/QA.md`](.docs/QA.md).

## Where things are

| Path | What |
| --- | --- |
| `.docs/` | Rules, product, architecture, conventions, development, design, and QA |
| `.specs/` | The 31 specs, one action each |
| `plans/`, `adrs/` | One plan before each spec and one decision record after it |
| `docs/` | The roadmap and the Figma analysis |
| `apps/api`, `apps/app` | The API and the app (planned, from specs 003 and 012) |
