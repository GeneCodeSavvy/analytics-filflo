import { api } from "./index";
import type {
  DashboardParams,
  DashboardKpis,
  StatusDonut,
  VolumeBar,
  VolumeTrend,
  Zone3Data,
} from "../types/dashboard";

/**
 * Dashboard API client.
 *
 * Permission model enforced by the API:
 * - SUPER_ADMIN and ADMIN can read dashboard metrics across orgs and may pass
 *   orgIds to narrow the dashboard to specific orgs.
 * - MODERATOR and USER are scoped to their own org. If they pass another orgId
 *   explicitly, the API responds with 403.
 * - If MODERATOR or USER omit orgIds, the API automatically scopes all metrics
 *   to the actor's DB-backed org.
 *
 * Frontend guidance:
 * - Hide cross-org filter controls for org-scoped actors, but still handle
 *   403s because the API is the source of truth.
 * - The shared axios wrapper unwraps response.data, so these methods resolve
 *   directly to the typed payloads.
 */
export const dashboardApi = {
  /** KPI cards for the current dashboard filters.
   * Cross-org actors may include orgIds. Org-scoped actors should omit orgIds
   * or pass only their own orgId.
   */
  getKpis: async (params: DashboardParams): Promise<DashboardKpis> => {
    const response = await api.get<DashboardKpis>("/dashboard/kpis", {
      params,
    });
    return response;
  },

  /** Status donut data using the same org scoping as the KPI endpoint. */
  getStatus: async (params: DashboardParams): Promise<StatusDonut> => {
    const response = await api.get<StatusDonut>("/dashboard/status", {
      params,
    });
    return response;
  },

  /** Volume breakdown data using the same org scoping as the KPI endpoint. */
  getVolume: async (params: DashboardParams): Promise<VolumeBar> => {
    const response = await api.get<VolumeBar>("/dashboard/volume", { params });
    return response;
  },

  /** Created/resolved trend data using the same org scoping as the KPI endpoint. */
  getTrend: async (params: DashboardParams): Promise<VolumeTrend> => {
    const response = await api.get<VolumeTrend>("/dashboard/trend", { params });
    return response;
  },

  /** Operational Zone 3 data using the same org scoping as the KPI endpoint. */
  getZone3: async (params: DashboardParams): Promise<Zone3Data> => {
    const response = await api.get<Zone3Data>("/dashboard/zone3", { params });
    return response;
  },
};
