import { useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useTicketStore } from "../stores/useTicketStore";
import { mergeFilters, mergeSort } from "../lib/ticketParams";
import type { TicketFilters, TicketSort } from "../types/tickets";

export function useTicketsPageActions() {
  const navigate = useNavigate();
  const [, setSearchParams] = useSearchParams();

  const setFilters = useCallback(
    (f: Partial<TicketFilters>) => {
      setSearchParams((p) => mergeFilters(new URLSearchParams(p), f));
    },
    [setSearchParams],
  );

  const setSort = useCallback(
    (s: TicketSort[]) => {
      setSearchParams((p) => mergeSort(new URLSearchParams(p), s));
    },
    [setSearchParams],
  );

  const setPage = useCallback(
    (n: number) => {
      setSearchParams((p) => {
        const next = new URLSearchParams(p);
        next.set("page", String(n));
        return next;
      });
    },
    [setSearchParams],
  );

  const setView = useCallback(
    (id: string | null) => {
      setSearchParams((p) => {
        const next = new URLSearchParams(p);
        id ? next.set("view", id) : next.delete("view");
        return next;
      });
    },
    [setSearchParams],
  );

  const clearView = useCallback(() => setView(null), [setView]);

  const openModal = useCallback(() => {
    setSearchParams((p) => {
      const next = new URLSearchParams(p);
      next.set("modal", "create");
      return next;
    });
  }, [setSearchParams]);

  const closeModal = useCallback(() => {
    setSearchParams((p) => {
      const next = new URLSearchParams(p);
      next.delete("modal");
      return next;
    });
  }, [setSearchParams]);

  const openDrawer = useCallback(
    (id: string) => navigate(`/tickets/${id}`),
    [navigate],
  );

  const closeDrawer = useCallback(() => navigate("/tickets"), [navigate]);

  const setSelectedRows = useTicketStore((s) => s.setSelectedRows);
  const toggleRowSelected = useTicketStore((s) => s.toggleRowSelected);
  const clearSelection = useTicketStore((s) => s.clearSelection);
  const setDensity = useTicketStore((s) => s.setDensity);

  return {
    setFilters,
    setSort,
    setPage,
    setView,
    clearView,
    openModal,
    closeModal,
    openDrawer,
    closeDrawer,
    setSelectedRows,
    toggleRowSelected,
    clearSelection,
    setDensity,
  };
}
