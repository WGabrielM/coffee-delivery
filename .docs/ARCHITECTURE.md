# Architecture

Status markers: `[implemented]` exists in the repository; `[planned]` is queued in `.specs/`. Never treat a `[planned]` item as installed. Versions are checked against the registries when each part is scaffolded; this document records the choice, not a version number.

## Tech stack

| Part | Choice | Status |
| --- | --- | --- |
| Package manager and scripts | Yarn 1 (root `package.json`), `scripts/run-task.mjs` runs each root task in every workspace | `[implemented]` |
| Lint and format (JavaScript, TypeScript, JSON, CSS) | `oxlint` and `oxfmt` | `[implemented]` |
| Git hooks | Lefthook: `pre-commit` runs lint-staged, `commit-msg` runs commitlint (Conventional Commits) | `[implemented]` |
| Local infrastructure | Docker Compose: PostgreSQL 18 and Grafana LGTM, versions pinned in `compose.yaml` | `[implemented]` |
| API | Java 21 or newer and Spring Boot 4.1, built with Gradle 9 (wrapper), in `apps/api` | `[implemented]` |
| Database | PostgreSQL; schema and seed by Flyway migrations `V1` to `V3` (Flyway runs at startup) | `[implemented]` (specs 003 to 009) |
| API formatting | Spotless with google-java-format | `[implemented]` |
| API tests | JUnit 5 and AssertJ; `test` is unit tests without Docker, `e2eTest` is Spring Boot with Testcontainers; ArchUnit; JaCoCo (minimum 80% line coverage over both) | `[implemented]` |
| Observability | Structured JSON logs, OpenTelemetry (Micrometer) traces and metrics to Grafana LGTM, and the `Coffee Delivery API` dashboard as code in `infra/grafana` (spec 008). Logs stay on stdout: nothing ships them to Loki | `[implemented]` |
| Load tests | k6, one scenario per endpoint, profiles `smoke`, `load`, `stress`, `spike`, and `soak` in `apps/api/load` (see its README) | `[implemented]` |
| App | React 19, TypeScript (strict), Vite, React Router (data mode), TanStack Query, React Hook Form with Zod (the checkout form, spec 023), in `apps/app` | `[implemented]` (foundation, spec 012) |
| Styling | Tailwind CSS 4 with the Figma tokens as its only theme (`src/styles/theme.css`); fonts Roboto and Baloo 2 self-hosted with Fontsource | `[implemented]` (spec 013) |
| App tests | Vitest with jsdom and Testing Library; `axe-core` through `src/test/axe.ts` for every component (color contrast is off in jsdom and checked by calculation); Playwright | `[implemented]` (spec 012; axe in spec 015) |
| CI | GitHub Actions (`.github/workflows/ci.yml` and `commitlint.yml`) and `yarn ci` | `[implemented]` (spec 030) |

## Ports

| Service | Port |
| --- | --- |
| API | 3000 |
| App (Vite dev server) | 5173 |
| PostgreSQL | 5432 |
| Grafana | 3030 |
| OpenTelemetry (gRPC, HTTP) | 4317, 4318 |

Compose binds every published port to `127.0.0.1`, so the database and Grafana are reachable only from the developer's machine.

The app calls the API through the Vite dev proxy (`/api` to `http://localhost:3000`), so the API needs no CORS settings.

## Local infrastructure `[implemented]`

`compose.yaml` runs two services and nothing else; the API and the app run on the host.

| Service | Image | Data | Health check |
| --- | --- | --- | --- |
| `postgres` | `postgres:18.6-alpine` | Named volume `postgres-data` (kept by `yarn infra:down`) | `pg_isready` |
| `grafana` | `grafana/otel-lgtm:0.39.0` (Grafana, Loki, Tempo, Prometheus, OpenTelemetry collector) | None; the `Coffee Delivery API` dashboard is provisioned from `infra/grafana` (read only mounts) | `/api/health` and the two OTLP ports |

Database name, user, password, and port come from `.env.local`; the Compose file has no defaults for them. Image versions are pinned and are changed on purpose, in `compose.yaml`, with a note in the ADR.

## Repository layout

```
apps/
  api/            [implemented] Spring Boot API (Gradle)
  app/            [implemented] React app (Vite)
.agents/skills/   [implemented] workflow skills (linked into .claude/skills)
.claude/          [implemented] agents and commands
.docs/            [implemented] the documentation hub
.specs/           [implemented] specs to implement
plans/            [implemented] one plan per spec execution
adrs/             [implemented] one ADR per decision
docs/             [implemented] PLAN.md (the roadmap and its results), CAPSTONE.md (the capstone report), and design/ (the Figma analysis, the asset mapping, the contact sheet of the coffee photos)
infra/            [implemented] Grafana provisioning and dashboards
scripts/          [implemented] the scripts behind the root commands and their tests: `run-task.mjs`, `ci.mjs`, `api-dev.mjs`, `load.mjs`, `env-setup.mjs`, `env-file.mjs` (reads `.env.local` for the others), `link-skills.mjs`, `check-postgres.mjs`, `lighthouse-home.mjs`, and the Figma tools (`extract-figma-assets.mjs`, `cut-figma-references.mjs`, `lib/`)
screenshots/      [implemented] the screenshots taken for each UI spec (`<page>_<viewport>_after.png`)
.github/          [implemented] the workflows `ci.yml` and `commitlint.yml`
compose.yaml      [implemented] PostgreSQL and Grafana LGTM
.env.example      [implemented] development values; `yarn env:setup` copies it to .env.local (ignored by Git)
```

The root package only orchestrates scripts and Git hooks; each app owns its own build.

## API architecture `[implemented]`

The API is organized as vertical slices by domain, and each slice has four layers (see [DEVELOPMENT.md](DEVELOPMENT.md)):

```
apps/api/src/main/java/com/coffeedelivery/
  catalog/       coffees and tags
  orders/        checkout configuration and orders
  system/        API information
  shared/        error handling and common configuration
```

Each slice (`catalog`, `orders`, `system`) has the packages `domain`, `application`, and `interfaces`, and `infrastructure` when it talks to the database (`system` does not). The fourth layer is `interfaces`, not `interface`, because `interface` is a reserved word in Java and cannot be a package name. `shared` holds the error handling (`shared.error`), the request logging (`shared.logging`), and the clock (`shared.config`).

- `domain` has entities and rules and depends on nothing but the language. `application` has the use cases (`<Action>UseCase.execute`) and the ports they need. `infrastructure` implements the ports (database access). `interfaces` has the request handlers (`<Action>RequestHandler.handle`, one per endpoint) and the HTTP mapping.
- Slices do not use each other's `infrastructure` or `interfaces`. `orders` reads coffee prices through its own `CoffeePriceLookup` port, not through `catalog` classes.
- `ArchitectureTest` (ArchUnit) enforces these rules and fails the build when one is broken.

## Endpoints

| Method and path | Spec | Purpose |
| --- | --- | --- |
| `GET /actuator/health` `[implemented]` | 003 | Health check |
| `GET /api/v1` `[implemented]` | 003 | API name and version |
| `GET /api/v1/coffees` (`?tags=`) `[implemented]` | 005, 006 | List coffees, optionally filtered by tags (AND logic) |
| `GET /api/v1/checkout-config` `[implemented]` | 007 | Currency, delivery fee, delivery estimate, payment methods |
| `POST /api/v1/orders` `[implemented]` | 010 | Create an order |
| `GET /api/v1/orders/{id}` `[implemented]` | 011 | Read an order |

### `GET /api/v1/coffees` `[implemented]`

Returns the whole catalog ordered by `position`. Every coffee has its tags in tag order. Prices are integer cents; the server sends no image (the app finds photos by `slug`).

```json
{
  "coffees": [
    {
      "id": "0c2a4a52-6a4f-4d0e-9d6e-5c1d3d2b9f10",
      "slug": "cuban",
      "name": "Cuban",
      "description": "Iced espresso drink with rum, cream and mint",
      "priceInCents": 990,
      "tags": [
        { "slug": "special", "name": "Special" },
        { "slug": "alcoholic", "name": "Alcoholic" },
        { "slug": "iced", "name": "Iced" }
      ]
    }
  ]
}
```

An empty catalog returns `{ "coffees": [] }`. Ids are generated by the database, so they differ between environments.

**Filter by tags** (`?tags=special,iced`, spec 006). The value is one comma-separated list of tag slugs (`traditional`, `special`, `with-milk`, `alcoholic`, `iced`); a coffee must have **all** of them (AND), and each result still carries all its tags. Spaces around slugs and empty elements are ignored, a repeated slug counts once, and a blank or missing `tags` lists everything. An unknown slug (slugs are case-sensitive) returns `400`:

```json
{
  "error": {
    "code": "validation_failed",
    "message": "The request has invalid fields.",
    "fields": { "tags": "Unknown tag: hot. Use: traditional, special, with-milk, alcoholic, iced." }
  }
}
```

Repeating the parameter (`?tags=a&tags=b`) is also a `400` with `fields.tags`: only the comma-separated form is supported. Expected results with the seed: traditional 9, special 5, with-milk 6, alcoholic 2, iced 2, special + alcoholic 2 (cuban, irish), special + iced 1 (cuban), traditional + alcoholic 0.

### `GET /api/v1/checkout-config` `[implemented]`

The checkout page reads the delivery fee, the estimate, and the payment methods from here instead of hard-coding them. The values come from `DeliveryPolicy` and `PaymentMethod` in the `orders` domain, the same rules the order total uses (spec 010); they are not read from the database or a flag, and they do not depend on the address, the cart, or the time.

```json
{
  "currency": "USD",
  "deliveryFeeInCents": 350,
  "estimatedDeliveryMinutes": { "min": 20, "max": 30 },
  "paymentMethods": ["credit_card", "debit_card", "cash"]
}
```

### `POST /api/v1/orders` `[implemented]`

Creates a confirmed order. The server prices it: it reads each coffee name and price from the catalog, computes the line totals, the subtotal, the fee (350 cents), and the total, and ignores any price sent by the client (a `priceInCents`, `unitPriceInCents`, or `totalInCents` anywhere in the body is an unknown property and is dropped). The order and its lines are stored in one transaction.

Request (`complement` is optional; text is trimmed; `quantity` must be a JSON whole number from 1 to 99; each coffee appears once):

```json
{
  "items": [
    { "coffeeId": "0c2a4a52-6a4f-4d0e-9d6e-5c1d3d2b9f10", "quantity": 1 },
    { "coffeeId": "7d1f6b3e-2f0a-4c55-8f7e-1a9b4c0d2e33", "quantity": 2 }
  ],
  "address": {
    "zipCode": "01310-100", "street": "Paulista Avenue", "number": "1000", "complement": "Apt 12",
    "neighborhood": "Bela Vista", "city": "Sao Paulo", "state": "SP"
  },
  "paymentMethod": "credit_card"
}
```

Response `201` with `Location: /api/v1/orders/{id}` (spec 011 returns the same body for that URL):

```json
{
  "id": "3b9f0c1e-5d2a-4e7b-9a41-0f6c8d7e2a15",
  "status": "confirmed",
  "items": [
    { "coffeeId": "0c2a4a52-6a4f-4d0e-9d6e-5c1d3d2b9f10", "name": "Latte", "quantity": 1, "unitPriceInCents": 990, "lineTotalInCents": 990 },
    { "coffeeId": "7d1f6b3e-2f0a-4c55-8f7e-1a9b4c0d2e33", "name": "Cuban", "quantity": 2, "unitPriceInCents": 990, "lineTotalInCents": 1980 }
  ],
  "address": {
    "zipCode": "01310-100", "street": "Paulista Avenue", "number": "1000", "complement": "Apt 12",
    "neighborhood": "Bela Vista", "city": "Sao Paulo", "state": "SP"
  },
  "paymentMethod": "credit_card",
  "subtotalInCents": 2970,
  "deliveryFeeInCents": 350,
  "totalInCents": 3320,
  "currency": "USD",
  "estimatedDeliveryMinutes": { "min": 20, "max": 30 },
  "createdAt": "2026-11-04T12:00:00.123456Z"
}
```

Errors: `400 validation_failed` with one entry in `fields` per problem, keyed by JSON path (`items`, `items[0].coffeeId`, `items[0].quantity`, `address.zipCode`, `address.state`, `paymentMethod`, ...; a value of the wrong JSON type is reported at its path); `422 unprocessable_content` with `fields.items` naming the ids that are not in the catalog; `405` for another method on `/api/v1/orders`.

### `GET /api/v1/orders/{id}` `[implemented]`

Returns the order exactly as it was confirmed: the same body as the `201` of `POST /api/v1/orders` (same `OrderResponse`). Amounts, names, and prices come from the stored snapshot, so a later catalog change never alters the answer. The order is a public resource addressed by an unguessable UUID, because the product has no accounts.

An id that does not exist returns `404` and `not_found`; an id that is not a UUID is also `404` `not_found` (to the client there is no such order):

```json
{ "error": { "code": "not_found", "message": "The requested resource was not found." } }
```

## Data model

Flyway applies the migrations in `apps/api/src/main/resources/db/migration` at startup. Ids are UUIDs generated by the database; money is `INTEGER` cents; every constraint has a name.

**Catalog** `[implemented]` (spec 004; migrations `V1__create_catalog_tables.sql` and `V2__seed_catalog.sql`):

| Table | Columns | Rules |
| --- | --- | --- |
| `tags` | `id`, `slug`, `name`, `position` | `slug` and `position` are unique |
| `coffees` | `id`, `slug`, `name`, `description`, `price_in_cents`, `position` | `slug` and `position` are unique; `price_in_cents` is greater than 0 |
| `coffee_tags` | `coffee_id`, `tag_id` | Composite primary key; foreign keys to both tables |

The seed has 5 tags and 14 coffees at 990 cents (the copy is in [BUSINESS.md](BUSINESS.md)). The database stores no image: the app finds photos by `slug`.

**Orders** `[implemented]` (spec 009; migration `V3__create_orders_tables.sql`). An order keeps a snapshot of what was sold, so a later catalog change never alters it. There is no user column: the product has no accounts.

| Table | Columns | Rules |
| --- | --- | --- |
| `orders` | `id` (UUID), `status`, `payment_method`, `zip_code`, `street`, `number`, `complement` (nullable), `neighborhood`, `city`, `state`, `subtotal_in_cents`, `delivery_fee_in_cents`, `total_in_cents`, `created_at` (`timestamptz`, default now) | `status` is only `confirmed`; `payment_method` is `credit_card`, `debit_card`, or `cash`; `state` is two uppercase letters; the subtotal and the fee are not negative; `total_in_cents` equals `subtotal_in_cents + delivery_fee_in_cents` |
| `order_items` | `id` (bigint identity), `order_id`, `coffee_id`, `coffee_name`, `unit_price_in_cents`, `quantity`, `line_total_in_cents` | `order_id` references `orders` (deleted with it); `coffee_id` references `coffees` (deleting a coffee that was ordered fails); one line per coffee in an order; `quantity` is 1 to 99; the unit price is not negative; `line_total_in_cents` equals the unit price times the quantity |

The identity `id` of `order_items` keeps the lines of an order in the order they were created. The sum of the lines equal to `subtotal_in_cents` is guaranteed by the use case (spec 010), not by a column check.

## App architecture `[implemented]`

- Layout of `apps/app`: `index.html`, `vite.config.ts`, `e2e/figma-reference` (the four frames of the design, cut by `scripts/cut-figma-references.mjs`), `e2e/visual-parity.spec.ts` and `e2e/visual-masks.ts` (the pixel and layout checks against them), `playwright.config.ts` (it checks Postgres, starts the API and the app when they are not running, and reuses them when they are; `e2e/global-setup.ts` checks they are the right ones), `src/main.tsx` (entry), `src/app` (`App`, `providers`, `routes`, `app-layout`: the skip link, navbar, and `main` shared by every route; spec 016), `src/pages` (`HomePage`, `CheckoutPage`, `OrderPage`, `NotFoundPage`), `src/api` (`client`, `info`), `src/styles` (`index.css`, `theme.css`, `fonts.css`, `base.css`), `src/lib` (`format-money`), `src/assets` (the logo, icons, coffee photos, hero image, and illustration with a typed manifest, `index.ts`; spec 014), `src/components` (the base components `badge`, `button`, `counter`, `input`, `select-option`, `tag`, the `navbar`, and the internal `icon`, one folder each with its test; specs 015 and 016), `src/features` (`home/hero`, the hero of the home page, spec 017; `catalog` with `api.ts` (`useCoffees(tags)`), `coffee-tags.ts` (the five tags), `coffee-card` and `coffee-list`, spec 018, `coffee-filters`, spec 019, and `coffee-photo`, shared with the checkout; `checkout` with `api.ts` (`useCheckoutConfig()`, and `useCreateOrder()` with the `Order` and `OrderRequest` types, spec 025) `order-summary` (`OrderSummary` and the pure `pricing.ts`), spec 022, and the address form, spec 023: `address-schema.ts` (the Zod schema and the shared limits), `address-masks.ts` (the ZIP code and state masks), `checkout-form` (`CheckoutForm`, `FormCard`, `FormInput`, `order-request.ts`, `submit-errors.ts`, `submit-state.tsx`), and `address-card`; and the payment card, spec 024: `payment-methods.ts` (the label and icon of each API code) and `payment-card`; and `orders` with `api.ts` (`useOrder(id)`, key `["orders", id]`) and `order-confirmation`, spec 026), `src/test` (`orders.tsx`: a fake `GET /api/v1/orders/{id}` and a render of the order page, `setup.ts`, `axe.ts`, `coffees.tsx`: the sample coffees, a fake API, and a render with a query client that the catalog tests share, and `checkout.tsx`: a fake API that answers the catalog, the checkout config, and `POST /api/v1/orders` with the outcome a test picks, and a render with the router), `e2e/`. The e2e tests of the coffee list, the filters, the cart, the checkout, and the order confirmation need the API (`yarn infra:up`, `yarn api:dev`).
- Routes (data mode, one table in `src/app/routes.tsx`): `/`, `/checkout`, `/orders/:orderId`, and `*` for the not-found page.
- The API client (`src/api/client.ts`) offers `apiGet` and `apiPost` on the base path `/api/v1` and throws `ApiError` (`status`, `code`, `message`, `fields`). A network failure is `ApiError` with status `0` and code `network_error`; a response outside the project's error shape is `unexpected_error`.
- `AppProviders` creates the TanStack Query client (it does not retry 4xx errors and retries other failures at most twice) and wraps the app with the `CartProvider`.
- **Cart** `[implemented]` (`src/features/cart`, spec 020). The `CoffeeCard` adds to it (spec 021) and `AppLayout` reads `totalQuantity` for the navbar badge; the checkout summary reads it (spec 022), which also removes the lines whose coffee the catalog no longer has. A cart is a list of lines `{ coffeeId, quantity }`, in the order the coffees were first added; nothing else is stored, so a saved cart never shows a stale name or price (they come from the catalog query). `cart-reducer.ts` is pure (no browser API, no React) and exports `cartReducer`, `totalQuantity`, `MIN_QUANTITY` (1), and `MAX_QUANTITY` (99). `cart-storage.ts` is the only code that touches `localStorage`, under the key `coffee-delivery:cart:v1`. `cart-context.tsx` exports `CartProvider` and `useCart()`, which returns `{ lines, totalQuantity, add, setQuantity, remove, clear }` and throws outside the provider. The rules:
  - `add(coffeeId, quantity)` creates a line or adds to the line of that coffee; the sum is capped at 99 and the extra is dropped. A quantity below 1 or not a finite number, and an empty `coffeeId`, change nothing; decimals are cut (`2.9` is `2`).
  - `setQuantity(coffeeId, quantity)` clamps to 1..99 and does nothing for a coffee that is not in the cart. `remove` deletes a line; `clear` empties the cart.
  - The reducer returns the same array when nothing changes, and the provider saves only when the array changed, after a change and not on start (a stored value that could not be read is left alone until the visitor changes the cart).
  - Loading ignores, line by line and without throwing: invalid JSON, a value that is not an array, a line that is not an object, an empty or non-string `coffeeId`, and a quantity that is not an integer from 1 to 99. Only `coffeeId` and `quantity` are kept from a line, and a coffee that appears twice keeps its first line. If `localStorage` throws (blocked site data, a full quota, even on access), the cart works in memory and is lost on reload.
  - The cart is not synced across tabs or devices, and the app never calls the API from it.

- **Checkout form** `[implemented]` (specs 023 to 025): `CheckoutForm` is the only form of the checkout and wraps both columns of the page. The Confirm order button of the summary is its submit button. A valid submit calls `useCreateOrder()` (`POST /api/v1/orders`, a TanStack mutation that never retries by itself) with `buildOrderRequest(cart lines, values)`: only `items` (`coffeeId` and `quantity`), `address`, and `paymentMethod`, never a price. On `201` the app goes to `/orders/<id>` with `replace` (Back does not return to the form) and only then clears the cart, so the checkout never shows an empty cart on its way out. A failure keeps the cart and the values and is mapped by `mapOrderError`: a `400` puts each message under its field (`address.*` and `paymentMethod`) and shows the alert "Please review your order and try again." for any other key; a `422` shows "Some coffees are no longer available. Please review your cart."; a network error or any other status shows "We couldn't place your order. Please try again.", and the button is enabled again. While the request runs the button is disabled and `aria-busy`, so a second click sends nothing. Its values are `{ address, paymentMethod }` (`paymentMethod` is one of the three API codes, unset at first, and the message is "Choose a payment method"); its schema (`checkout-form-schema.ts`) is built from `addressSchema`, whose rules mirror `CreateOrderRequestValidator` of the API (ZIP `^\d{5}-\d{3}$`, state `^[A-Z]{2}$`, required trimmed text, a complement of at most 60 characters). Nothing in the form is stored: it is not in `localStorage` and not in the cart.
- Pages in `src/pages`; features by domain in `src/features` (`catalog`, `cart`, `checkout`, `orders`); shared components in `src/components`; the API client in `src/api`; helpers in `src/lib`; assets in `src/assets`.
- Server state is read with TanStack Query. The cart is client state (a reducer in a context, saved in `localStorage`) and holds only coffee ids and quantities.
- Coffee photos are found by the coffee `slug`; the API sends no image. `coffeeImages[slug]` in `src/assets` is that lookup, and a test checks that its slugs are the ones of the catalog seed.
- Assets are generated, not drawn by hand: `node scripts/extract-figma-assets.mjs` reads the local `.fig` and writes `src/assets` (see DESIGN_SYSTEM.md). The `.fig` is never needed to build.
