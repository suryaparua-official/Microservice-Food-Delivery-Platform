import http from "k6/http";
import { check, sleep } from "k6";
import { BASE_URLS, DEFAULT_OPTIONS } from "./config.js";

export const options = DEFAULT_OPTIONS;

export default function () {
  const token = __ENV.K6_TOKEN;

  const headers = token
    ? { Authorization: `Bearer ${token}` }
    : {};

  const res = http.get(`${BASE_URLS.restaurant}/api/order/myorder`, {
    headers,
  });

  check(res, {
    "status is 200 or 401": (r) => r.status === 200 || r.status === 401,
    "response time < 300ms": (r) => r.timings.duration < 300,
    "no server error": (r) => r.status < 500,
  });

  sleep(1);
}
