import { useMemo, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "react-router";
import createLogger from "@shared/logger";
import { useTicketsPageActions } from "./useTicketsPageActions";
import {
  useTicketListQuery,
  useViewsQuery,
  useTicketDetailQuery,
  useNewTicketsPoll,
} from "./useTicketQueries";
import { useTicketStore } from "../stores/useTicketStore";
import type {
  TicketFilters,
  TicketSort,
  ListResponse,
  View,
  TicketDetail,
} from "../types/tickets";
import {
  parseFilters,
  parseSort,
  serializeSort,
  buildListKey,
} from "../lib/ticketParams";
import { viewToFilters } from "../lib/ticketsComponent";
import { useAuthState } from "../stores/useAuthStore";

const logger = createLogger("useTicketsPageData");

export function useTicketsPageData() {
  const { ticketId } = useParams();
  const [searchParams] = useSearchParams();
  const { closeDrawer } = useTicketsPageActions();
  const userId = useAuthState((s) => s.user?.id);

  const rawParams = searchParams.toString();

  const filters = useMemo(() => parseFilters(searchParams), [rawParams]);
  const sort = useMemo(() => parseSort(searchParams), [rawParams]);
  const page = useMemo(
    () => Number(searchParams.get("page") ?? 1),
    [rawParams],
  );
  const viewId = useMemo(() => searchParams.get("view") ?? null, [rawParams]);
  const modalOpen = useMemo(
    () => searchParams.get("modal") === "create",
    [rawParams],
  );

  const viewFilters = useMemo(
    () => viewToFilters(viewId, userId),
    [viewId, userId],
  );

  // Strip empty arrays so view filters aren't overridden by unset URL params
  const userFilters = useMemo(
    () => Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== undefined && !(Array.isArray(v) && v.length === 0))
    ),
    [filters],
  );

  const listParams = useMemo(
    () => ({ ...viewFilters, ...userFilters, sort: serializeSort(sort), page, pageSize: 25 }),
    [viewFilters, userFilters, sort, page],
  );
  const filterParams = useMemo(
    () => ({ ...viewFilters, ...userFilters, sort: serializeSort(sort) }),
    [viewFilters, userFilters, sort],
  );

  const selectedRowIds = useTicketStore((s) => s.selectedRowIds);
  const density = useTicketStore((s) => s.density);
  const clearSelection = useTicketStore((s) => s.clearSelection);

  const filtersHash = JSON.stringify(buildListKey(filterParams));
  useEffect(() => {
    clearSelection();
  }, [filtersHash, viewId, clearSelection]);

  const list = useTicketListQuery(listParams);
  const views = useViewsQuery();
  const banner = useNewTicketsPoll(filterParams);
  const detail = useTicketDetailQuery(ticketId ?? null);

  const handled404Ref = useRef<string | null>(null);
  useEffect(() => {
    if (
      detail.isError &&
      (detail.error as any)?.response?.status === 404 &&
      ticketId !== handled404Ref.current
    ) {
      logger.error({
        event: "ticket_detail_not_found",
        ticketId,
        action: "close_drawer",
        status: 404,
      });
      handled404Ref.current = ticketId ?? null;
      closeDrawer();
    }
    if (!ticketId) handled404Ref.current = null;
  }, [detail.isError, detail.error, ticketId, closeDrawer]);

  return {
    data: {
      rows: (list.data as ListResponse | undefined)?.rows ?? [],
      total: (list.data as ListResponse | undefined)?.total ?? 0,
      views: (views.data as View[] | undefined) ?? [],
      detail: (detail.data as TicketDetail | undefined) ?? null,
    },
    status: { loading: list.isPending, error: list.error },
    url: {
      filters: filters as TicketFilters,
      sort: sort as TicketSort[],
      page,
      viewId,
      modalOpen,
      drawerTicketId: ticketId ?? null,
    },
    ui: {
      selectedRowIds,
      density,
      newTicketsBannerCount:
        (banner.data as { count: number } | undefined)?.count ?? 0,
    },
  };
}
