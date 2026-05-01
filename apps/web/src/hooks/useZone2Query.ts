import { useQueries } from "@tanstack/react-query";
import { dashboardApi } from "../api/dashboard";
import type { DashboardFilters } from "../types/dashboard";
import { DASHBOARD_STALE_MS } from "../config/dashboard";

export function useZone2Query(filters: DashboardFilters) {
  const [statusResult, volumeResult, trendResult] = useQueries({
    queries: [
      {
        queryKey: ["dashboard", "zone2", "status", filters],
        queryFn: () => dashboardApi.getStatus(filters),
        staleTime: DASHBOARD_STALE_MS,
        refetchOnWindowFocus: true,
      },
      {
        queryKey: ["dashboard", "zone2", "volume", filters],
        queryFn: () => dashboardApi.getVolume(filters),
        staleTime: DASHBOARD_STALE_MS,
        refetchOnWindowFocus: true,
      },
      {
        queryKey: ["dashboard", "zone2", "trend", filters],
        queryFn: () => dashboardApi.getTrend(filters),
        staleTime: DASHBOARD_STALE_MS,
        refetchOnWindowFocus: true,
      },
    ],
  });

  return {
    status: statusResult,
    volume: volumeResult,
    trend: trendResult,
    isLoading:
      statusResult.isLoading || volumeResult.isLoading || trendResult.isLoading,
    isError:
      statusResult.isError || volumeResult.isError || trendResult.isError,
  };
}
