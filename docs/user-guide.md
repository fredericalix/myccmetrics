# MyCCmetrics User Guide

MyCCmetrics is a real-time monitoring dashboard for Clever Cloud applications and add-ons. It displays CPU, Memory, Network, and Disk metrics with interactive charts.

## Getting Started

### Sign In

1. Open [https://myccmetrics.cleverapps.io](https://myccmetrics.cleverapps.io)
2. Click **Sign in with Clever Cloud**
3. You will be redirected to the Clever Cloud authorization page
4. Click **Allow** to grant MyCCmetrics access to your account
5. You will be redirected to the dashboard

MyCCmetrics requests read access to your organisations, applications, and add-ons. It does not modify anything on your Clever Cloud account.

### Sign Out

Click your avatar in the top-right corner of the header, then click **Sign out**.

## Dashboard Overview

After signing in, you land on the **Organisations** page. This page lists all Clever Cloud organisations you have access to, including your personal space.

### Navigation

The **sidebar** (left panel) shows all your organisations with their applications and add-ons:

- **Applications** are marked with a blue icon
- **Add-ons** (PostgreSQL, MySQL, Cellar, etc.) are marked with a green icon
- Click any resource to view its metrics
- The currently selected resource is highlighted with a cherry-red left border
- Organisation names appear as section headers — click them to expand/collapse

On mobile devices, the sidebar is hidden. Tap the **hamburger menu** icon in the top-left corner to open it.

### Dark Mode

Click the **sun/moon icon** in the top-right corner to toggle between light and dark themes. The setting follows your system preference by default.

## Metrics Dashboard

When you click on an application or add-on, you see four metric panels:

### CPU Usage

- **Type:** Stacked area chart
- **Series:** `cpu.usage_user` (blue), `cpu.usage_system` (orange), `cpu.usage_iowait` (red)
- **Unit:** Percentage (0–100%)
- **What it shows:** How much CPU time is spent in user code, system calls, and waiting for I/O

**Tips:**
- A healthy app typically shows low and stable CPU usage
- Spikes in `iowait` indicate disk or network bottlenecks
- Sustained high `user` CPU may indicate the need to scale up

### Memory Usage

- **Type:** Area chart with gradient fill
- **Series:** `mem.used_percent`
- **Unit:** Percentage (0–100%)
- **What it shows:** How much of the allocated RAM is in use

**Tips:**
- Memory usage above 90% may trigger OOM kills
- A steadily rising memory graph without drops may indicate a memory leak
- After a deployment, memory usage typically resets

### Network I/O

- **Type:** Dual-line chart
- **Series:** Received (green), Sent (amber)
- **Unit:** Bytes per second (auto-scaled to KB/s, MB/s)
- **What it shows:** Inbound and outbound network traffic rates

**Tips:**
- Spikes in received traffic often correlate with incoming request bursts
- High sent traffic indicates large responses (API payloads, file downloads)
- After a restart, there may be a brief gap in network data

### Disk Usage

- **Type:** Area chart with gradient fill
- **Series:** `disk.used_percent`
- **Unit:** Percentage (0–100%)
- **What it shows:** How much of the allocated disk space is in use

**Tips:**
- Disk usage above 90% can cause application failures
- Log files and temporary data are common causes of disk growth
- Clever Cloud persistent storage retains data across deployments

## Time Range Selection

Above the charts, you will find duration buttons:

| Button | Window | Resolution | Use case |
|--------|--------|------------|----------|
| **1h** | Last hour | 1 min | Recent activity, debugging a current issue |
| **6h** | Last 6 hours | 5 min | Morning/afternoon trends |
| **24h** | Last 24 hours | 15 min | Daily patterns, overnight behavior |
| **7d** | Last 7 days | 1 hour | Weekly trends, deploy impact over time |
| **30d** | Last 30 days | 4 hours | Long-term capacity planning |

Click any button to switch the time window. All four charts update simultaneously.

## Live Mode

The **Live** button enables real-time monitoring:

1. Click the **Live** button (it turns cherry-red with a pulsing icon)
2. Charts switch to a **15-minute window** with **10-second resolution**
3. Data refreshes automatically every **10 seconds**
4. The duration buttons are disabled while Live mode is active
5. Click **Live** again to return to normal mode

**When to use Live mode:**
- During a deployment — watch CPU and memory as the new version starts
- Load testing — observe network and CPU in real time
- Debugging a production issue — see the immediate impact of your changes
- After scaling — verify that resource usage distributes correctly

**Note:** In normal mode (Live off), charts refresh every 60 seconds. A 30-second server-side cache avoids redundant queries to the metrics backend.

## Chart Interactions

All charts support interactive features:

### Zoom

- **Mouse wheel:** Scroll to zoom in/out on the time axis
- **Click and drag:** Select a time range to zoom into
- **Slider:** Use the bottom slider to adjust the visible time window

### Toolbar

In the top-right corner of each chart, you will find icons for:

- **Zoom** — Enter zoom selection mode
- **Restore** — Reset the chart to its original view
- **Save as Image** — Download the chart as a PNG file

### Tooltip

Hover over any point on a chart to see the exact timestamp and value. The tooltip shows all series values at that point in time.

## Applications vs Add-ons

MyCCmetrics monitors both applications and add-ons, but there are differences:

### Applications

Applications (Docker, Node.js, Rust, Java, etc.) are your deployed code. Metrics are indexed by the application ID (`app_xxx`). All four metric panels are available.

### Add-ons

Add-ons (PostgreSQL, MySQL, Redis, Cellar, etc.) are managed services. Metrics are indexed by the **provider ID** (e.g., `postgresql_xxx`, `mysql_xxx`), which is different from the add-on ID shown in the Clever Cloud console.

In the sidebar, clicking an add-on automatically uses the correct provider ID. All four metric panels are available for add-ons that report system metrics.

## Troubleshooting

### "No resources" shown for an organisation

Your OAuth token may not have sufficient permissions. Sign out and sign back in. If prompted, make sure to **Allow** all requested permissions (Manage organisations, applications, and add-ons).

### Charts show "Failed to load metrics"

- The application or add-on may be stopped — metrics are only collected while the resource is running
- Click **Retry** to attempt loading again
- Check that the application exists and is accessible in the Clever Cloud console

### Empty charts after stopping and restarting an app

After a restart, it takes 1–2 minutes for metrics collection to resume. During the stop period, no data points are recorded. The charts will show a gap for the downtime period, which is normal behavior.

If you switch to a longer time range (e.g., 6h or 24h), you should see data from before the stop.

### Login redirects back to the home page

- Clear your browser cookies for `myccmetrics.cleverapps.io` and try again
- Make sure third-party cookies are not blocked in your browser settings
- Try using a private/incognito window

### "Too many requests" (HTTP 429)

MyCCmetrics rate-limits API traffic to 1 request/second sustained with a burst of 60 per client IP. If you see a 429 or charts stop refreshing, wait a minute and reload. Shared IPs (corporate NAT, VPN) can hit the limit collectively.

### "Forbidden" when opening an organisation or app

The backend rejects any request for a resource whose organisation you are not a member of. If you have just been added to an organisation on Clever Cloud, sign out and back in to refresh your membership — the backend caches your org list for 5 minutes.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Click chart + scroll | Zoom in/out |
| Click + drag on chart | Select time range |
| Double-click chart | Reset zoom |

## Browser Support

MyCCmetrics works on all modern browsers:

- Chrome 90+
- Firefox 90+
- Safari 16+
- Edge 90+

Mobile browsers (iOS Safari, Chrome for Android) are fully supported with a responsive layout.
