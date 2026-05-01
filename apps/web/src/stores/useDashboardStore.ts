import { create } from "zustand";

interface DashboardUIState {
  expandedPanelIds: string[];
  activeZoneTab: "zone1" | "zone2" | "zone3" | null;

  togglePanel: (id: string) => void;
  setActiveZoneTab: (tab: DashboardUIState["activeZoneTab"]) => void;
}

export const useDashboardStore = create<DashboardUIState>((set, get) => ({
  expandedPanelIds: [],
  activeZoneTab: null,

  togglePanel: (id) => {
    const { expandedPanelIds } = get();
    set({
      expandedPanelIds: expandedPanelIds.includes(id)
        ? expandedPanelIds.filter((p) => p !== id)
        : [...expandedPanelIds, id],
    });
  },

  setActiveZoneTab: (tab) => set({ activeZoneTab: tab }),
}));
