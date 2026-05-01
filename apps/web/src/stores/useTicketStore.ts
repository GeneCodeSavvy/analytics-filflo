import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TicketUIState {
  selectedRowIds: string[];
  density: 'compact' | 'comfortable';

  setSelectedRows: (ids: string[]) => void;
  toggleRowSelected: (id: string) => void;
  clearSelection: () => void;
  setDensity: (d: 'compact' | 'comfortable') => void;
}

export const useTicketStore = create<TicketUIState>()(
  persist(
    (set) => ({
      selectedRowIds: [],
      density: 'comfortable',

      setSelectedRows: (ids) => set({ selectedRowIds: ids }),

      toggleRowSelected: (id) =>
        set((state) => {
          const isSelected = state.selectedRowIds.includes(id);
          return {
            selectedRowIds: isSelected
              ? state.selectedRowIds.filter((sid) => sid !== id)
              : [...state.selectedRowIds, id],
          };
        }),

      clearSelection: () => set({ selectedRowIds: [] }),

      setDensity: (d) => set({ density: d }),
    }),
    {
      name: 'ticket-ui',
      partialize: (state) => ({ density: state.density }),
    }
  )
);