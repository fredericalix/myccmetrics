"use client";

import { useMemo } from "react";
import { useTheme } from "next-themes";
import { useMetrics } from "@/lib/hooks/use-metrics";
import { ChartWrapper } from "./chart-wrapper";
import { buildBaseOption, chartColors } from "./chart-theme";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Network } from "lucide-react";
import { formatBytesPerSec } from "@/lib/formatters";
import type { EChartsOption } from "echarts";

interface NetworkChartProps {
  orgId: string;
  appId: string;
  duration: string;
}

export function NetworkChart({ orgId, appId, duration }: NetworkChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const { data, isLoading, error, refetch } = useMetrics(
    orgId,
    appId,
    "network",
    duration,
  );

  const option = useMemo<EChartsOption>(() => {
    const base = buildBaseOption(isDark);
    const series = (data?.series || []).map((s) => {
      const isRecv = s.name.includes("recv");
      const color = isRecv ? chartColors.network.recv : chartColors.network.sent;
      return {
        name: isRecv ? "Received" : "Sent",
        type: "line" as const,
        lineStyle: { width: 2, color },
        itemStyle: { color },
        symbol: "none",
        areaStyle: { opacity: 0.15 },
        data: s.data,
      };
    });

    return {
      ...base,
      legend: {
        show: true,
        bottom: 30,
        textStyle: { color: isDark ? "#9ca3af" : "#6b7280", fontSize: 11 },
      },
      yAxis: {
        type: "value" as const,
        axisLabel: {
          color: isDark ? "#9ca3af" : "#6b7280",
          fontSize: 11,
          formatter: (v: number) => formatBytesPerSec(v, 0),
        },
        splitLine: {
          lineStyle: {
            color: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
            type: "dashed" as const,
          },
        },
      },
      tooltip: {
        ...base.tooltip,
        valueFormatter: (v: unknown) => formatBytesPerSec(v as number),
      },
      series,
    };
  }, [data, isDark]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Network className="h-4 w-4" />
          Network I/O
        </CardTitle>
      </CardHeader>
      <div className="px-2 pb-2">
        <ChartWrapper
          option={option}
          loading={isLoading}
          error={error?.message}
          onRetry={() => refetch()}
        />
      </div>
    </Card>
  );
}
