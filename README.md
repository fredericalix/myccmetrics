# MyCCmetrics

Real-time monitoring dashboard for Clever Cloud applications. View CPU, Memory, Network, and Disk metrics with interactive charts.

## Architecture

- **Backend:** Rust/Axum — OAuth 1.0a authentication, CC API proxy, Warp10 metrics querying
- **Frontend:** Next.js 16 — ECharts dashboards, shadcn/ui components, dark mode
- **Database:** PostgreSQL — user sessions, encrypted OAuth tokens, Warp10 token cache
- **Metrics:** Direct WarpScript queries to Clever Cloud's Warp10 instance

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
# Edit .env.local if backend is not on localhost:8080
npm install
npm run dev
```

## Deployment on Clever Cloud

This is a monorepo deployed as two separate Clever Cloud applications using the `APP_FOLDER` pattern.

### Backend (Docker runtime)

```bash
export CC_ORGA=app_c83fd3f9-bb6b-467b-a2d2-63ecab9f8ea8
clever create myccmetrics-backend --type docker --org $CC_ORGA --region par
clever config update --enable-force-https
clever scale --build-flavor M
clever addon create postgresql-addon myccmetrics-db --link myccmetrics-backend --plan s_sml --yes
clever env set APP_FOLDER ./backend-server
clever env set PORT 8080
clever env set FRONTEND_URL https://<frontend-domain>.cleverapps.io
clever env set APP_URL https://<backend-domain>.cleverapps.io
clever env set CC_OAUTH_CONSUMER_KEY "<key>"
clever env set CC_OAUTH_CONSUMER_SECRET "<secret>"
clever env set ENCRYPTION_KEY "$(openssl rand -base64 32)"
clever env set RUST_LOG info
clever deploy
```

### Frontend (Node.js runtime)

```bash
clever create myccmetrics-frontend --type node --org $CC_ORGA --region par
clever config update --enable-force-https
clever scale --flavor nano --build-flavor S
clever env set APP_FOLDER ./frontend-server
clever env set PORT 8080
clever env set NEXT_PUBLIC_API_URL https://<backend-domain>.cleverapps.io
clever env set CC_NODE_DEV_DEPENDENCIES install
clever env set CC_POST_BUILD_HOOK "npm --prefix ./frontend-server/ run build"
clever deploy
```

### OAuth Consumer Setup

1. Go to Clever Cloud console > OAuth Consumers
2. Create a new consumer for MyCCmetrics
3. Set the callback URL to `https://<backend-domain>.cleverapps.io/auth/callback`
4. Copy the consumer key and secret to the backend environment variables
