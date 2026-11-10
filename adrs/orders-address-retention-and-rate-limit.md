# ADR: Orders, address retention and a rate limit

- Status: Accepted and verified
- Date: 2026-11-10
- Spec: [.specs/038-orders-address-retention-and-rate-limit.md](../.specs/038-orders-address-retention-and-rate-limit.md)
- Plan: [plans/038-orders-address-retention-and-rate-limit-plan.md](../plans/038-orders-address-retention-and-rate-limit-plan.md)

## Context

Every order kept the address of the customer for ever, and `GET /api/v1/orders/{id}` shows it to anyone who has the id. An order is paid on delivery, so the address has no use after the delivery and the days of a complaint. The endpoint that creates orders had no limit, so a script could fill the table.

## Decisions

1. **`V5__allow_cleared_order_addresses.sql`.** The six required address columns lose `NOT NULL`; `address_cleared_at` is new; the check `ck_orders_address_present_until_cleared` says: not cleared means the six are present, cleared means all seven (the complement too) are null. The state rule (two capitals) still holds for an order that has an address, and the existing orders are not changed.
2. **The retention is `orders.retention.days` (`ORDERS_RETENTION_DAYS`, 90) and `orders.retention.cron` (`ORDERS_RETENTION_CRON`, `0 0 3 * * *`)** in `application.yaml`, with no number in the code. `RetentionPolicy` is a plain record in `application` that refuses less than 1 day; an `infrastructure` configuration builds it from the setting, because the rule of spec 036 lets `application` use only the Spring stereotype (no `@Value`), and a wrong setting stops the application at startup.
3. **`ClearOldAddressesUseCase`** takes the time from the injected `Clock`, computes the cutoff (now minus the days), and calls the port `OrderAddressRetention`. **`JdbcOrderAddressRetention`** clears the seven columns and records `address_cleared_at` in one `UPDATE ... WHERE address_cleared_at IS NULL AND created_at < cutoff`, so an order that is already cleared is not touched again: a second run, or a second instance, does nothing. Items, totals, payment method, and dates stay.
4. **`ClearOldAddressesJob`** (`@Scheduled(cron = "${orders.retention.cron}")`, enabled by `@EnableScheduling`, Spring's own scheduling: no library, queue, or lock table) runs the use case, adds the count to the metric `orders.addresses.cleared`, and logs one line with the count and the days, and no address data.
5. **A scheduled job is an entry point.** The rule of spec 036 said each use case is used by exactly one request handler, which a use case run by a job cannot satisfy. It is now "exactly one request handler or scheduled job (`*Job`)", proved on fixtures: a use case with one job passes, a use case with a handler and a job fails, and the old cases (none, two handlers) still fail. `DEVELOPMENT.md` says so.
6. **The response.** `GET /api/v1/orders/{id}` of a cleared order answers `200` with `"address": null` and every other field as before, and every order response has a new `addressRetentionDays` (the configured number), so the page can say how long. The create response has the same shape (they share `OrderResponse`).
7. **App.** The `Order` type has a nullable address and `addressRetentionDays`; the first row of the confirmation says "The address was removed after 90 days." ("1 day" for one) in place of the address, and the title, the estimate, and the payment are as before; the checkout maps `429` to "Too many orders were sent. Please wait a minute and try again." (an alert, the cart and the form kept).
8. **The rate limit is in the proxy of the app image** (`apps/app/nginx.conf`), because a limit in the process does not hold with more than one instance. A `map` gives the key `$binary_remote_addr` to `POST` and an empty key to any other method (nginx does not limit an empty key), one zone allows `10r/m`, and the location `= /api/v1/orders` uses `limit_req ... burst=5 nodelay` and answers `429` with `{"error":{"code":"too_many_requests",...}}` and `Retry-After: 60`. No other path is limited, and neither is the development proxy of Vite. A script test pins the numbers, the scope, and the body.

## Verified (2026-11-10)

- API: 156 unit tests and 107 end-to-end tests, the coverage gate passed. The new tests: the use case with a fake clock (89 days kept, 91 cleared, the same order not cleared twice, the setting used, less than 1 day refused), the job end to end (an order aged to 91 days is cleared and one of 89 is not, the metric grows by one, a second run adds nothing and keeps `address_cleared_at`), the `GET` of a cleared order (`address: null`, the other fields equal to the ones before, the line still stored), the settings and the schedule annotation, the migration (the new nullable columns, a cleared order accepted, an address with a cleared mark refused, a null address with no mark refused, the state rule still holding), and the handlers.
- App: 679 unit tests (8 new: the cleared confirmation, the `429` message, and the checkout alert) and 197 Playwright tests (2 new: a cleared order in the browser and a `429` at the checkout).
- By hand, against the rebuilt packaged app on port 8080: ten `POST /api/v1/orders` from one client answered six times with the API (the first and the burst of 5) and four times `429` with the JSON body and `Retry-After: 60`; `GET /api/v1/coffees` right after answered `200`. Flyway applied `V5` at the start of the API container.
- **k6 spike** (`apps/api/load/rate-limit.js`, 20 requests a second for 30 s from one client against the packaged app): 601 requests, **10 orders created** (the limit allows at most 12: the first, the burst of 5, one every 6 seconds, and one of slack), **591 answered `429`**, every `429` had the error body and `Retry-After: 60`, all checks passed. The run started a minute after the manual check, with the bucket not yet full, so 10 is below the 11 that a full bucket allows.

## Consequences

- Addresses are kept for 90 days and then removed; the orders themselves stay, so the counts and the totals do not change.
- The limit is per client address as nginx sees it. Behind a load balancer the real client address must be passed on (`real_ip`), a decision for the host.
- The job uses the clock and the time zone of the server for 03:00; with more than one instance it runs on each one at the same time, which the `WHERE` makes harmless.
- No new library.
