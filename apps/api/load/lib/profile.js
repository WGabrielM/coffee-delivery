// Builds the k6 `scenarios` option of a profile: every exported scenario function runs in its own
// executor, so a new endpoint's scenario joins every profile as soon as it is listed in the index.
// Virtual users (VUs) are counted per scenario.
export function scenariosFor(scenarios, executorFor) {
  return Object.fromEntries(
    Object.keys(scenarios).map((name) => [name, { ...executorFor(name), exec: name }]),
  );
}

// A ramping-vus executor from a list of [duration, targetVUs] stages.
export function ramp(stages) {
  return {
    executor: "ramping-vus",
    startVUs: 0,
    gracefulRampDown: "10s",
    stages: stages.map(([duration, target]) => ({ duration, target })),
  };
}
