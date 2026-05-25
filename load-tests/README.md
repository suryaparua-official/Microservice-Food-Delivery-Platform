# Load Tests — Zestify Food Delivery Platform

k6 load testing scripts for the restaurant, auth, and order services.

## Installation

```bash
# Windows (winget)
winget install k6

# macOS (Homebrew)
brew install k6

# Linux
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg \
  --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" \
  | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update && sudo apt-get install k6

# Docker
docker run --rm -i grafana/k6 run - <load-tests/restaurant.test.js
```

Docs: https://k6.io/docs/getting-started/installation/

---

## Prerequisites

Start the platform before running tests:

```bash
docker compose up -d
```

---

## Run Commands

### Restaurant browse load test (10 VUs, 2 min)
```bash
k6 run load-tests/restaurant.test.js
```

### Auth rate-limit test
```bash
k6 run load-tests/auth.test.js
```

### Order endpoint test (with auth token)
```bash
k6 run --env K6_TOKEN=your_jwt_token load-tests/order.test.js
```

### Full realistic user flow
```bash
k6 run load-tests/full-flow.test.js
```

### Full flow with auth token (enables order checks)
```bash
k6 run --env K6_TOKEN=your_jwt_token load-tests/full-flow.test.js
```

---

## Stress Test

Override stages inline without modifying scripts:

```bash
# Restaurant service stress test
k6 run --stage '30s:50,1m:100,30s:0' load-tests/restaurant.test.js

# Full flow stress test
k6 run --stage '30s:50,1m:50,30s:100,1m:100,30s:0' load-tests/full-flow.test.js
```

---

## Thresholds

Default thresholds (defined in `config.js`):

| Metric | Threshold |
|---|---|
| `http_req_duration` p(95) | < 500 ms |
| `http_req_failed` rate | < 1% |

The order test adds a stricter p(95) < 300 ms threshold on response time via the
check `"response time < 300ms"`.

---

## Test Scenarios

| Script | Users | Duration | What it tests |
|---|---|---|---|
| `restaurant.test.js` | 10 VUs | 2 min | Restaurant listing endpoint throughput |
| `auth.test.js` | 1 VU | ~30 s | Rate limiter kicks in after repeated failed logins |
| `order.test.js` | 10 VUs | 2 min | Authenticated order fetch; allows 401 for no token |
| `full-flow.test.js` | 10 VUs | 2 min | Mixed browse / menu / order traffic (30/50/20 split) |

---

## Run via Docker (optional)

```bash
docker run --rm -i \
  --network host \
  -v "$(pwd)/load-tests:/scripts" \
  grafana/k6 run /scripts/full-flow.test.js
```

On Windows with Docker Desktop, replace `--network host` with the host IP:

```bash
# In config.js, change BASE_URLS to use host.docker.internal:
#   auth: 'http://host.docker.internal:5000'
#   restaurant: 'http://host.docker.internal:5001'
```

---

## docker-compose.yml (optional k6 service)

A commented-out k6 service is available in `docker-compose.yml`:

```yaml
# k6:
#   image: grafana/k6
#   container_name: tomato-k6
#   volumes:
#     - ./load-tests:/scripts
#   command: run /scripts/full-flow.test.js
#   networks:
#     - tomato-network
```

Uncomment to run as part of `docker compose up`.
