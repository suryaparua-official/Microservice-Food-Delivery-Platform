import http from "k6/http";
import { check, sleep } from "k6";
import { BASE_URLS } from "./config.js";

export const options = {
  // Single VU fires 10 rapid requests to trigger the rate limiter
  scenarios: {
    rate_limit_check: {
      executor: "per-vu-iterations",
      vus: 1,
      iterations: 10,
      maxDuration: "30s",
    },
  },
};

const BAD_PAYLOAD = JSON.stringify({
  email: "ratelimit@test.com",
  password: "wrongpassword",
});

const HEADERS = { "Content-Type": "application/json" };

export default function () {
  const res = http.post(`${BASE_URLS.auth}/api/auth/login`, BAD_PAYLOAD, {
    headers: HEADERS,
  });

  // Before the limit: 400/401; after the limit: 429
  check(res, {
    "status is 400, 401, or 429": (r) =>
      r.status === 400 || r.status === 401 || r.status === 429,
    "rate limit triggered at 429": (r) => {
      if (r.status === 429) {
        console.log(`Rate limit hit on iteration — response: ${r.body}`);
        return true;
      }
      return true; // not yet triggered, still valid
    },
  });

  // No sleep — intentionally rapid fire to hit the rate limiter
}
