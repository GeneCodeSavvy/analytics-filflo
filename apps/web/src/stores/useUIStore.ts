import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Theme, Density } from "../lib/settingsParams";

type UIState = {
  sidebarOpen: boolean;
  theme: Theme;
  density: Density;
  toggleSidebar: () => void;
  setTheme: (theme: UIState["theme"]) => void;
  setDensity: (density: UIState["density"]) => void;
};

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      theme: "system" as Theme,
      density: "comfortable" as Density,
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setTheme: (theme) => set({ theme }),
      setDensity: (density) => set({ density }),
    }),
    { name: "ui-store" },
  ),
);

export type { UIState };
