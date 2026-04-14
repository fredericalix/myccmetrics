"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { Addon } from "@/lib/types";

export function useAddons(orgId: string) {
  return useQuery<Addon[]>({
    queryKey: ["addons", orgId],
    queryFn: () =>
      apiFetch<Addon[]>(`/api/organisations/${orgId}/addons`),
    enabled: !!orgId,
  });
}
