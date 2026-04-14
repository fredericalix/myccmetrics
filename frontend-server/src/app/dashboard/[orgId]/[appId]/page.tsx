"use client";

import { use, useState } from "react";
import { CpuChart } from "@/components/charts/cpu-chart";
import { MemoryChart } from "@/components/charts/memory-chart";
import { NetworkChart } from "@/components/charts/network-chart";
import { DiskChart } from "@/components/charts/disk-chart";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DURATIONS = [
  { label: "1h", value: "1h" },
  { label: "6h", value: "6h" },
  { label: "24h", value: "24h" },
  { label: "7d", value: "7d" },
  { label: "30d", value: "30d" },
];

export default function MetricsDashboardPage({
  params,
}: {
  params: Promise<{ orgId: string; appId: string }>;
}) {
  const { orgId, appId } = use(params);
  const [duration, setDuration] = useState("1h");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Metrics</h2>
        <div className="flex gap-1">
          {DURATIONS.map((d) => (
            <Button
              key={d.value}
              variant={duration === d.value ? "default" : "outline"}
              size="sm"
              onClick={() => setDuration(d.value)}
              className={cn("text-xs", duration === d.value && "shadow-sm")}
            >
              {d.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <CpuChart orgId={orgId} appId={appId} duration={duration} />
        <MemoryChart orgId={orgId} appId={appId} duration={duration} />
        <NetworkChart orgId={orgId} appId={appId} duration={duration} />
        <DiskChart orgId={orgId} appId={appId} duration={duration} />
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Auto-refreshes every 60 seconds
      </p>
    </div>
  );
}
