const NO_DATA = "—";

export function formatBytes(bytes: number | null | undefined, decimals = 1): string {
  if (bytes == null) return NO_DATA;
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
  const idx = Math.min(i, sizes.length - 1);
  return `${(bytes / Math.pow(k, idx)).toFixed(decimals)} ${sizes[idx]}`;
}

export function formatBytesPerSec(bytesPerSec: number | null | undefined, decimals = 1): string {
  if (bytesPerSec == null) return NO_DATA;
  return `${formatBytes(bytesPerSec, decimals)}/s`;
}

export function formatPercent(value: number | null | undefined, decimals = 1): string {
  if (value == null) return NO_DATA;
  return `${value.toFixed(decimals)}%`;
}

export function formatTimestamp(ms: number): string {
  return new Date(ms).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatTimestampFull(ms: number): string {
  return new Date(ms).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
