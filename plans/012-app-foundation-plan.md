# Plan 012: app foundation

- Number: 012
- Created: 2026-11-04
- Spec: [.specs/012-app-foundation.md](../.specs/012-app-foundation.md)

## Concept summary

No open question. The spec was approved on 2026-11-04. Choices made in this plan, each recorded in `adrs/app-foundation.md`:

1. **Versions** (looked up on the npm registry on 2026-11-04, pinned exactly): React 19.3.1, Vite 8.3.5, TypeScript 7.0.2, Vitest 5.1.0, React Router 8.5.1, TanStack Query 5.106.0, Testing Library, Playwright 1.64.1. Node 22.12 or newer (Vite's minimum).
2. **One workspace, no app-level lint scripts.** `apps/app` is the Yarn workspace declared in the root `package.json`. Lint and format come from the root `oxlint` and `oxfmt` (they already cover `apps/app`), so the app defines only `dev`, `build`, `types:check`, `test`, and `test:e2e`; the root runner skips the app for `code:fix` and `lint` and says so.
3. **Router in data mode** (`createBrowserRouter`), with the route table in one file that tests render with a memory router. Pages live in `src/pages`, features in `src/features` (empty until the screen specs), the API client in `src/api`.
4. **API client**: `apiGet` and `apiPost` over `fetch`, base path `/api/v1`, errors as `ApiError` (`status`, `code`, `message`, `fields`). A network failure becomes `ApiError` with status `0` and code `network_error`; an error response that is not in the project's shape becomes `unexpected_error`.
5. **Vite dev server** on 5173 with a proxy from `/api` to `http://localhost:3000`, so the API needs no CORS.
6. **Tests**: Vitest with jsdom and Testing Library for the client, the routes, the pages, `index.html`, and the Vite config; one Playwright smoke test that opens `/` and checks the title, with no API running. The Playwright config can use a system Chromium through `PLAYWRIGHT_CHROMIUM_PATH`, and starts the dev server itself.
7. **`.mcp.json`** registers the Playwright MCP server (no secrets), pinned to a version.
8. **Strict TypeScript** with `noUncheckedIndexedAccess`; `yarn types:check` runs `tsc --noEmit`.

## Tasks

Each task starts with its test.

| # | Task | Test first |
| --- | --- | --- |
| 1 | API client and `ApiError` | `src/api/client.test.ts`: 2xx parsed body, 204, error shape to `ApiError`, non-conforming error body, network failure, JSON body and headers on POST |
| 2 | Routes and pages | `src/app/routes.test.tsx`: `/`, `/checkout`, `/orders/abc`, and an unknown path with its link to `/` |
| 3 | Document | `src/app/document.test.ts`: `lang="en"` and title "Coffee Delivery" in `index.html` |
| 4 | Vite config | `src/app/vite-config.test.ts`: port 5173 and the `/api` proxy |
| 5 | Providers | `src/app/providers.test.tsx`: the Query client is available to children |
| 6 | Scaffold | `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/main.tsx` |
| 7 | Playwright | `e2e/smoke.spec.ts` and `playwright.config.ts` |
| 8 | Root | `app:dev` script, `.mcp.json`, `scripts/app-config.test.mjs` |
| 9 | Docs | `.docs/*`, `README.md`, `docs/PLAN.md` |

## New dependencies

| Package | Why |
| --- | --- |
| `react`, `react-dom` | UI |
| `react-router` | Three routes and the not-found page |
| `@tanstack/react-query` | Server state, as the design requires |
| `vite`, `@vitejs/plugin-react` | Dev server and build |
| `typescript`, `@types/react`, `@types/react-dom`, `@types/node` | Strict types |
| `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `@testing-library/dom` | Unit and component tests |
| `@playwright/test` | End-to-end smoke test |
