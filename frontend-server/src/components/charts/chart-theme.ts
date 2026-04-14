import type { EChartsOption } from "echarts";

export const lightTheme: EChartsOption = {
  backgroundColor: "transparent",
  textStyle: { color: "#374151" },
};

export const darkTheme: EChartsOption = {
  backgroundColor: "transparent",
  textStyle: { color: "#d1d5db" },
};

export const chartColors = {
  cpu: {
    user: "#3b82f6",
    system: "#f97316",
    iowait: "#ef4444",
  },
  memory: "#8b5cf6",
  network: {
    recv: "#10b981",
    sent: "#f59e0b",
  },
  disk: "#6366f1",
};

export function buildBaseOption(isDark: boolean): EChartsOption {
  const textColor = isDark ? "#9ca3af" : "#6b7280";
  const borderColor = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";

  return {
    backgroundColor: "transparent",
    textStyle: { color: textColor, fontSize: 12 },
    grid: {
      left: 12,
      right: 12,
      top: 40,
      bottom: 60,
      containLabel: true,
    },
    xAxis: {
      type: "time",
      axisLine: { lineStyle: { color: borderColor } },
      axisTick: { lineStyle: { color: borderColor } },
      axisLabel: { color: textColor, fontSize: 11 },
      splitLine: { show: false },
    },
    yAxis: {
      type: "value",
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: textColor, fontSize: 11 },
      splitLine: { lineStyle: { color: borderColor, type: "dashed" } },
    },
    tooltip: {
      trigger: "axis",
      backgroundColor: isDark ? "#1f2937" : "#ffffff",
      borderColor: isDark ? "#374151" : "#e5e7eb",
      textStyle: { color: isDark ? "#e5e7eb" : "#374151", fontSize: 12 },
    },
    toolbox: {
      right: 12,
      feature: {
        dataZoom: { yAxisIndex: "none" },
        restore: {},
        saveAsImage: { pixelRatio: 2 },
      },
      iconStyle: { borderColor: textColor },
    },
    dataZoom: [
      {
        type: "inside",
        start: 0,
        end: 100,
      },
      {
        type: "slider",
        start: 0,
        end: 100,
        height: 20,
        bottom: 8,
        borderColor: borderColor,
        textStyle: { color: textColor, fontSize: 10 },
      },
    ],
  };
}
