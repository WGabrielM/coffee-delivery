import http from "k6/http";
import { check, sleep } from "k6";

import { BASE_URL, THINK_SECONDS } from "./config.js";

// GET a path of the API and run the given checks on the response. The metrics are grouped under
// `name` (the path by default), so a path with an id does not create one series per id.
export function getAndCheck(path, checks, name = path) {
  const response = http.get(`${BASE_URL}${path}`, { tags: { name } });
  check(response, { [`GET ${name} responds 200`]: (r) => r.status === 200, ...checks });
  return response;
}

// POST a JSON body to a path of the API and run the given checks on the response. `headers` are
// added to the JSON content type, for example an Idempotency-Key.
export function postAndCheck(path, body, expectedStatus, checks, headers = {}) {
  const response = http.post(`${BASE_URL}${path}`, JSON.stringify(body), {
    headers: { "Content-Type": "application/json", ...headers },
    tags: { name: path },
  });
  check(response, {
    [`POST ${path} responds ${expectedStatus}`]: (r) => r.status === expectedStatus,
    ...checks,
  });
  return response;
}

// Every scenario ends with think(), so one virtual user behaves like one person.
export function think() {
  sleep(THINK_SECONDS);
}
