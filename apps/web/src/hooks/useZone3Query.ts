import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "../api/dashboardApi";
import type { DashboardFilters } from "../types/dashboard";
import { DASHBOARD_STALE_MS } from "../config/dashboard";

export function useZone3Query(filters: DashboardFilters) {
  return useQuery({
    queryKey: ["dashboard", "zone3", filters],
    queryFn: () => dashboardApi.getZone3(filters),
    staleTime: DASHBOARD_STALE_MS,
    refetchOnWindowFocus: true,
  });
}
