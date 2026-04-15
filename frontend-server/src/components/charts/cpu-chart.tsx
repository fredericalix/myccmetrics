"use client";

import { useMemo } from "react";
import { useTheme } from "next-themes";
import { useMetrics } from "@/lib/hooks/use-metrics";
import { ChartWrapper } from "./chart-wrapper";
import { buildBaseOption, chartColors } from "./chart-theme";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Cpu } from "lucide-react";
import { formatPercent } from "@/lib/formatters";
import type { EChartsOption } from "echarts";

interface CpuChartProps {
  orgId: string;
  appId: string;
  duration: string;
  refetchInterval?: number;
}

export function CpuChart({ orgId, appId, duration, refetchInterval = 60_000 }: CpuChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const { data, isLoading, error, refetch } = useMetrics(
    orgId,
    appId,
    "cpu",
    duration,
    true,
    refetchInterval,
  );

  const option = useMemo<EChartsOption>(() => {
    const base = buildBaseOption(isDark);
    const series = (data?.series || []).map((s) => {
      const colorKey = s.name.includes("user")
        ? "user"
        : s.name.includes("system")
          ? "system"
          : "iowait";
      const color = chartColors.cpu[colorKey];
      return {
        name: s.name,
        type: "line" as const,
        stack: "cpu",
        areaStyle: {
          opacity: 0.4,
        },
        lineStyle: { width: 1.5 },
        symbol: "none",
        color,
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
          <Cpu className="h-4 w-4" />
          CPU Usage
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
