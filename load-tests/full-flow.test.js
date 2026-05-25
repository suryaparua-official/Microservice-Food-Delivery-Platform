import http from "k6/http";
import { check, sleep } from "k6";
import { BASE_URLS, DEFAULT_OPTIONS } from "./config.js";

export const options = DEFAULT_OPTIONS;

const LAT = "28.6139";
const LNG = "77.2090";

function browseRestaurants() {
  const res = http.get(
    `${BASE_URLS.restaurant}/api/restaurant/all?latitude=${LAT}&longitude=${LNG}`,
  );

  const ok = check(res, {
    "browse: status 200": (r) => r.status === 200,
    "browse: has body": (r) => r.body.length > 0,
  });

  return ok ? JSON.parse(res.body) : null;
}

function viewMenu(restaurantId) {
  const res = http.get(
    `${BASE_URLS.restaurant}/api/item/${restaurantId}`,
  );

  check(res, {
    "menu: status 200": (r) => r.status === 200,
    "menu: response time < 500ms": (r) => r.timings.duration < 500,
  });
}

function checkMyOrders(token) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = http.get(`${BASE_URLS.restaurant}/api/order/myorder`, {
    headers,
  });

  check(res, {
    "orders: status 200 or 401": (r) =>
      r.status === 200 || r.status === 401,
    "orders: no server error": (r) => r.status < 500,
  });
}

export default function () {
  const token = __ENV.K6_TOKEN || null;
  const roll = Math.random();

  if (roll < 0.30) {
    // 30% — browse only
    browseRestaurants();
    sleep(Math.random() * 2 + 1);

  } else if (roll < 0.80) {
    // 50% — browse + view menu
    const data = browseRestaurants();
    sleep(Math.random() * 1 + 0.5);

    if (data) {
      const list = Array.isArray(data) ? data : data.restaurants;
      if (list && list.length > 0) {
        const pick = list[Math.floor(Math.random() * list.length)];
        const rid = pick._id || pick.id;
        if (rid) {
          viewMenu(rid);
          sleep(Math.random() * 2 + 1);
        }
      }
    }

  } else {
    // 20% — browse + menu + check orders
    const data = browseRestaurants();
    sleep(Math.random() * 1 + 0.5);

    if (data) {
      const list = Array.isArray(data) ? data : data.restaurants;
      if (list && list.length > 0) {
        const pick = list[Math.floor(Math.random() * list.length)];
        const rid = pick._id || pick.id;
        if (rid) {
          viewMenu(rid);
          sleep(Math.random() * 1 + 0.5);
        }
      }
    }

    checkMyOrders(token);
    sleep(Math.random() * 2 + 1);
  }
}
