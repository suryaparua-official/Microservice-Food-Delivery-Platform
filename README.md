# Zestify: A production-grade, cloud-native food delivery platform built on microservices architecture.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Microservices](#microservices)
- [Technology Stack](#technology-stack)
- [Infrastructure](#infrastructure)
- [CI/CD Pipeline](#cicd-pipeline)
- [GitOps Workflow](#gitops-workflow)
- [Kubernetes Deployment](#kubernetes-deployment)
- [Security](#security)
- [Autoscaling](#autoscaling)
- [Load Testing](#load-testing)
- [Local Development](#local-development)
- [Environment Variables](#environment-variables)
- [Deployment Guide](#deployment-guide)

---

## Overview

Zestify is a fully containerized food delivery platform deployed on Google Kubernetes Engine. It is designed to reflect production-grade engineering standards across the entire software delivery lifecycle — from infrastructure provisioning with Terraform, to automated CI/CD with GitHub Actions, to GitOps-driven deployment with ArgoCD.

The platform enables customers to browse nearby restaurants, place orders with real-time tracking, and pay through integrated payment gateways. Restaurant owners can manage their menus and order pipelines. Riders receive and fulfill delivery assignments. An admin layer governs restaurant verification and platform oversight.

**Production URL:** https://zestify-surya.duckdns.org

**Key deployment metrics:**

- 10,000 / 10,000 successful requests under load testing
- 174 ms average latency at 556 req/sec
- Zero downtime observed during load tests
- HPA configured across all services with min 2 / max 10 replicas

---

## Architecture

### System Architecture Diagram

```
                          ┌─────────────────────────────────────────────────────┐
                          │              Internet / Client Browser               │
                          └─────────────────────┬───────────────────────────────┘
                                                │ HTTPS (443)
                                                │
                          ┌─────────────────────▼───────────────────────────────┐
                          │         NGINX Ingress Controller (GKE)              │
                          │         zestify-surya.duckdns.org                   │
                          │         TLS: Let's Encrypt (cert-manager)           │
                          └───┬──────────┬────────┬───────┬────────┬──────────┬──┘
                              │          │        │       │        │          │
                   /api/auth  │  /api/   │  /api/ │  /    │ /sock  │ /api/    │
                              │restaurant│ payment│       │  et.io │  rider   │
                              ▼          ▼        ▼       ▼        ▼          ▼
                    ┌──────────┐ ┌──────────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
                    │  Auth    │ │Restaurant│ │Utils │ │Front │ │Real  │ │Rider │
                    │ :5000    │ │  :5001   │ │:5002 │ │ end  │ │ time │ │:5005 │
                    └────┬─────┘ └────┬─────┘ └──┬───┘ └──────┘ │:5004 │ └──────┘
                         │            │          │              └──────┘
                    ┌────▼────┐  ┌────▼────┐  ┌──▼──────┐              ┌──────────┐
                    │ MongoDB │  │ MongoDB │  │Cloudinary│             │  Admin   │
                    │  Atlas  │  │  Atlas  │  │  (CDN)  │              │  :5006   │
                    └─────────┘  └────┬────┘  └─────────┘              └──────────┘
                                      │
                               ┌──────▼──────────────────────┐
                               │         Message Bus          │
                               │  RabbitMQ  │  Kafka          │
                               └──────┬─────┴────────┬────────┘
                                      │              │
                               ┌──────▼──────┐  ┌────▼───────┐
                               │   Redis     │  │PostgreSQL  │
                               │  (Upstash)  │  │  (Prisma)  │
                               └─────────────┘  └────────────┘
```

### Kubernetes Cluster Layout

```
GKE Cluster (zestify-cluster)
└── Namespace: zestify
    ├── Deployments (7 services)
    │   ├── auth-service          :5000
    │   ├── restaurant-service    :5001
    │   ├── utils-service         :5002
    │   ├── realtime-service      :5004
    │   ├── rider-service         :5005
    │   ├── admin-service         :5006
    │   └── frontend-service      :80
    ├── Services (ClusterIP / LoadBalancer)
    ├── Ingress (NGINX)
    ├── ConfigMap (zestify-config)
    ├── Secret (zestify-secrets)
    └── HPA (all 7 services, min:2 max:10 cpu:70%)
```

### CI/CD & GitOps Flow

```
Developer Push
      │
      ▼
GitHub (main branch)
      │
      ├── GitHub Actions CI
      │   ├── Snyk dependency scan
      │   ├── Docker build (all 7 services)
      │   ├── Trivy vulnerability scan
      │   └── Push to DockerHub (tagged with git SHA)
      │
      └── GitHub Actions CD
          ├── Update k8s deployment manifests (new image SHA)
          ├── Commit manifest changes back to repo
          ├── Authenticate to GCP (Workload Identity Federation)
          └── Apply Kubernetes Secrets from GitHub Secrets
                │
                ▼
            ArgoCD (watches k8s/ directory)
                │
                └── Auto-sync → Kubernetes rolling update
```

---

## Microservices

The platform is decomposed into seven independently deployable services.

### Auth Service (port 5000)

Handles user registration, login, JWT issuance, token refresh, and Google OAuth 2.0. Implements rate limiting per IP using Redis-backed express-rate-limit. Exposes Swagger documentation at `/api/docs`.

### Restaurant Service (port 5001)

Core business logic for restaurant management, menu items, cart operations, address management, and order lifecycle. Uses both MongoDB (restaurant/cart/address data) and PostgreSQL via Prisma (order data). Publishes order events to RabbitMQ and Kafka. Implements circuit breaker and Axios retry for inter-service resilience.

### Utils Service (port 5002)

Handles cross-cutting concerns: Cloudinary image upload, Stripe and Razorpay payment processing, email dispatch via Gmail SMTP, and audit log consumption from Kafka.

### Realtime Service (port 5004)

Socket.IO server for real-time order status push to customers and riders. Communicates with other services via internal HTTP routes protected by a shared internal service key.

### Rider Service (port 5005)

Manages rider profiles, order acceptance, delivery tracking, and earnings. Consumes order-ready events from RabbitMQ to notify available riders.

### Admin Service (port 5006)

Internal dashboard for platform administrators. Verifies restaurant registrations and manages platform-level oversight.

### Frontend Service (port 80)

React 19 SPA served via NGINX. Built at Docker image creation time with environment variables injected as build args. Supports client-side routing, Gzip compression, and long-cache static asset serving.

---

## Technology Stack

### Backend

| Technology           | Purpose                                |
| -------------------- | -------------------------------------- |
| Node.js + Express.js | HTTP server runtime and framework      |
| TypeScript           | Type-safe backend development          |
| Mongoose             | MongoDB ODM                            |
| Prisma               | PostgreSQL ORM (restaurant order data) |
| Socket.IO            | Real-time bidirectional communication  |
| Googleapis           | Google OAuth token exchange            |
| JSON Web Tokens      | Stateless authentication               |
| Helmet               | HTTP security headers                  |
| express-rate-limit   | Rate limiting with Redis backend       |
| Swagger UI           | Interactive API documentation          |
| RabbitMQ (amqplib)   | Async event messaging                  |
| Kafka (kafkajs)      | Audit log streaming                    |
| Axios + axios-retry  | Inter-service HTTP with retry logic    |
| opossum              | Circuit breaker pattern                |

### Frontend

| Technology          | Purpose                             |
| ------------------- | ----------------------------------- |
| React 19            | UI framework                        |
| TypeScript          | Type-safe frontend development      |
| Vite                | Build tooling                       |
| Tailwind CSS v4     | Utility-first styling               |
| React Router v7     | Client-side routing                 |
| Socket.IO Client    | Real-time order tracking            |
| @react-oauth/google | Google One-Tap login                |
| @stripe/stripe-js   | Stripe payment integration          |
| React Leaflet       | Map rendering for delivery tracking |
| React Hot Toast     | Notification system                 |
| Axios               | HTTP client                         |

### Databases and Messaging

| Service             | Role                                   |
| ------------------- | -------------------------------------- |
| MongoDB Atlas       | Users, restaurants, cart, address data |
| PostgreSQL (Prisma) | Order records (restaurant service)     |
| Redis (Upstash)     | Session caching, rate limit counters   |
| RabbitMQ Cloud      | Payment and order-ready event queues   |
| Kafka (Confluent)   | Audit log streaming                    |

### Infrastructure and DevOps

| Tool                     | Role                              |
| ------------------------ | --------------------------------- |
| Google Kubernetes Engine | Container orchestration           |
| Terraform                | Infrastructure as Code            |
| Docker                   | Containerization                  |
| DockerHub                | Container registry                |
| GitHub Actions           | CI/CD automation                  |
| ArgoCD                   | GitOps continuous delivery        |
| NGINX Ingress Controller | Kubernetes ingress and routing    |
| cert-manager             | Automated TLS provisioning        |
| Let's Encrypt            | Free TLS certificates             |
| DuckDNS                  | Free dynamic DNS                  |
| Trivy                    | Container vulnerability scanning  |
| Snyk                     | Dependency vulnerability scanning |
| hey                      | HTTP load testing                 |

---

## Infrastructure

Infrastructure is provisioned and managed entirely through Terraform, with three composable modules.

### Terraform Modules

```
terraform/
├── environments/
│   └── dev/
│       ├── main.tf          # Wires vpc, iam, gke modules
│       ├── variables.tf
│       ├── outputs.tf
│       ├── providers.tf
│       └── versions.tf
└── modules/
    ├── vpc/                 # VPC, subnet, secondary ranges for pods/services
    ├── iam/                 # GKE service account with least-privilege roles
    └── gke/                 # GKE cluster and node pool configuration
```

### Network Configuration

- VPC CIDR: `10.0.0.0/24`
- Pod secondary range: `10.1.0.0/16`
- Services secondary range: `10.2.0.0/20`

### DNS and TLS

The domain `zestify-surya.duckdns.org` is mapped to the GKE LoadBalancer external IP `34.47.185.79`. TLS is provisioned automatically by cert-manager using a Let's Encrypt ClusterIssuer. The TLS secret `zestify-tls` has `READY = True`.

**Verification:**

```bash
nslookup zestify-surya.duckdns.org
# Returns: 34.47.185.79
```

---

## CI/CD Pipeline

### Continuous Integration (GitHub Actions)

Triggered on every push and pull request to `main`. The pipeline runs all seven services in parallel using a matrix strategy.

```
Job 1: Security Scan
  └── Snyk dependency audit (--severity-threshold=high, all projects)

Job 2: Build + Scan + Push (matrix: 7 services)
  ├── Docker Buildx setup
  ├── Build image with build-args (VITE_* env vars injected at build time)
  ├── Trivy scan (CRITICAL severity, exit-code 1)
  └── Push to DockerHub tagged with git commit SHA
      Example: surya850/zestify-auth:<git-sha>
```

### Continuous Deployment (GitHub Actions)

Triggered on successful completion of the CI workflow on `main`.

```
Job 1: Update Manifests
  ├── Sed-replace image tags in k8s/*/deployment.yml with new SHA
  └── Commit and push updated manifests back to repository

Job 2: Authenticate GCP + Apply Secrets
  ├── Workload Identity Federation (keyless GCP auth)
  ├── Get GKE credentials
  ├── Apply namespace
  └── kubectl apply zestify-secrets from GitHub Secrets (--dry-run | apply)
```

**No long-lived GCP keys are stored.** Authentication uses Workload Identity Federation (`id-token: write` permission).

---

## GitOps Workflow

ArgoCD watches the `k8s/` directory of this repository. Every manifest change committed by the CD pipeline triggers an automatic sync.

```yaml
# k8s/argocd-app.yml
spec:
  source:
    repoURL: https://github.com/suryaparua-official/Microservice-Food-Delivery-Platform.git
    targetRevision: main
    path: k8s
    directory:
      recurse: true
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

**Deployment flow:** `git push` → CI builds and tags images → CD updates manifests → ArgoCD detects drift → Kubernetes rolling update

**Final ArgoCD state:**

- Sync Status: `Synced`
- Health Status: `Healthy`

---

## Kubernetes Deployment

### Resource Definitions

```
k8s/
├── namespace.yml
├── configmap.yml            # Non-sensitive config (ports, service URLs, queue names)
├── ingress.yml              # NGINX routing rules for all services
├── argocd-app.yml
├── auth/                    # deployment.yml + service.yml
├── restaurant/
├── utils/
├── realtime/
├── rider/
├── admin/
└── frontend/
```

### ConfigMap (non-sensitive values)

```yaml
NODE_ENV: "production"
AUTH_SERVICE_URL: "http://auth-service:5000"
RESTAURANT_SERVICE: "http://restaurant-service:5001"
UTILS_SERVICE: "http://utils-service:5002"
REALTIME_SERVICE: "http://realtime-service:5004"
FRONTEND_URL: "https://zestify-surya.duckdns.org"
```

### Resource Requests and Limits (per pod, auth service example)

```yaml
resources:
  requests:
    memory: "128Mi"
    cpu: "100m"
  limits:
    memory: "256Mi"
    cpu: "200m"
```

All pods include liveness and readiness probes on `/health`.

### Ingress Routing

```
/api/auth        → auth-service:5000
/api/restaurant  → restaurant-service:5001
/api/order       → restaurant-service:5001
/api/cart        → restaurant-service:5001
/api/address     → restaurant-service:5001
/api/payment     → utils-service:5002
/api/upload      → utils-service:5002
/socket.io       → realtime-service:5004
/api/rider       → rider-service:5005
/api/admin       → admin-service:5006
/                → frontend-service:80
```

---

## Security

### Authentication

- Google OAuth 2.0 via `@react-oauth/google` on the frontend and `googleapis` on the backend
- JWT tokens signed with `JWT_SEC`, expiry: 15 days
- Token version field enables server-side invalidation

### Transport Security

- HTTPS enforced at the ingress layer for all traffic
- TLS certificate automatically provisioned and renewed by cert-manager + Let's Encrypt
- HSTS, X-Frame-Options, X-Content-Type-Options, X-XSS-Protection headers set via Helmet

### Internal Service Security

- All inter-service calls validate an `x-internal-key` header against `INTERNAL_SERVICE_KEY`
- Internal routes are not exposed through the ingress

### Rate Limiting

- Global rate limiter applied to all auth routes
- Separate stricter limiter on `POST /api/auth/login`
- Redis-backed counters for distributed enforcement across replicas

### Secret Management

- All secrets stored in GitHub Secrets
- CD pipeline applies them as a Kubernetes Secret (`zestify-secrets`) on every deployment
- No secrets committed to the repository
- GCP authentication uses Workload Identity Federation — no service account keys stored

### Container Security

- Trivy scans every image for CRITICAL CVEs before push
- Snyk audits all npm dependency trees on every CI run

---

## Autoscaling

Horizontal Pod Autoscaler is configured for all seven services.

```yaml
Min Replicas: 2
Max Replicas: 10
CPU Target: 70%
```

Metrics Server is installed and operational on the cluster. CPU and memory metrics are collected across all pods and nodes.

```bash
kubectl top nodes
kubectl top pods -n zestify
```

The combination of min:2 replicas and CPU-based scaling ensures availability during traffic spikes without over-provisioning at baseline load.

---

## Load Testing

Tool: `hey`

```bash
hey -n 10000 -c 100 https://zestify-surya.duckdns.org/
```

| Metric              | Result      |
| ------------------- | ----------- |
| Total Requests      | 10,000      |
| Successful (200 OK) | 10,000      |
| Success Rate        | 100%        |
| Average Latency     | 174 ms      |
| Throughput          | 556 req/sec |
| Downtime            | None        |

---

## Screenshots

### Application Homepage

![alt text](<Screenshot 2026-05-29 224753.png>)

### ArgoCD Synced Application

![alt text](<Screenshot 2026-05-29 225635.png>)

### GitHub Actions CI Success

![alt text](image.png)

### GitHub Actions CD Success

![alt text](image-1.png)

### HPA Autoscaling Output

![alt text](<Screenshot 2026-05-30 020043.png>)

### HTTPS Certificate Validation

![TLS Certificate](docs/screenshots/tls-certificate.png)

### Load Testing Results

![alt text](<Screenshot 2026-05-30 020020.png>)
![alt text](<Screenshot 2026-05-30 020026.png>)

### Monitoring

![alt text](<Screenshot 2026-05-29 230224.png>)
![alt text](<Screenshot 2026-05-29 230237.png>)

---

## Local Development

### Prerequisites

- Docker and Docker Compose
- Node.js 20+
- A `.env` file for each service (see `.env.example` files)

### Running with Docker Compose

```bash
git clone https://github.com/suryaparua-official/Microservice-Food-Delivery-Platform.git
cd Microservice-Food-Delivery-Platform

# Copy and fill in env files
cp .env.example .env

# Start all services
docker compose up --build
```

Frontend will be available at `http://localhost:5173`.

### Running a single service locally

```bash
cd services/auth
cp .env.example .env
# Fill in required values
npm install
npm run dev
```

---

## Environment Variables

### Root `.env.example`

```env
JWT_SEC=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
INTERNAL_SERVICE_KEY=
CLOUD_NAME=
CLOUD_API_KEY=
CLOUD_SECRET_KEY=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
RABBITMQ_URL=
MONGO_URI=
REDIS_URL=
DATABASE_URL=
KAFKA_BROKER=
GMAIL_USER=
GMAIL_PASS=
```

### Frontend `.env.example`

```env
VITE_GOOGLE_CLIENT_ID=
VITE_STRIPE_PUBLISHABLE_KEY=
VITE_INTERNAL_SERVICE_KEY=
VITE_AUTH_URL=
VITE_RESTAURANT_URL=
VITE_UTILS_URL=
VITE_REALTIME_URL=
VITE_RIDER_URL=
VITE_ADMIN_URL=
```

> For production, all variables are injected via GitHub Secrets → Kubernetes Secrets (backend) and Docker build-args (frontend VITE\_\* variables).

---

## Deployment Guide

### 1. Provision Infrastructure

```bash
cd terraform/environments/dev
terraform init
terraform plan
terraform apply
```

### 2. Configure GitHub Secrets

Add all secrets listed in the root `.env.example` and frontend `.env.example` to your GitHub repository under **Settings → Secrets and variables → Actions**.

Additional deployment secrets required:

```
DOCKERHUB_USERNAME
DOCKERHUB_TOKEN
WIF_PROVIDER
GCP_SERVICE_ACCOUNT
GKE_CLUSTER_NAME
GKE_CLUSTER_LOCATION
```

### 3. Install Cluster Prerequisites

```bash
# cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/latest/download/cert-manager.yaml

# NGINX Ingress Controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/cloud/deploy.yaml

# Metrics Server
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
```

### 4. Install ArgoCD and Apply App

```bash
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
kubectl apply -f k8s/argocd-app.yml
```

### 5. Trigger Deployment

Push to `main`. The GitHub Actions CI/CD pipeline will build, scan, push images, update manifests, and ArgoCD will sync the cluster automatically.

---

## Deployment Validation Checklist

| Category         | Item                       | Status |
| ---------------- | -------------------------- | ------ |
| Infrastructure   | Terraform Provisioned      | Done   |
| Infrastructure   | GKE Running                | Done   |
| Infrastructure   | Node Pools Running         | Done   |
| Containerization | Docker Images Built        | Done   |
| Containerization | Images Pushed to DockerHub | Done   |
| CI/CD            | GitHub Actions CI          | Done   |
| CI/CD            | GitHub Actions CD          | Done   |
| GitOps           | ArgoCD Synced              | Done   |
| GitOps           | Healthy Application        | Done   |
| Networking       | Ingress Configured         | Done   |
| Networking       | External Load Balancer     | Done   |
| Networking       | Domain Mapped              | Done   |
| Security         | HTTPS Enabled              | Done   |
| Security         | TLS Certificate Issued     | Done   |
| Security         | Google OAuth Working       | Done   |
| Scaling          | Metrics Server Installed   | Done   |
| Scaling          | HPA Configured             | Done   |
| Scaling          | Autoscaling Operational    | Done   |
| Performance      | Load Testing Completed     | Done   |
| Performance      | 10,000 Successful Requests | Done   |

---

## License

[MIT](LICENSE.md)
