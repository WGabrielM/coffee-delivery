// Shared settings for every k6 scenario and profile.
export const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

// Every profile fails the run when a request fails or is slower than this.
export const SMOKE_THRESHOLDS = {
  http_req_failed: ["rate==0"],
  http_req_duration: ["p(95)<500"],
  checks: ["rate==1"],
};
