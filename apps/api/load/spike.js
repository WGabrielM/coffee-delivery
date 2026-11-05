// Spike profile: a sudden jump from 10 to 100 virtual users per scenario, held for a minute, then back.
import { THRESHOLDS } from "./lib/config.js";
import { ramp, scenariosFor } from "./lib/profile.js";
import * as scenarios from "./scenarios/index.js";

export * from "./scenarios/index.js";
export const options = {
  scenarios: scenariosFor(scenarios, () =>
    ramp([
      ["30s", 10],
      ["10s", 100],
      ["1m", 100],
      ["10s", 10],
      ["30s", 10],
      ["20s", 0],
    ]),
  ),
  thresholds: THRESHOLDS,
};
