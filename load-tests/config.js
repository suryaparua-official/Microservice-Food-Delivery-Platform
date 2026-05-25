export const BASE_URLS = {
  auth: "http://localhost:5000",
  restaurant: "http://localhost:5001",
  rider: "http://localhost:5005",
};

export const DEFAULT_OPTIONS = {
  stages: [
    { duration: "30s", target: 10 },
    { duration: "1m", target: 10 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<500"],
    http_req_failed: ["rate<0.01"],
  },
};

export const STRESS_OPTIONS = {
  stages: [
    { duration: "30s", target: 50 },
    { duration: "1m", target: 50 },
    { duration: "30s", target: 100 },
    { duration: "1m", target: 100 },
    { duration: "30s", target: 0 },
  ],
};
