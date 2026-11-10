# Conventions

Rules that apply to every API, page, and piece of code. Specs reference this file instead of repeating it.

## Language

Everything is written in **English (en-US)**:

- User-facing text: page copy, labels, buttons, validation and error messages.
- API: endpoint paths, JSON fields, error codes and messages.
- Code: identifiers, comments, tests, log messages, commit messages.
- Database: table and column names.
- Documentation, specs, plans, and ADRs.

Details:

- Use en-US spelling (`color`, `canceled`) and write `email`, not `e-mail`.
- The Figma design is in Portuguese. Its text is a reference and is translated; user input (such as a street name) is never translated.
- No translation layer for now. Strings live next to the component that shows them. When a second language is required, introduce i18n through a spec first.
- Dates, times, and numbers are formatted with `Intl` using `en-US`. The HTML root has `lang="en"`.
- URL segments are lowercase English words joined by hyphens (`/checkout-config`).

## Money

- Amounts are **integers in cents** in the database, in the API, and in the app state. Fields are named with the suffix `InCents` (`priceInCents`, `deliveryFeeInCents`, `totalInCents`).
- The currency is US dollars (`USD`). The app formats amounts only when it draws them, with `Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })`.
- The server never formats money and never accepts a price from the client.

## API

- **Base path:** every endpoint lives under `/api/v1/*`. Nothing is served outside `/api` except the operational endpoint `/actuator/health`.
- **Versioning:** the version is part of the path. A breaking change ships as `/api/v2/*` next to `/api/v1/*`; existing versions are not changed in a breaking way.
- **Names:** endpoint segments are lowercase and hyphenated. JSON fields are `camelCase`. Identifiers are UUID strings.
- **Access:** there are no accounts, so every endpoint is public.
- **Success:** `200` with a JSON body, `201` after creating something (with a `Location` header), `204` with no body.
- **Idempotency:** a request that creates something may take an optional `Idempotency-Key` header (a UUID chosen by the client). The key is stored with a fingerprint of the request under a unique index. The same key with the same request creates nothing and answers `200` with the first result (and its `Location`); the same key with a different request is a `422 unprocessable_content` with `fields["Idempotency-Key"]`; a header that is not a UUID is a `400 validation_failed` with the same field name. Only `POST /api/v1/orders` uses it today.
- **Errors:** every error response under `/api` uses this shape:

  ```json
  {
    "error": {
      "code": "validation_failed",
      "message": "The request has invalid fields.",
      "fields": { "address.zipCode": "Enter a ZIP code like 12345-678." }
    }
  }
  ```

  `code` is a stable `snake_case` identifier, `message` is an en-US sentence a person can read, and `fields` appears only for validation errors. Its keys are JSON paths (`paymentMethod`, `address.zipCode`, `items`, `items[0].quantity`); a body that is not valid JSON uses the key `body`. Messages are fixed sentences: they never contain exception messages, class names, or stack traces. `ApiExceptionHandler` (`shared.error`) builds every error; do not build one by hand in an endpoint.

| Status | Code | Used when |
| --- | --- | --- |
| 400 | `validation_failed` | A field is missing or invalid, or the body is not valid JSON |
| 404 | `not_found` | The route or resource does not exist |
| 405 | `method_not_allowed` | The route exists but not for this HTTP method (the `Allow` header lists the methods) |
| 415 | `unsupported_media_type` | The request content type is not supported |
| 4xx | `bad_request` | Any other client error the framework reports |
| 422 | `unprocessable_content` | The request is valid but its content cannot be used, for example an order for a coffee that does not exist |
| 429 | `too_many_requests` | Sent by the proxy of the app image, not by the API, when one client sends more than 10 orders a minute (`Retry-After: 60`) |
| 500 | `unexpected_error` | Anything unhandled; the message never exposes internals |

## Orders and addresses

- Payment methods: `credit_card`, `debit_card`, `cash`.
- Address fields: `zipCode` (`^\d{5}-\d{3}$`, the design format `00000-000`), `street`, `number`, `complement` (optional, at most 60 characters), `neighborhood`, `city`, and `state` (two uppercase letters). Text fields are trimmed and must not be blank.
- The delivery estimate is 20 to 30 minutes.

## Web app routes

| Path | Page |
| --- | --- |
| `/` | Home: hero, filters, and the coffee list |
| `/checkout` | Checkout: address, payment, and the order summary |
| `/orders/:orderId` | Order confirmation |

Every other path shows a not-found page with a link to `/`.
