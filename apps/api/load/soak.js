// Soak profile: steady load for a long time to find leaks. 10 virtual users per scenario; SOAK_DURATION (default 30m) sets the steady part.
import { THRESHOLDS } from "./lib/config.js";
import { ramp, scenariosFor } from "./lib/profile.js";
import * as scenarios from "./scenarios/index.js";

export * from "./scenarios/index.js";
const SOAK_DURATION = __ENV.SOAK_DURATION || "30m";

export const options = {
  scenarios: scenariosFor(scenarios, () =>
    ramp([
      ["1m", 10],
      [SOAK_DURATION, 10],
      ["1m", 0],
    ]),
  ),
  thresholds: THRESHOLDS,
};
