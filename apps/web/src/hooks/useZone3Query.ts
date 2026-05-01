import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "../api/dashboard";
import type { DashboardFilters } from "../types/dashboard";

const STALE_MS = 5 * 60 * 1000;

export function useZone3Query(filters: DashboardFilters) {
  return useQuery({
    queryKey: ["dashboard", "zone3", filters],
    queryFn: () => dashboardApi.getZone3(filters),
    staleTime: STALE_MS,
    refetchOnWindowFocus: true,
  });
}
