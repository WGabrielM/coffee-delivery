// Shared settings for every k6 scenario and profile.
export const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

// Seconds a virtual user waits between iterations, like a person reading the page.
// Set THINK_SECONDS=0 to send requests as fast as the machine allows.
export const THINK_SECONDS = Number(__ENV.THINK_SECONDS || 0.5);

// Every profile fails the run when more than 1% of the requests fail or the p95 latency reaches 500 ms.
export const THRESHOLDS = {
  http_req_failed: ["rate<0.01"],
  http_req_duration: ["p(95)<500"],
  checks: ["rate>0.99"],
};

// The smoke profile only proves the scenarios work, so it accepts no failure at all.
export const SMOKE_THRESHOLDS = {
  http_req_failed: ["rate==0"],
  http_req_duration: ["p(95)<500"],
  checks: ["rate==1"],
};
