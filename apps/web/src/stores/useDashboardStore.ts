import type { Range } from "@/types/dashboard";
import { create } from "zustand";

interface DashboardUIState {
  queryRange: Range;
  setRange: (range: Range) => void;
}

export const useDashboardStore = create<DashboardUIState>((set) => ({
  queryRange: "30d",
  setRange: (range: Range) => set({ queryRange: range }),
}));
