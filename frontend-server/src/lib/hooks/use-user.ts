"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { User } from "@/lib/types";

export function useUser() {
  return useQuery<User>({
    queryKey: ["me"],
    queryFn: () => apiFetch<User>("/api/me"),
    retry: false,
  });
}
