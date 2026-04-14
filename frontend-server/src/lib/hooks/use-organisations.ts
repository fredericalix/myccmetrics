"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { Organisation } from "@/lib/types";

export function useOrganisations() {
  return useQuery<Organisation[]>({
    queryKey: ["organisations"],
    queryFn: () => apiFetch<Organisation[]>("/api/organisations"),
  });
}
