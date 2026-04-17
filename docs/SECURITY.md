# Security

This document describes MyCCmetrics' security posture, secret-management practices, and the incident / rotation procedures to follow when something is exposed.

## Threat model

MyCCmetrics is an authenticated proxy that sits between Clever Cloud users and two upstream APIs:

- **CC REST API** (OAuth 1.0a) — organisations, applications, add-ons.
- **Warp10** — time-series metrics, accessed with a per-org read token.

The assets worth protecting, in order of criticality:

1. **User OAuth tokens** — stored encrypted at rest, used to act on behalf of the user.
2. **OAuth consumer secret** — allows anyone to impersonate *the MyCCmetrics app itself* in front of CC users.
3. **Warp10 read tokens** — scoped to an organisation; one token lets a holder read every metric of every resource in that org.
4. **User session cookies** — grant API access for the session lifetime.

The primary adversary we guard against is an **authenticated user reaching data of another user's organisation** (tenant isolation).

## Authentication

- OAuth 1.0a, HMAC-SHA1, nonce = random UUID v4, request timestamp refreshed on every call.
- CC's `_query` token endpoints are used (the non-`_query` variants return 500 on CC).
- Access token + token secret are encrypted with **AES-256-GCM** and stored in the `users` table. The 12-byte nonces for token and secret are stored concatenated in `oauth_nonce`.
- Sessions are server-side: a `myccmetrics.sid` cookie references a row in the `tower_sessions.session` Postgres table. Cookie flags: `HttpOnly; Secure; SameSite=Lax`.
- `ENCRYPTION_KEY` is a 32-byte key, base64-encoded in the environment. The app **refuses to boot** in production (`APP_ENV=production`) if this is not set.

## Authorization (tenant isolation)

Every org-scoped endpoint calls `require_org_member()` before doing any work:

- `GET /api/organisations/{orgId}/applications`
- `GET /api/organisations/{orgId}/addons`
- `GET /api/metrics/{orgId}/{appId}`

The check fetches the user's org list via `GET /v2/organisations` (cached 5 min per-user) and returns **403 Forbidden** if `orgId` is not in the list. This gate is placed **before** the Warp10 token DB cache lookup, so a cached token for an org cannot be served to a non-member.

### Path parameter validation

`org_id`, `app_id` and `resource_id` are restricted to `^[a-zA-Z0-9_-]{1,128}$` before they reach any template or `format!`. This blocks WarpScript injection via path-level input (the Warp10 `FETCH` uses single-quoted string literals; any `'`, `{`, `}` in the input would break out of the literal and inject code).

## Transport & network hardening

Backend response headers (set globally via `tower_http::SetResponseHeaderLayer`):

- `Strict-Transport-Security: max-age=63072000; includeSubDomains`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`

Frontend (Next.js `next.config.ts`) adds a `Content-Security-Policy` plus the same four headers and a `Permissions-Policy` disabling camera / microphone / geolocation.

**Rate limiting:** `tower_governor` with `SmartIpKeyExtractor` (reads `X-Forwarded-For` from the Clever Cloud edge), 1 req/s sustained, burst 60, per client IP. Clients exceeding this receive HTTP 429.

**CORS:** single allowed origin (`FRONTEND_URL`), credentials enabled, methods limited to GET/POST/OPTIONS. The deployed topology routes all API traffic through a Next.js rewrite, so the browser never makes cross-origin requests in practice.

## Logging

Logs **must not** contain:

- OAuth access tokens or access secrets (user or consumer side)
- Warp10 read tokens
- OAuth signature `base_string` (reveals tokens and nonces even if the signature itself is HMAC-protected)
- Raw bodies of `/v2/oauth/*` calls (they contain `oauth_token=…&oauth_token_secret=…`)

`RUST_LOG` defaults to `info` in production. Do not enable `debug` on the backend without first reviewing that none of the above has been re-introduced.

## Required environment variables

| Variable | Required in prod | Notes |
|---|---|---|
| `APP_ENV` | Yes (`production`) | Triggers strict-mode checks below |
| `ENCRYPTION_KEY` | Yes | Base64 of 32 bytes. `openssl rand -base64 32` |
| `CC_OAUTH_CONSUMER_KEY` | Yes | From CC OAuth consumer |
| `CC_OAUTH_CONSUMER_SECRET` | Yes | From CC OAuth consumer |
| `DATABASE_URL` / `POSTGRESQL_ADDON_URI` | Yes | Postgres DSN |
| `FRONTEND_URL` | Yes | Exact origin; used for CORS + redirects |
| `APP_URL` | Recommended | Public URL of the backend, used to build the OAuth callback |

In dev (`APP_ENV` unset or `development`), `ENCRYPTION_KEY` falls back to a per-process random key and a warning is logged. Stored tokens become unreadable on restart, forcing users to sign in again — this is the intended trade-off.

## Secret rotation

Any suspicion that a secret has leaked → rotate immediately.

### `ENCRYPTION_KEY`

Rotating the key invalidates every encrypted OAuth token in the `users` table and every cached Warp10 token in `warp10_tokens`. All users will be logged out and must sign in again.

```sh
openssl rand -base64 32
clever env set ENCRYPTION_KEY '<new-key>' -a myccmetrics-backend
clever restart -a myccmetrics-backend
# Optional: clear stale rows so the next sign-in starts clean.
psql "$DATABASE_URL" -c 'TRUNCATE warp10_tokens; TRUNCATE users CASCADE;'
```

### `CC_OAUTH_CONSUMER_SECRET`

Rotating the consumer secret breaks every signed-in user (their access tokens remain valid at CC, but new OAuth calls from the backend fail signature verification).

1. Go to the Clever Cloud console → your OAuth consumer → generate a new secret.
2. `clever env set CC_OAUTH_CONSUMER_SECRET '<new-secret>' -a myccmetrics-backend`
3. `clever restart -a myccmetrics-backend`
4. Truncate `users` so everyone gets a clean re-auth.

### Database password

Rotate via the Clever Cloud console of the PostgreSQL add-on. The `POSTGRESQL_ADDON_URI` is updated automatically and the app is restarted.

### Session cookies

There is no cookie-signing secret to rotate (sessions are opaque IDs looked up in Postgres). Invalidate all sessions by truncating `tower_sessions.session` and restarting.

## Incident response

1. **Rotate** the compromised secret first (see above). This stops the bleed.
2. **Review logs** (`clever logs -a <app>`) for unexpected 200s on `/api/organisations/*/applications`, `/api/organisations/*/addons`, or `/api/metrics/*` — confirm the IDOR gate returned 403 on cross-org attempts. Logs are retained on Clever Cloud for the add-on's default window.
3. **Check the DB** — `SELECT id, cc_user_id, last_login_at FROM users ORDER BY last_login_at DESC` for unexpected activity.
4. **Force re-authentication** by truncating `users` and `tower_sessions.session` after rotation if the leak predates the rotation.
5. **Post-mortem** — document how the secret leaked and patch the root cause (CI, local `.env`, logs, etc.).

## Known limitations

- **Single OAuth consumer** — every MyCCmetrics user shares the same CC OAuth app. A consumer-secret leak requires coordinated rotation.
- **Rate limiting is per-IP** — NAT'd users share a quota. Tune `per_second` / `burst_size` in `main.rs` if false positives appear.
- **CSP allows `'unsafe-inline'` and `'unsafe-eval'`** — required by Next.js + echarts today. Move to nonce-based CSP if/when the upstream tooling supports it cleanly.
- **No audit log** — actions are not persisted to a separate audit table; forensic work depends on CC's log retention.

## Reporting a vulnerability

Email `frederic@lempire.co` with a description and, if possible, a minimal reproduction. Please do not file a public GitHub issue for undisclosed vulnerabilities.
