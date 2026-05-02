import { create } from "zustand";

interface NotificationUIState {
  expandedGroupIds: Record<string, true>;
  selectedIds: Record<string, true>;

  toggleGroup: (id: string) => void;
  isExpanded: (id: string) => boolean;
  selectRows: (ids: string[]) => void;
  toggleRowSelected: (id: string) => void;
  clearSelection: () => void;
  isSelected: (id: string) => boolean;
  selectedCount: () => number;
}

export const useNotificationStore = create<NotificationUIState>()((set, get) => ({
  expandedGroupIds: {},
  selectedIds: {},

  toggleGroup: (id) =>
    set((state) => {
      const next = { ...state.expandedGroupIds };
      if (next[id]) {
        delete next[id];
      } else {
        next[id] = true;
      }
      return { expandedGroupIds: next };
    }),

  isExpanded: (id) => !!get().expandedGroupIds[id],

  selectRows: (ids) =>
    set({
      selectedIds: Object.fromEntries(ids.map((id) => [id, true])) as Record<string, true>,
    }),

  toggleRowSelected: (id) =>
    set((state) => {
      const next = { ...state.selectedIds };
      if (next[id]) {
        delete next[id];
      } else {
        next[id] = true;
      }
      return { selectedIds: next };
    }),

  clearSelection: () => set({ selectedIds: {} }),

  isSelected: (id) => !!get().selectedIds[id],

  selectedCount: () => Object.keys(get().selectedIds).length,
}));
