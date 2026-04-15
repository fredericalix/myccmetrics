"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { MetricsResponse } from "@/lib/types";

export function useMetrics(
  orgId: string,
  appId: string,
  panel: string,
  duration: string,
  enabled = true,
  refetchInterval = 60_000,
) {
  return useQuery<MetricsResponse>({
    queryKey: ["metrics", orgId, appId, panel, duration],
    queryFn: () =>
      apiFetch<MetricsResponse>(
        `/api/metrics/${orgId}/${appId}?panel=${panel}&duration=${duration}`,
      ),
    enabled: enabled && !!orgId && !!appId,
    refetchInterval,
    staleTime: Math.min(refetchInterval / 2, 30_000),
  });
}
