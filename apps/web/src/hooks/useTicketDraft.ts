import { useCallback } from "react";
import type { NewTicketDraft } from "../types/tickets";

const DRAFT_VERSION = 1;
const STORAGE_KEY = "ticket-create-draft";

export function useTicketDraft() {
  const save = useCallback((draft: NewTicketDraft) => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ v: DRAFT_VERSION, ...draft }),
    );
  }, []);

  const load = useCallback((): NewTicketDraft | null => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;

      const parsed = JSON.parse(raw);
      if (!parsed?.v) {
        return parsed as NewTicketDraft;
      }

      if (parsed.v !== DRAFT_VERSION) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }

      const { v: _, ...draft } = parsed;
      return draft as NewTicketDraft;
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  }, []);

  const clear = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { save, load, clear };
}
