# MyCCmetrics

Real-time monitoring dashboard for Clever Cloud applications and add-ons. View CPU, Memory, Network, and Disk metrics with interactive charts.

## Architecture

```
Browser → Next.js frontend (proxy /auth/* /api/*) → Rust/Axum backend → Warp10 + CC API
                                                          ↓
                                                     PostgreSQL
```

- **Backend:** Rust/Axum — OAuth 1.0a authentication, CC API proxy, Warp10 metrics querying, in-memory cache (30s TTL)
- **Frontend:** Next.js 16 — ECharts dashboards, shadcn/ui components, dark mode, PlusJakartaSans font, Clever Cloud brand colors
- **Database:** PostgreSQL — user sessions, encrypted OAuth tokens (AES-256-GCM), Warp10 token cache
- **Metrics:** Direct WarpScript queries to Clever Cloud's Warp10 instance
- **Proxy:** Next.js rewrites `/auth/*` and `/api/*` to the backend (same-origin cookies, no CORS issues)

## Features

- OAuth 1.0a login with Clever Cloud
- Browse organisations, applications, and add-ons
- 4 metric panels: CPU, Memory, Network I/O, Disk
- Time range selector: 1h, 6h, 24h, 7d, 30d
- Live mode: 15-minute window, 10-second refresh
- Dark/light theme toggle
- Mobile responsive
- In-app documentation

## Local Development

### Prerequisites

- Rust (latest stable)
- Node.js 22+
- PostgreSQL
- A Clever Cloud OAuth consumer (create one in the CC console)

### Backend

```bash
cd backend-server
cp .env.example .env
# Edit .env with your database URL and OAuth credentials
cargo run
```

### Frontend

```bash
cd frontend-server
cp .env.local.example .env.local
npm install
npm run dev
```

## Deployment on Clever Cloud

This is a monorepo deployed as two separate Clever Cloud applications using the `APP_FOLDER` pattern.

### 1. Create the OAuth Consumer

In the Clever Cloud console, go to **OAuth Consumers** and create a new consumer:

- **Name:** MyCCmetrics
- **Base URL:** `https://myccmetrics.cleverapps.io`
- **Access rights:** Access all
- **Manage rights:** Manage all

### 2. Backend (Rust runtime)

```bash
export CC_ORGA=<your_org_id>

clever create myccmetrics-backend --type rust --org $CC_ORGA --region par
clever scale --build-flavor S
clever service link-addon <postgresql-addon-id>

clever env set APP_FOLDER ./backend-server
clever env set PORT 8080
clever env set FRONTEND_URL https://myccmetrics.cleverapps.io
clever env set APP_URL https://myccmetrics.cleverapps.io
clever env set CC_OAUTH_CONSUMER_KEY "<key>"
clever env set CC_OAUTH_CONSUMER_SECRET "<secret>"
clever env set ENCRYPTION_KEY "$(openssl rand -base64 32)"
clever env set WARP10_ENDPOINT https://c2-warp10-clevercloud-customers.services.clever-cloud.com/api/v0/exec
clever env set CC_API_BASE_URL https://api.clever-cloud.com
clever env set RUST_LOG info

clever deploy
```

### 3. Frontend (Node.js runtime)

The frontend domain (`myccmetrics.cleverapps.io`) must match the OAuth consumer Base URL, since the Next.js proxy handles `/auth/callback`.

```bash
clever create myccmetrics-frontend --type node --org $CC_ORGA --region par
clever scale --build-flavor S
clever domain add myccmetrics.cleverapps.io

clever env set APP_FOLDER ./frontend-server
clever env set PORT 8080
clever env set BACKEND_INTERNAL_URL https://<backend-auto-domain>.cleverapps.io
clever env set CC_NODE_DEV_DEPENDENCIES install
clever env set CC_POST_BUILD_HOOK "npm --prefix ./frontend-server/ run build"
clever env set CC_RUN_COMMAND "npm --prefix ./frontend-server/ run start"

clever deploy
```

**Important:** `BACKEND_INTERNAL_URL` must point to the backend's auto-assigned domain (e.g., `https://app-xxxx.cleverapps.io`), not the public domain. This is used by Next.js rewrites to proxy API calls.

### 4. Verify

- `https://myccmetrics.cleverapps.io/` — login page
- `https://myccmetrics.cleverapps.io/auth/login` — starts OAuth flow
- `https://myccmetrics.cleverapps.io/dashboard` — dashboard (after login)
- `https://myccmetrics.cleverapps.io/dashboard/docs` — user guide

## Documentation

- [User Guide](docs/user-guide.md) — how to use the dashboard
- [Clever Cloud Metrics](docs/clever-cloud-metrics.md) — technical reference for Warp10 metrics retrieval, WarpScript templates, and pitfalls
