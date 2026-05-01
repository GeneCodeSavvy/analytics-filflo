import { create } from "zustand";
import { persist } from "zustand/middleware";

interface MessageStoreState {
  // threadId → composer text content. Persisted to localStorage.
  drafts: Record<string, string>;

  saveDraft: (threadId: string, content: string) => void;
  clearDraft: (threadId: string) => void;
  getDraft: (threadId: string) => string;
}

export const useMessageStore = create<MessageStoreState>()(
  persist(
    (set, get) => ({
      drafts: {},

      saveDraft: (threadId, content) =>
        set((state) => ({
          drafts: { ...state.drafts, [threadId]: content },
        })),

      clearDraft: (threadId) =>
        set((state) => {
          const next = { ...state.drafts };
          delete next[threadId];
          return { drafts: next };
        }),

      getDraft: (threadId) => get().drafts[threadId] ?? "",
    }),
    {
      name: "message-store",
    },
  ),
);
