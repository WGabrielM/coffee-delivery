// Smoke profile: one virtual user runs every scenario for a short time to prove they work.
import { SMOKE_THRESHOLDS } from "./lib/config.js";
import * as scenarios from "./scenarios/index.js";

export * from "./scenarios/index.js";

export const options = {
  scenarios: Object.fromEntries(
    Object.keys(scenarios).map((name) => [
      name,
      { executor: "constant-vus", vus: 1, duration: "10s", exec: name },
    ]),
  ),
  thresholds: SMOKE_THRESHOLDS,
};
