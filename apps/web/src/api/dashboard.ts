import { api } from "./index";
import type {
  DashboardParams,
  DashboardKpis,
  StatusDonut,
  VolumeBar,
  VolumeTrend,
  Zone3Data,
} from "../types/dashboard";

export const dashboardApi = {
  getKpis: async (params: DashboardParams): Promise<DashboardKpis> => {
    const response = await api.get<DashboardKpis>("/dashboard/kpis", {
      params,
    });
    return response;
  },

  getStatus: async (params: DashboardParams): Promise<StatusDonut> => {
    const response = await api.get<StatusDonut>("/dashboard/status", {
      params,
    });
    return response;
  },

  getVolume: async (params: DashboardParams): Promise<VolumeBar> => {
    const response = await api.get<VolumeBar>("/dashboard/volume", { params });
    return response;
  },

  getTrend: async (params: DashboardParams): Promise<VolumeTrend> => {
    const response = await api.get<VolumeTrend>("/dashboard/trend", { params });
    return response;
  },

  getZone3: async (params: DashboardParams): Promise<Zone3Data> => {
    const response = await api.get<Zone3Data>("/dashboard/zone3", { params });
    return response;
  },
};
