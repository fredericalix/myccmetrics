"use client";

import { useMemo } from "react";
import { useTheme } from "next-themes";
import { useMetrics } from "@/lib/hooks/use-metrics";
import { ChartWrapper } from "./chart-wrapper";
import { buildBaseOption, chartColors } from "./chart-theme";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { MemoryStick } from "lucide-react";
import { formatPercent } from "@/lib/formatters";
import type { EChartsOption } from "echarts";

interface MemoryChartProps {
  orgId: string;
  appId: string;
  duration: string;
  refetchInterval?: number;
}

export function MemoryChart({ orgId, appId, duration, refetchInterval = 60_000 }: MemoryChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const { data, isLoading, error, refetch } = useMetrics(
    orgId,
    appId,
    "memory",
    duration,
    true,
    refetchInterval,
  );

  const option = useMemo<EChartsOption>(() => {
    const base = buildBaseOption(isDark);
    const series = (data?.series || []).map((s) => ({
      name: "Memory Used",
      type: "line" as const,
      areaStyle: {
        opacity: 0.3,
        color: {
          type: "linear" as const,
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: chartColors.memory },
            { offset: 1, color: "transparent" },
          ],
        },
      },
      lineStyle: { width: 2, color: chartColors.memory },
      itemStyle: { color: chartColors.memory },
      symbol: "none",
      data: s.data,
    }));

    return {
      ...base,
      yAxis: {
        type: "value" as const,
        max: 100,
        axisLabel: {
          color: isDark ? "#9ca3af" : "#6b7280",
          fontSize: 11,
          formatter: (v: number) => formatPercent(v, 0),
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
        valueFormatter: (v: unknown) => formatPercent(v as number),
      },
      series,
    };
  }, [data, isDark]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <MemoryStick className="h-4 w-4" />
          Memory Usage
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
