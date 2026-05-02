import { create } from "zustand";
import { persist } from "zustand/middleware";

type UIState = {
  sidebarOpen: boolean;
  theme: "light" | "dark" | "system";
  density: "comfortable" | "compact";
  toggleSidebar: () => void;
  setTheme: (theme: UIState["theme"]) => void;
  setDensity: (density: UIState["density"]) => void;
};

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      theme: "system",
      density: "comfortable",
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setTheme: (theme) => set({ theme }),
      setDensity: (density) => set({ density }),
    }),
    { name: "ui-store" },
  ),
);

export type { UIState };
