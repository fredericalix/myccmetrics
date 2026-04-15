"use client";

import { use, useState } from "react";
import { CpuChart } from "@/components/charts/cpu-chart";
import { MemoryChart } from "@/components/charts/memory-chart";
import { NetworkChart } from "@/components/charts/network-chart";
import { DiskChart } from "@/components/charts/disk-chart";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Radio } from "lucide-react";

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
  const [live, setLive] = useState(false);

  const effectiveDuration = live ? "15m" : duration;
  const effectiveBucketRefresh = live ? 10_000 : 60_000;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xl font-bold">Metrics</h2>
        <div className="flex items-center gap-2">
          <Button
            variant={live ? "default" : "outline"}
            size="sm"
            onClick={() => setLive(!live)}
            className={cn(
              "text-xs gap-1.5",
              live && "bg-red-600 hover:bg-red-700 text-white shadow-sm",
            )}
          >
            <Radio
              className={cn("h-3.5 w-3.5", live && "animate-pulse")}
            />
            Live
          </Button>
          <div className="flex gap-1">
            {DURATIONS.map((d) => (
              <Button
                key={d.value}
                variant={!live && duration === d.value ? "default" : "outline"}
                size="sm"
                disabled={live}
                onClick={() => setDuration(d.value)}
                className={cn(
                  "text-xs",
                  !live && duration === d.value && "shadow-sm",
                  live && "opacity-50",
                )}
              >
                {d.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <CpuChart
          orgId={orgId}
          appId={appId}
          duration={effectiveDuration}
          refetchInterval={effectiveBucketRefresh}
        />
        <MemoryChart
          orgId={orgId}
          appId={appId}
          duration={effectiveDuration}
          refetchInterval={effectiveBucketRefresh}
        />
        <NetworkChart
          orgId={orgId}
          appId={appId}
          duration={effectiveDuration}
          refetchInterval={effectiveBucketRefresh}
        />
        <DiskChart
          orgId={orgId}
          appId={appId}
          duration={effectiveDuration}
          refetchInterval={effectiveBucketRefresh}
        />
      </div>

      <p className="text-xs text-muted-foreground text-center">
        {live ? (
          <span className="text-red-500 font-medium">
            Live mode — refreshing every 10s (last 15 min)
          </span>
        ) : (
          "Auto-refreshes every 60 seconds"
        )}
      </p>
    </div>
  );
}
