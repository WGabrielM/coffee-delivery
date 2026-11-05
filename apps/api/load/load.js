// Load profile: a normal busy period. 10 virtual users per scenario ramp up, hold for 2 minutes, and ramp down.
import { THRESHOLDS } from "./lib/config.js";
import { ramp, scenariosFor } from "./lib/profile.js";
import * as scenarios from "./scenarios/index.js";

export * from "./scenarios/index.js";
export const options = {
  scenarios: scenariosFor(scenarios, () =>
    ramp([
      ["30s", 10],
      ["2m", 10],
      ["30s", 0],
    ]),
  ),
  thresholds: THRESHOLDS,
};
