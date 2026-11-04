# App: end-to-end happy path

## Scope
@apps/app/e2e/happy-path.spec.ts - New; browse, filter, add, check out, confirm
@apps/app/e2e/checkout-validation.spec.ts - New; blocked and failed submissions
@apps/app/e2e/accessibility.spec.ts - New; axe scan of every screen
@apps/app/playwright.config.ts - Start the API and the app for e2e runs
@package.json - `test:e2e` runs the API e2e tests and the Playwright tests
@.docs/QA.md - Document the e2e prerequisites and how to run them

## Context
Part of: Coffee Delivery capstone.
Depends on: @.specs/026-order-success-page.md
Until now each screen has tests with a mocked API and a few Playwright checks. The product is complete only if the real app, API, and database work together. These tests need Postgres from `yarn infra:up`. The sample amounts come from the design: Latte × 2 and Traditional Espresso × 1 give $29.70 in items, $3.50 delivery, and $33.20 total.

## Business needs
The main purchase flow is proven end to end, on every change, against the real services.

## Acceptance Criteria
- The happy-path test: opens `/`; selects the chips Special and Iced and sees one card (Cuban), then clears the filters and sees 14 cards; adds Latte with quantity 2 and Traditional Espresso with quantity 1, and sees the badge "3"; opens the cart; sees "Items total" $29.70, "Delivery" $3.50, and "Total" $33.20; fills the design sample address; selects credit card; confirms; and lands on `/orders/<uuid>`.
- On the confirmation page the test sees "Uhu! Order confirmed", the street and number, "20 min - 30 min", and "Credit card", sees an empty cart badge, reloads the page and sees the same content, and the stored order read from `GET /api/v1/orders/<uuid>` has `totalInCents` `3320`.
- The validation test confirms an empty form and sees the field errors and no `POST` request; it also removes a coffee from the cart on the checkout page and sees the totals update; and it sets the cart to a random unknown coffee id in `localStorage` and sees the cart cleaned and the empty state.
- The accessibility test scans Home, Home with a filter, Checkout (empty cart and with items), and the Confirmation page and finds no violations of impact `critical` or `serious`.
- `yarn test:e2e` starts the API and the app by itself when they are not running (and reuses them when they are), fails with a clear message if Postgres is unreachable, and leaves no test process running.
- `yarn code:fix`, `yarn lint`, `yarn types:check`, `yarn test`, `yarn test:e2e`, and `yarn build` pass.

## What to do
- Write the tests against the real API. If one fails because of a product bug, fix the bug in the smallest place and list it in the end-of-task report.
- Add `@axe-core/playwright` after verifying the current version.

## What not to do
- Do not mock the API in these tests.
- Do not delete orders from the database after tests; the tests only read their own orders.
- Do not add cross-browser runs; Chromium is enough.
- Do not test visual details; spec 029 does.

## Result
One command proves that a visitor can browse, filter, order, and see the confirmation, with no serious accessibility violations on any screen.

## Open questions
None
