# ADR: App foundation

- Status: Accepted
- Date: 2026-11-04
- Spec: [.specs/012-app-foundation.md](../.specs/012-app-foundation.md)
- Plan: [plans/012-app-foundation-plan.md](../plans/012-app-foundation-plan.md)

## Context

The screen specs (016 onward) need a running React app with routing, server-state handling, a typed API client, and unit and browser tests, all wired to the root QA commands.

## Decisions

1. **Versions** (looked up on the npm registry on 2026-11-04, pinned exactly, no ranges): React 19.3.1, Vite 8.3.5, TypeScript 7.0.2, Vitest 5.1.0, React Router 8.5.1, TanStack Query 5.106.0, Playwright 1.64.1. Node 22.12 or newer, the minimum of Vite.
2. **`apps/app` is the only Yarn workspace.** It defines `dev`, `build`, `types:check`, `test`, and `test:e2e`. Lint and format stay at the root (`oxlint`, `oxfmt`), so the runner skips the app for `lint` and `code:fix` and says so.
3. **React Router in data mode.** One route table in `src/app/routes.tsx`; the browser router is created in `main.tsx`, tests render the same table with a memory router.
4. **Own API client over `fetch`**, no HTTP library. `ApiError` carries `status`, `code`, `message`, and `fields`. A network failure maps to status `0` and code `network_error`; an error body outside the project's shape maps to `unexpected_error`. Aborts are rethrown so TanStack Query can cancel.
5. **Query retry policy.** No retry for 4xx `ApiError` (the request is wrong, retrying cannot help); other failures retry at most twice.
6. **Vite proxy instead of CORS.** `/api` goes to `http://localhost:3000`; port 5173 with `strictPort`, so a busy port is an error and not a silent change of address.
7. **Strict TypeScript** with `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, and `verbatimModuleSyntax`.
8. **Tests.** Vitest with jsdom and Testing Library for the client, routes, providers, `index.html`, and the Vite config. One Playwright smoke test needs no API. `playwright.config.ts` starts the dev server and accepts `PLAYWRIGHT_CHROMIUM_PATH` for a system Chromium.
9. **`.mcp.json`** registers the Playwright MCP server pinned to `@playwright/mcp@0.0.84`, with no environment values, so Claude Code can open the app and take screenshots.
10. **Root guard test** (`scripts/app-config.test.mjs`): workspace and `app:dev`, scripts the runner calls, exact version pins, strict mode, `.mcp.json` without secrets, and no hex color in pages.

## Consequences

- A developer runs `yarn install` and, once, `yarn --cwd apps/app playwright install chromium` before `yarn test:e2e`.
- The pages are placeholders (a heading each); the screen specs replace them. Colors and fonts arrive with spec 013, which is why pages carry no styling yet.
- TypeScript 7 and Vite 8 are recent majors; the tests and the build passed in the workspace on these exact versions.
- `@playwright/mcp` is fetched by `npx` the first time Claude Code starts it.
