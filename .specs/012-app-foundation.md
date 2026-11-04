# App: foundation

## Scope
@apps/app - New; React, TypeScript, and Vite project
@apps/app/index.html - New; `lang="en"` and the title "Coffee Delivery"
@apps/app/src/main.tsx, @apps/app/src/app - New; providers and router
@apps/app/src/pages - New; placeholder pages for the three routes and a not-found page
@apps/app/src/api - New; typed fetch client and `ApiError`
@apps/app/vite.config.ts - New; dev server on 5173 and a proxy from `/api` to `http://localhost:3000`
@apps/app/playwright.config.ts, @apps/app/e2e - New; Playwright setup and one smoke test
@.mcp.json - New; Playwright MCP server, no secrets
@package.json - Scripts `app:dev`; the root tasks now run the app
@.docs/ARCHITECTURE.md, @.docs/DEVELOPMENT.md, @.docs/QA.md - Document the app layout and commands

## Context
Part of: Coffee Delivery capstone.
Depends on: @.specs/003-api-foundation.md
The app is a single-page React app with three routes: the home page (`/`), the checkout (`/checkout`), and the order confirmation (`/orders/:orderId`). It reads server state with TanStack Query and calls the API through the Vite proxy, so the API needs no CORS settings. Versions of Node, React, Vite, and every library are verified when scaffolding.

## Business needs
The team has a running, tested, type-checked app shell where each screen spec adds one page without redoing tooling.

## Acceptance Criteria
- `yarn app:dev` serves the app on port 5173; `/` renders a page with the heading "Coffee Delivery", `/checkout` and `/orders/abc` render their placeholder pages, and an unknown path renders a not-found page with a link to `/`.
- The document has `lang="en"` and the title "Coffee Delivery".
- With the API running, a request to `/api/v1` from the app origin returns the API info through the proxy.
- The API client has unit tests: a `2xx` response returns the parsed body; a response in the error shape `{ "error": { "code", "message", "fields" } }` throws an `ApiError` carrying `status`, `code`, `message`, and `fields`; a network failure throws an `ApiError` with code `network_error`.
- TypeScript runs in strict mode and `yarn types:check` runs `tsc --noEmit` for the app.
- `yarn test` runs the Vitest tests of the API and the app; `yarn test:e2e` also runs a Playwright test that opens `/` and checks the title, without the API running.
- `yarn code:fix`, `yarn lint`, `yarn types:check`, `yarn test`, `yarn test:e2e`, and `yarn build` pass.

## What to do
- Write the tests first, then scaffold the app and wire the formatter, the linter, Vitest with Testing Library, and Playwright.
- Use `oxlint` and `oxfmt` from the root (spec 001) for the app, adding only the React and accessibility settings the app needs.
- Register the Playwright MCP server in `.mcp.json` so later specs can take screenshots as the mold does.
- Add the TanStack Query provider and the router, with pages in `src/pages` and features in `src/features`.

## What not to do
- Do not add Tailwind, fonts, or colors; spec 013 does.
- Do not build any real screen content.
- Do not add a global state library; the cart arrives in spec 020.
- Do not add server-side rendering.

## Result
`yarn app:dev` serves a typed, tested React shell with three routes, a not-found page, and an API client that understands the project's error format.

## Open questions
None
