# How to Retrieve Clever Cloud Metrics via Warp10

This document explains how MyCCmetrics retrieves system metrics (CPU, Memory, Network, Disk) from Clever Cloud's Warp10 time-series database. It covers the authentication flow, the WarpScript query language, and the pitfalls we encountered in production.

## Overview

Clever Cloud stores all application and add-on metrics in a [Warp10](https://www.warp10.io/) instance. Metrics are **not** retrieved through the standard CC REST API — instead, you query Warp10 directly using **WarpScript**, a stack-based query language.

```
┌──────────────┐     OAuth 1.0a      ┌──────────────────┐
│  Your App    │ ──────────────────► │ CC API v2         │
│              │  GET /v2/metrics/   │                   │
│              │  read/{orgId}       │  Returns: Warp10  │
│              │ ◄────────────────── │  read token       │
└──────┬───────┘                     └──────────────────┘
       │
       │  POST WarpScript
       ▼
┌──────────────────────────────────────────────────────┐
│  Warp10 Endpoint                                      │
│  https://c2-warp10-clevercloud-customers              │
│         .services.clever-cloud.com/api/v0/exec        │
└──────────────────────────────────────────────────────┘
```

## Step 1: Get a Warp10 Read Token

The Warp10 read token is obtained from the CC API. It is scoped to an **organisation** (not a single app) and is valid for **5 days**.

```
GET https://api.clever-cloud.com/v2/metrics/read/{orgId}
Authorization: OAuth ... (signed with consumer + user tokens)
```

**Response:** Raw string (NOT JSON) — this IS the Warp10 token.

**Caching strategy:** Cache for 4.5 days (leave a 12-hour margin before expiry). One token per organisation covers all apps and add-ons in that org.

## Step 2: Query Warp10 with WarpScript

Send a POST request with WarpScript code as the body:

```
POST https://c2-warp10-clevercloud-customers.services.clever-cloud.com/api/v0/exec
Content-Type: application/x-warp10-warpscript
Body: <WarpScript code>
```

No authentication header is needed — the token is embedded in the WarpScript itself.

## Metric Class Names

Clever Cloud uses the following Warp10 metric classes. **These names differ from what you might expect** — the CPU classes use `cpu.usage_*`, not `cpu.*`.

| Metric | Warp10 Class | Unit | Notes |
|--------|-------------|------|-------|
| CPU user | `cpu.usage_user` | percentage | NOT `cpu.user` |
| CPU system | `cpu.usage_system` | percentage | NOT `cpu.system` |
| CPU iowait | `cpu.usage_iowait` | percentage | NOT `cpu.iowait` |
| CPU idle | `cpu.usage_idle` | percentage | |
| Memory used % | `mem.used_percent` | percentage | |
| Memory used | `mem.used` | bytes | |
| Network in | `net.bytes_recv` | bytes (cumulative) | Counter — must compute rate |
| Network out | `net.bytes_sent` | bytes (cumulative) | Counter — must compute rate |
| Disk used % | `disk.used_percent` | percentage | |
| Disk used | `disk.used` | bytes | |
| Disk total | `disk.total` | bytes | |

Full reference: https://www.clever.cloud/developers/doc/metrics/#classes

## Labels

Metrics are tagged with these labels:

| Label | Description |
|-------|-------------|
| `app_id` | Application or add-on resource ID |
| `owner_id` | Organisation ID |
| `host` | Hypervisor ID |
| `deployment_id` | Deployment identifier |
| `vm_type` | `volatile` or `persistent` |

**For applications**, `app_id` is the app ID (e.g., `app_c83fd3f9-...`).

**For add-ons**, `app_id` is the **realId** (e.g., `postgresql_ff38619b-...`), NOT the addon ID (`addon_xxx`). See the [Add-on Pitfall](#add-on-pitfall-realid-not-id) section below.

## WarpScript Templates

### CPU

```warpscript
[ 'READ_TOKEN' 'cpu.usage_user' { 'app_id' 'app_xxx' } NOW 1 h ] FETCH
MERGE 'cpu.usage_user' RENAME
[ SWAP bucketizer.mean 0 60000000 0 ] BUCKETIZE

[ 'READ_TOKEN' 'cpu.usage_system' { 'app_id' 'app_xxx' } NOW 1 h ] FETCH
MERGE 'cpu.usage_system' RENAME
[ SWAP bucketizer.mean 0 60000000 0 ] BUCKETIZE

[ 'READ_TOKEN' 'cpu.usage_iowait' { 'app_id' 'app_xxx' } NOW 1 h ] FETCH
MERGE 'cpu.usage_iowait' RENAME
[ SWAP bucketizer.mean 0 60000000 0 ] BUCKETIZE
```

Each CPU sub-metric is fetched separately to preserve the class name. `MERGE` combines multiple instances (before/after restart) into a single GTS before bucketing.

### Memory

```warpscript
[ 'READ_TOKEN' 'mem.used_percent' { 'app_id' 'app_xxx' } NOW 1 h ] FETCH
MERGE 'mem.used_percent' RENAME
[ SWAP bucketizer.mean 0 60000000 0 ] BUCKETIZE
```

### Network (rate computation)

Network metrics are **cumulative counters** (monotonically increasing). You must compute the rate (bytes/sec).

**CRITICAL:** Compute `mapper.rate` **BEFORE** `MERGE`. If you MERGE first, the counter values from different instances get interleaved, and the rate computation produces massive false spikes (e.g., 140 GB/s instead of 290 KB/s) at instance transitions.

```warpscript
[ 'READ_TOKEN' 'net.bytes_recv' { 'app_id' 'app_xxx' } NOW 1 h ] FETCH
[ SWAP mapper.rate 1 0 0 ] MAP
MERGE 'net.bytes_recv' RENAME
[ SWAP bucketizer.mean 0 60000000 0 ] BUCKETIZE
'net_recv' STORE

[ 'READ_TOKEN' 'net.bytes_sent' { 'app_id' 'app_xxx' } NOW 1 h ] FETCH
[ SWAP mapper.rate 1 0 0 ] MAP
MERGE 'net.bytes_sent' RENAME
[ SWAP bucketizer.mean 0 60000000 0 ] BUCKETIZE
'net_sent' STORE

$net_recv $net_sent
```

`mapper.rate` computes the derivative (value change per second) **per instance**. Then `MERGE` combines the rates into a single series. Counter resets may still produce negative values — filter them out in your application code (discard any data point where value < 0).

### Disk

```warpscript
[ 'READ_TOKEN' 'disk.used_percent' { 'app_id' 'app_xxx' } NOW 1 h ] FETCH
MERGE 'disk.used_percent' RENAME
[ SWAP bucketizer.last 0 60000000 0 ] BUCKETIZE
```

Disk uses `bucketizer.last` instead of `bucketizer.mean` because disk usage changes slowly.

## WarpScript Key Concepts

### FETCH

```warpscript
[ 'TOKEN' 'class_name' { 'label' 'value' } NOW duration ] FETCH
```

Returns a list of GTS (Geo Time Series) matching the class and labels within the time window.

### MERGE

```warpscript
MERGE
```

Combines all GTS from a FETCH into a single GTS. **Essential** when an app has multiple instances (e.g., before and after a restart) — without MERGE, subsequent operations may produce empty results on fragmented data.

### BUCKETIZE

```warpscript
[ gts_list bucketizer.mean 0 bucket_span_us 0 ] BUCKETIZE
```

Groups data points into fixed-size time buckets. The bucket span is in **microseconds** (e.g., `60000000` = 1 minute).

### MAP (for rates)

```warpscript
[ gts_list mapper.rate 1 0 0 ] MAP
```

Computes the rate of change. The `1 0 0` means: look at 1 point before, 0 points after, compute on minimum 0 points.

## Warp10 Response Format

The `/api/v0/exec` endpoint returns JSON. Each result on the WarpScript stack becomes an element in the response array.

A GTS looks like:

```json
{
  "c": "cpu.usage_user",
  "l": { "app_id": "app_xxx", "host": "..." },
  "a": {},
  "v": [
    [1776200000000000, 23.5],
    [1776200060000000, 24.1]
  ]
}
```

| Field | Description |
|-------|-------------|
| `c` | Class name |
| `l` | Labels (metadata) |
| `a` | Attributes |
| `v` | Values: `[[timestamp_us, value], ...]` or `[[timestamp_us, lat, lon, alt, value], ...]` |

**Timestamps are in MICROSECONDS** (not milliseconds). Divide by 1,000 to get JavaScript-compatible milliseconds.

**Values can be mixed types:** Sometimes a String (`"0.31"`), sometimes a Double, sometimes an Int. Your parser must handle all three.

## Critical Pitfalls

### 1. Timestamps are Microseconds

Warp10 uses microsecond precision. Divide by 1,000 for JavaScript `Date` compatibility (milliseconds).

### 2. Network Values are Cumulative Counters

`net.bytes_recv` and `net.bytes_sent` are monotonically increasing counters. You **must** compute the rate using `mapper.rate`. **Compute the rate per-instance BEFORE merging** — if you MERGE the raw counters first, instance transitions cause the counter to jump by billions, producing rates of 140+ GB/s instead of the real ~290 KB/s. Negative rates indicate counter resets (new deployment) — discard or zero them out in your application code.

### 3. Use MERGE, not REDUCE, for Multi-Instance Apps

When an app is stopped and restarted, it gets a new instance with a new `deployment_id`. The old and new instances produce separate GTS. 

**Do NOT use** `[ gts_list [ 'app_id' ] reducer.mean ] REDUCE` — this creates empty buckets in the gap between instances and produces 0 data points.

**Use** `MERGE` instead — it combines all points from all instances into a single GTS, then BUCKETIZE works correctly across the gap.

### 4. Add-on Pitfall: realId, not id

Add-ons have two identifiers:
- `id`: the Clever Cloud internal ID (e.g., `addon_ad337a38-...`)
- `realId`: the provider ID (e.g., `postgresql_ff38619b-...`)

Warp10 metrics are indexed by `realId`, not `id`. When querying add-on metrics, use the `realId` as the `app_id` label value:

```warpscript
[ 'TOKEN' 'cpu.usage_user' { 'app_id' 'postgresql_ff38619b-...' } NOW 1 h ] FETCH
```

The `realId` is available in the CC API response for `GET /v2/organisations/{orgId}/addons` as the `realId` field (camelCase in JSON).

### 5. CC OAuth Endpoint: Use `_query` Variants

The standard OAuth endpoints (`/v2/oauth/request_token`, `/v2/oauth/access_token`) return HTTP 500 on Clever Cloud. Use the `_query` variants instead:

```
POST /v2/oauth/request_token_query?oauth_callback=...&oauth_consumer_key=...&...
POST /v2/oauth/access_token_query?oauth_consumer_key=...&oauth_token=...&...
```

These accept OAuth parameters as **query string parameters** instead of the Authorization header.

### 6. CPU Class Names Have `usage_` Prefix

The CC documentation at https://www.clever.cloud/developers/doc/metrics/#classes lists the correct class names. CPU metrics use `cpu.usage_user`, `cpu.usage_system`, `cpu.usage_iowait` — not `cpu.user`, `cpu.system`, `cpu.iowait`.

### 7. Bucket Span is in Microseconds

The BUCKETIZE function expects the bucket span in microseconds:
- 10 seconds = `10000000`
- 1 minute = `60000000`
- 5 minutes = `300000000`
- 1 hour = `3600000000`

### 8. Network Rate: mapper.rate BEFORE MERGE

For network counters, always apply `mapper.rate` on the raw per-instance GTS **before** calling `MERGE`. The order matters:

```
CORRECT:  FETCH → mapper.rate (per instance) → MERGE → BUCKETIZE
WRONG:    FETCH → MERGE → mapper.rate → BUCKETIZE
```

The wrong order merges raw cumulative counter values from different instances. When instance A has counter value 50 billion and instance B starts at 0, the rate computation sees a jump of -50 billion, producing absurd values.

## Recommended Bucket Spans by Duration

| Query Duration | Bucket Span | Points (~) |
|---------------|-------------|-----------|
| 5 min | 10s | 30 |
| 15 min | 10s | 90 |
| 1 hour | 1 min | 60 |
| 6 hours | 5 min | 72 |
| 24 hours | 15 min | 96 |
| 7 days | 1 hour | 168 |
| 30 days | 4 hours | 180 |

## WarpScript Reference

- FETCH: https://www.warp10.io/doc/FETCH
- BUCKETIZE: https://www.warp10.io/doc/BUCKETIZE
- MERGE: https://www.warp10.io/doc/MERGE
- MAP: https://www.warp10.io/doc/MAP
- mapper.rate: https://www.warp10.io/doc/mapper.rate
- bucketizer.mean: https://www.warp10.io/doc/bucketizer.mean
- Full reference: https://www.warp10.io/doc/reference
