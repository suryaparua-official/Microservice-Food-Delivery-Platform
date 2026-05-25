import axiosRetry from "axios-retry";
import axios from "axios";

export function setupAxiosRetry(): void {
  axiosRetry(axios, {
    retries: 3,
    retryDelay: axiosRetry.exponentialDelay,
    // Retry only on network errors or 5xx server errors
    retryCondition: (error) =>
      axiosRetry.isNetworkError(error) ||
      (error.response !== undefined && error.response.status >= 500),
    onRetry: (retryCount, error) => {
      console.log(
        `[Retry] Attempt ${retryCount} after error: ${error.message}`,
      );
    },
  });
}
