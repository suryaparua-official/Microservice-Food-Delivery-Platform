import CircuitBreaker from "opossum";
import axios, { type AxiosResponse } from "axios";

const cbOptions = {
  timeout: 3000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000,
};

// Wraps GET calls to the Auth service
const callAuthService = (url: string, token: string): Promise<AxiosResponse> =>
  axios.get(url, { headers: { Authorization: `Bearer ${token}` } });

// Wraps POST calls to the Realtime service
const callRealtimeService = (
  url: string,
  payload: Record<string, unknown>,
): Promise<AxiosResponse> =>
  axios.post(url, payload, {
    headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY },
  });

export const authBreaker = new CircuitBreaker(callAuthService, cbOptions);
authBreaker.fallback(() => null);
authBreaker.on("open", () =>
  console.log("[CB] Auth service circuit OPEN — calls blocked"),
);
authBreaker.on("halfOpen", () =>
  console.log("[CB] Auth service circuit HALF-OPEN — testing"),
);
authBreaker.on("close", () =>
  console.log("[CB] Auth service circuit CLOSED — calls restored"),
);

export const realtimeBreaker = new CircuitBreaker(
  callRealtimeService,
  cbOptions,
);
realtimeBreaker.fallback(() => null);
realtimeBreaker.on("open", () =>
  console.log("[CB] Realtime service circuit OPEN — calls blocked"),
);
realtimeBreaker.on("halfOpen", () =>
  console.log("[CB] Realtime service circuit HALF-OPEN — testing"),
);
realtimeBreaker.on("close", () =>
  console.log("[CB] Realtime service circuit CLOSED — calls restored"),
);
