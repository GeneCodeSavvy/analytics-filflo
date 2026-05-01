import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "../api/dashboard";
import type { DashboardFilters } from "../types/dashboard";
import { DASHBOARD_STALE_MS } from "../config/dashboard";

export function useZone1Query(filters: DashboardFilters) {
  return useQuery({
    queryKey: ["dashboard", "zone1", filters],
    queryFn: () => dashboardApi.getKpis(filters),
    staleTime: DASHBOARD_STALE_MS,
    refetchOnWindowFocus: true,
  });
}
