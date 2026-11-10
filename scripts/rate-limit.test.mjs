// Guards the rate limit of the app proxy (spec 038): its numbers, its scope, and the error body.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const conf = readFileSync(join(root, "apps/app/nginx.conf"), "utf8");

test("the zone allows 10 requests a minute for each client address", () => {
  assert.match(conf, /limit_req_zone \$orders_limit_key zone=orders:\d+m rate=10r\/m;/);
  assert.match(conf, /POST \$binary_remote_addr;/);
});

test("only POST is counted: any other method has an empty key, which nginx does not limit", () => {
  assert.match(conf, /map \$request_method \$orders_limit_key \{[^}]*default "";/);
});

test("only POST /api/v1/orders uses the limit, with a burst of 5, and answers 429", () => {
  const limited = conf.match(/limit_req zone=orders burst=5 nodelay;/g) ?? [];
  assert.equal(limited.length, 1);
  assert.match(
    conf,
    /location = \/api\/v1\/orders \{[^}]*limit_req zone=orders burst=5 nodelay;[^}]*limit_req_status 429;/,
  );
  assert.doesNotMatch(conf, /location \/api\/ \{[^}]*limit_req/);
  assert.doesNotMatch(conf, /location \/assets\/ \{[^}]*limit_req/);
});

test("the 429 has the error body of the API with the code too_many_requests", () => {
  const match = conf.match(/return 429 '([^']+)';/);
  assert.ok(match, "the named location returns a JSON body");
  const body = JSON.parse(match[1]);
  assert.equal(body.error.code, "too_many_requests");
  assert.match(body.error.message, /^[A-Z].*[.]$/);
  assert.match(conf, /default_type application\/json;/);
  assert.match(conf, /add_header Retry-After 60 always;/);
});

test("the orders location still sends the request to the API", () => {
  assert.match(conf, /location = \/api\/v1\/orders \{[^}]*proxy_pass http:\/\/api:3000;/);
});
