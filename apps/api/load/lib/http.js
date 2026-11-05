import http from "k6/http";
import { check, sleep } from "k6";

import { BASE_URL, THINK_SECONDS } from "./config.js";

// GET a path of the API and run the given checks on the response.
export function getAndCheck(path, checks) {
  const response = http.get(`${BASE_URL}${path}`, { tags: { name: path } });
  check(response, { [`GET ${path} responds 200`]: (r) => r.status === 200, ...checks });
  return response;
}

// POST a JSON body to a path of the API and run the given checks on the response.
export function postAndCheck(path, body, expectedStatus, checks) {
  const response = http.post(`${BASE_URL}${path}`, JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
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
