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
    const response = await api.get("/dashboard/kpis", { params });
    return response.data;
  },

  getStatus: async (params: DashboardParams): Promise<StatusDonut> => {
    const response = await api.get("/dashboard/status", { params });
    return response.data;
  },

  getVolume: async (params: DashboardParams): Promise<VolumeBar> => {
    const response = await api.get("/dashboard/volume", { params });
    return response.data;
  },

  getTrend: async (params: DashboardParams): Promise<VolumeTrend> => {
    const response = await api.get("/dashboard/trend", { params });
    return response.data;
  },

  getZone3: async (params: DashboardParams): Promise<Zone3Data> => {
    const response = await api.get("/dashboard/zone3", { params });
    return response.data;
  },
};
