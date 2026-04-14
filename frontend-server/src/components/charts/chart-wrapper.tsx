"use client";

import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { Skeleton } from "@/components/ui/skeleton";
import type { EChartsOption } from "echarts";

const ReactECharts = dynamic(() => import("echarts-for-react"), {
  ssr: false,
  loading: () => <div className="w-full h-[300px] flex items-center justify-center text-muted-foreground text-sm">Loading chart...</div>,
});

interface ChartWrapperProps {
  option: EChartsOption;
  loading?: boolean;
  error?: string | null;
  height?: string;
  onRetry?: () => void;
}

export function ChartWrapper({
  option,
  loading,
  error,
  height = "300px",
  onRetry,
}: ChartWrapperProps) {
  const { resolvedTheme } = useTheme();

  if (loading) {
    return <Skeleton className="w-full" style={{ height }} />;
  }

  if (error) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-lg border border-dashed text-muted-foreground"
        style={{ height }}
      >
        <p className="text-sm">Failed to load metrics</p>
        <p className="text-xs mt-1 max-w-xs truncate">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 text-xs underline hover:text-foreground"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <ReactECharts
      option={option}
      notMerge={true}
      style={{ height, width: "100%" }}
      opts={{ renderer: "canvas" }}
      theme={resolvedTheme === "dark" ? "dark" : undefined}
    />
  );
}
