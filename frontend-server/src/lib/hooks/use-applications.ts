"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { Application } from "@/lib/types";

export function useApplications(orgId: string) {
  return useQuery<Application[]>({
    queryKey: ["applications", orgId],
    queryFn: () =>
      apiFetch<Application[]>(
        `/api/organisations/${orgId}/applications`,
      ),
    enabled: !!orgId,
  });
}
