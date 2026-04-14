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
) {
  return useQuery<MetricsResponse>({
    queryKey: ["metrics", orgId, appId, panel, duration],
    queryFn: () =>
      apiFetch<MetricsResponse>(
        `/api/metrics/${orgId}/${appId}?panel=${panel}&duration=${duration}`,
      ),
    enabled: enabled && !!orgId && !!appId,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}
