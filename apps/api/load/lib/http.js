import http from "k6/http";
import { check } from "k6";

import { BASE_URL } from "./config.js";

// GET a path of the API and run the given checks on the response.
export function getAndCheck(path, checks) {
  const response = http.get(`${BASE_URL}${path}`, { tags: { name: path } });
  check(response, { [`GET ${path} responds 200`]: (r) => r.status === 200, ...checks });
  return response;
}
