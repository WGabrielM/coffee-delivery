// Stress profile: load keeps growing past normal to show where the API starts to degrade (up to 100 virtual users per scenario).
import { THRESHOLDS } from "./lib/config.js";
import { ramp, scenariosFor } from "./lib/profile.js";
import * as scenarios from "./scenarios/index.js";

export * from "./scenarios/index.js";
export const options = {
  scenarios: scenariosFor(scenarios, () =>
    ramp([
      ["1m", 20],
      ["1m", 50],
      ["1m", 100],
      ["1m", 100],
      ["30s", 0],
    ]),
  ),
  thresholds: THRESHOLDS,
};
