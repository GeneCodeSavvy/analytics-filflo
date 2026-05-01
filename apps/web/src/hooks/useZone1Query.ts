import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "../api/dashboard";
import type { DashboardFilters } from "../types/dashboard";

const STALE_MS = 5 * 60 * 1000;

export function useZone1Query(filters: DashboardFilters) {
  return useQuery({
    queryKey: ["dashboard", "zone1", filters],
    queryFn: () => dashboardApi.getKpis(filters),
    staleTime: STALE_MS,
    refetchOnWindowFocus: true,
  });
}
