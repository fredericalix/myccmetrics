"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  LogIn,
  LayoutDashboard,
  Cpu,
  MemoryStick,
  Network,
  HardDrive,
  Clock,
  Radio,
  MousePointer,
  AppWindow,
  Database,
  AlertTriangle,
  Monitor,
} from "lucide-react";

const TOC = [
  { id: "getting-started", label: "Getting Started", icon: LogIn },
  { id: "dashboard", label: "Dashboard Overview", icon: LayoutDashboard },
  { id: "cpu", label: "CPU Usage", icon: Cpu },
  { id: "memory", label: "Memory Usage", icon: MemoryStick },
  { id: "network", label: "Network I/O", icon: Network },
  { id: "disk", label: "Disk Usage", icon: HardDrive },
  { id: "time-range", label: "Time Range", icon: Clock },
  { id: "live-mode", label: "Live Mode", icon: Radio },
  { id: "interactions", label: "Chart Interactions", icon: MousePointer },
  { id: "apps-addons", label: "Apps vs Add-ons", icon: AppWindow },
  { id: "troubleshooting", label: "Troubleshooting", icon: AlertTriangle },
  { id: "browser-support", label: "Browser Support", icon: Monitor },
];

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState("getting-started");

  const scrollTo = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="flex gap-6 max-w-6xl mx-auto">
      {/* Table of Contents - desktop only */}
      <nav className="hidden lg:block w-56 shrink-0 sticky top-0 h-fit pt-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Documentation
        </h3>
        <ul className="space-y-1">
          {TOC.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => scrollTo(item.id)}
                className={cn(
                  "flex items-center gap-2 w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors",
                  activeSection === item.id
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent",
                )}
              >
                <item.icon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-8 pb-16">
        <div>
          <h1 className="text-2xl font-bold">User Guide</h1>
          <p className="text-muted-foreground mt-1">
            Learn how to use MyCCmetrics to monitor your Clever Cloud resources
          </p>
        </div>

        {/* Getting Started */}
        <Section id="getting-started" title="Getting Started" icon={LogIn}>
          <h3 className="font-semibold mb-2">Sign In</h3>
          <ol className="list-decimal list-inside space-y-1.5 text-sm text-foreground/80">
            <li>Open the MyCCmetrics home page</li>
            <li>Click <Kbd>Sign in with Clever Cloud</Kbd></li>
            <li>You will be redirected to the Clever Cloud authorization page</li>
            <li>Click <Kbd>Allow</Kbd> to grant access to your account</li>
            <li>You will be redirected to the dashboard</li>
          </ol>
          <Tip>
            MyCCmetrics only requests read access to your organisations, applications, and add-ons. It does not modify anything on your Clever Cloud account.
          </Tip>

          <h3 className="font-semibold mb-2 mt-6">Sign Out</h3>
          <p className="text-sm text-foreground/80">
            Click your avatar in the top-right corner of the header, then click <Kbd>Sign out</Kbd>.
          </p>
        </Section>

        {/* Dashboard Overview */}
        <Section id="dashboard" title="Dashboard Overview" icon={LayoutDashboard}>
          <h3 className="font-semibold mb-2">Sidebar Navigation</h3>
          <p className="text-sm text-foreground/80 mb-3">
            The sidebar shows all your organisations with their resources:
          </p>
          <ul className="space-y-2 text-sm text-foreground/80">
            <li className="flex items-center gap-2">
              <AppWindow className="h-4 w-4 text-blue-500 shrink-0" />
              <span><strong>Applications</strong> are marked with a blue icon</span>
            </li>
            <li className="flex items-center gap-2">
              <Database className="h-4 w-4 text-emerald-500 shrink-0" />
              <span><strong>Add-ons</strong> (PostgreSQL, MySQL, etc.) are marked with a green icon</span>
            </li>
          </ul>
          <p className="text-sm text-foreground/80 mt-3">
            Click any resource to view its metrics. The active resource is highlighted with a cherry-red left border.
            Organisation names appear as section headers — click to expand or collapse.
          </p>

          <h3 className="font-semibold mb-2 mt-6">Dark Mode</h3>
          <p className="text-sm text-foreground/80">
            Click the <strong>sun/moon icon</strong> in the header to toggle between light and dark themes.
            It follows your system preference by default.
          </p>

          <h3 className="font-semibold mb-2 mt-6">Mobile</h3>
          <p className="text-sm text-foreground/80">
            On mobile devices, the sidebar is hidden. Tap the <strong>hamburger menu</strong> icon in the top-left corner to open it.
          </p>
        </Section>

        {/* CPU */}
        <Section id="cpu" title="CPU Usage" icon={Cpu}>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <MetricBadge color="#3b82f6" label="User" />
            <MetricBadge color="#f97316" label="System" />
            <MetricBadge color="#ef4444" label="IO Wait" />
          </div>
          <p className="text-sm text-foreground/80 mb-3">
            Stacked area chart showing how CPU time is distributed between user code, system calls, and I/O wait. Values are in percentage (0–100%).
          </p>
          <h3 className="font-semibold mb-2">Tips</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-foreground/80">
            <li>A healthy app shows low and stable CPU usage</li>
            <li>Spikes in <strong>IO Wait</strong> indicate disk or network bottlenecks</li>
            <li>Sustained high <strong>User</strong> CPU may indicate the need to scale up</li>
          </ul>
        </Section>

        {/* Memory */}
        <Section id="memory" title="Memory Usage" icon={MemoryStick}>
          <div className="mb-4">
            <MetricBadge color="#8b5cf6" label="Used %" />
          </div>
          <p className="text-sm text-foreground/80 mb-3">
            Area chart showing the percentage of allocated RAM in use (0–100%).
          </p>
          <h3 className="font-semibold mb-2">Tips</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-foreground/80">
            <li>Usage above <strong>90%</strong> may trigger OOM (Out of Memory) kills</li>
            <li>A steadily rising graph without drops may indicate a <strong>memory leak</strong></li>
            <li>After a deployment, memory usage typically resets</li>
          </ul>
        </Section>

        {/* Network */}
        <Section id="network" title="Network I/O" icon={Network}>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <MetricBadge color="#10b981" label="Received" />
            <MetricBadge color="#f59e0b" label="Sent" />
          </div>
          <p className="text-sm text-foreground/80 mb-3">
            Dual-line chart showing inbound and outbound network traffic rates. Values are auto-scaled (B/s, KB/s, MB/s).
          </p>
          <h3 className="font-semibold mb-2">Tips</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-foreground/80">
            <li>Spikes in <strong>Received</strong> often correlate with incoming request bursts</li>
            <li>High <strong>Sent</strong> traffic indicates large responses or file downloads</li>
            <li>After a restart, there may be a brief gap in network data</li>
          </ul>
        </Section>

        {/* Disk */}
        <Section id="disk" title="Disk Usage" icon={HardDrive}>
          <div className="mb-4">
            <MetricBadge color="#6366f1" label="Used %" />
          </div>
          <p className="text-sm text-foreground/80 mb-3">
            Area chart showing disk space usage as a percentage (0–100%).
          </p>
          <h3 className="font-semibold mb-2">Tips</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-foreground/80">
            <li>Usage above <strong>90%</strong> can cause application failures</li>
            <li>Log files and temporary data are common causes of disk growth</li>
            <li>Clever Cloud persistent storage retains data across deployments</li>
          </ul>
        </Section>

        {/* Time Range */}
        <Section id="time-range" title="Time Range Selection" icon={Clock}>
          <p className="text-sm text-foreground/80 mb-4">
            Use the duration buttons above the charts to change the time window. All four panels update simultaneously.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-4 font-semibold">Button</th>
                  <th className="text-left py-2 pr-4 font-semibold">Window</th>
                  <th className="text-left py-2 pr-4 font-semibold">Resolution</th>
                  <th className="text-left py-2 font-semibold">Use case</th>
                </tr>
              </thead>
              <tbody className="text-foreground/80">
                <tr className="border-b border-border/50"><td className="py-2 pr-4 font-mono">1h</td><td className="py-2 pr-4">Last hour</td><td className="py-2 pr-4">1 min</td><td className="py-2">Debugging a current issue</td></tr>
                <tr className="border-b border-border/50"><td className="py-2 pr-4 font-mono">6h</td><td className="py-2 pr-4">Last 6 hours</td><td className="py-2 pr-4">5 min</td><td className="py-2">Morning/afternoon trends</td></tr>
                <tr className="border-b border-border/50"><td className="py-2 pr-4 font-mono">24h</td><td className="py-2 pr-4">Last 24 hours</td><td className="py-2 pr-4">15 min</td><td className="py-2">Daily patterns</td></tr>
                <tr className="border-b border-border/50"><td className="py-2 pr-4 font-mono">7d</td><td className="py-2 pr-4">Last 7 days</td><td className="py-2 pr-4">1 hour</td><td className="py-2">Weekly trends</td></tr>
                <tr><td className="py-2 pr-4 font-mono">30d</td><td className="py-2 pr-4">Last 30 days</td><td className="py-2 pr-4">4 hours</td><td className="py-2">Capacity planning</td></tr>
              </tbody>
            </table>
          </div>
        </Section>

        {/* Live Mode */}
        <Section id="live-mode" title="Live Mode" icon={Radio}>
          <p className="text-sm text-foreground/80 mb-3">
            The <strong>Live</strong> button enables real-time monitoring with a 15-minute window and 10-second refresh:
          </p>
          <ol className="list-decimal list-inside space-y-1.5 text-sm text-foreground/80 mb-4">
            <li>Click the <Kbd>Live</Kbd> button (it turns cherry-red with a pulsing icon)</li>
            <li>Charts switch to a <strong>15-minute window</strong> with <strong>10-second resolution</strong></li>
            <li>Data refreshes automatically every <strong>10 seconds</strong></li>
            <li>Duration buttons are disabled while Live is active</li>
            <li>Click <Kbd>Live</Kbd> again to return to normal mode</li>
          </ol>

          <h3 className="font-semibold mb-2">When to use Live mode</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-foreground/80">
            <li><strong>During a deployment</strong> — watch CPU and memory as the new version starts</li>
            <li><strong>Load testing</strong> — observe network and CPU in real time</li>
            <li><strong>Debugging</strong> — see the immediate impact of your changes</li>
            <li><strong>After scaling</strong> — verify that resource usage distributes correctly</li>
          </ul>

          <Tip>
            In normal mode (Live off), charts refresh every 60 seconds. A 30-second server-side cache avoids redundant queries to the metrics backend.
          </Tip>
        </Section>

        {/* Chart Interactions */}
        <Section id="interactions" title="Chart Interactions" icon={MousePointer}>
          <h3 className="font-semibold mb-2">Zoom</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-foreground/80 mb-4">
            <li><strong>Mouse wheel</strong> — scroll to zoom in/out on the time axis</li>
            <li><strong>Click and drag</strong> — select a time range to zoom into</li>
            <li><strong>Bottom slider</strong> — drag to adjust the visible window</li>
          </ul>

          <h3 className="font-semibold mb-2">Toolbar</h3>
          <p className="text-sm text-foreground/80 mb-3">
            In the top-right corner of each chart:
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm text-foreground/80 mb-4">
            <li><strong>Zoom icon</strong> — enter zoom selection mode</li>
            <li><strong>Restore icon</strong> — reset to original view</li>
            <li><strong>Save icon</strong> — download chart as PNG</li>
          </ul>

          <h3 className="font-semibold mb-2">Tooltip</h3>
          <p className="text-sm text-foreground/80">
            Hover over any point on a chart to see the exact timestamp and value for all series at that moment.
          </p>
        </Section>

        {/* Apps vs Add-ons */}
        <Section id="apps-addons" title="Applications vs Add-ons" icon={AppWindow}>
          <div className="grid gap-4 sm:grid-cols-2 mb-4">
            <Card className="border">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <AppWindow className="h-5 w-5 text-blue-500" />
                  <h4 className="font-semibold">Applications</h4>
                </div>
                <p className="text-sm text-foreground/80">
                  Your deployed code (Node.js, Rust, Docker, Java, etc.). All four metric panels are available.
                </p>
              </CardContent>
            </Card>
            <Card className="border">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="h-5 w-5 text-emerald-500" />
                  <h4 className="font-semibold">Add-ons</h4>
                </div>
                <p className="text-sm text-foreground/80">
                  Managed services (PostgreSQL, MySQL, Redis, Cellar, etc.). Metrics use the provider ID internally.
                </p>
              </CardContent>
            </Card>
          </div>
          <Tip>
            In the sidebar, clicking an add-on automatically uses the correct provider identifier. You don&apos;t need to worry about the difference.
          </Tip>
        </Section>

        {/* Troubleshooting */}
        <Section id="troubleshooting" title="Troubleshooting" icon={AlertTriangle}>
          <div className="space-y-4">
            <TroubleshootItem
              problem="&quot;No resources&quot; shown for an organisation"
              solution="Your OAuth token may not have sufficient permissions. Sign out and sign back in. Make sure to Allow all requested permissions."
            />
            <TroubleshootItem
              problem="Charts show &quot;Failed to load metrics&quot;"
              solution="The app or add-on may be stopped — metrics are only collected while it is running. Click Retry to try again."
            />
            <TroubleshootItem
              problem="Empty charts after restarting an app"
              solution="After a restart, it takes 1–2 minutes for metrics collection to resume. The charts will show a gap for the downtime period. Try a longer time range (6h or 24h) to see data from before the stop."
            />
            <TroubleshootItem
              problem="Login keeps redirecting to the home page"
              solution="Clear your browser cookies for myccmetrics.cleverapps.io and try again. You can also use a private/incognito window."
            />
          </div>
        </Section>

        {/* Browser Support */}
        <Section id="browser-support" title="Browser Support" icon={Monitor}>
          <p className="text-sm text-foreground/80 mb-3">
            MyCCmetrics works on all modern browsers:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {["Chrome 90+", "Firefox 90+", "Safari 16+", "Edge 90+"].map((browser) => (
              <div key={browser} className="rounded-lg border border-border bg-accent/50 px-3 py-2 text-center text-sm font-medium">
                {browser}
              </div>
            ))}
          </div>
          <p className="text-sm text-foreground/80 mt-3">
            Mobile browsers (iOS Safari, Chrome for Android) are fully supported with a responsive layout.
          </p>
        </Section>
      </div>
    </div>
  );
}

function Section({
  id,
  title,
  icon: Icon,
  children,
}: {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-8">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2.5 mb-4">
            <Icon className="h-5 w-5 text-primary shrink-0" />
            <h2 className="text-lg font-bold">{title}</h2>
          </div>
          {children}
        </CardContent>
      </Card>
    </section>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center rounded-md border border-border bg-muted px-1.5 py-0.5 text-xs font-semibold">
      {children}
    </kbd>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground/80">
      <strong className="text-primary">Tip:</strong> {children}
    </div>
  );
}

function MetricBadge({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-border px-3 py-1.5">
      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

function TroubleshootItem({ problem, solution }: { problem: string; solution: string }) {
  return (
    <div className="rounded-lg border border-border p-4">
      <p className="font-semibold text-sm mb-1">{problem}</p>
      <p className="text-sm text-foreground/80">{solution}</p>
    </div>
  );
}
