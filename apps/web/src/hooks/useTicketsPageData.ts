import { useMemo, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router';
import { useTicketsPageActions } from './useTicketsPageActions';
import {
  useTicketListQuery,
  useViewsQuery,
  useTicketDetailQuery,
  useNewTicketsPoll,
} from './useTicketQueries';
import { useTicketStore } from '../stores/useTicketStore';
import type {
  TicketFilters,
  TicketSort,
  ListResponse,
  View,
  TicketDetail,
} from '../lib/ticketParams';
import { parseFilters, parseSort, serializeSort, buildListKey } from '../lib/ticketParams';

export function useTicketsPageData() {
  const { ticketId } = useParams();
  const [searchParams] = useSearchParams();
  const { closeDrawer } = useTicketsPageActions();

  const rawParams = searchParams.toString();

  const filters = useMemo(() => parseFilters(searchParams), [rawParams]);
  const sort = useMemo(() => parseSort(searchParams), [rawParams]);
  const page = useMemo(() => Number(searchParams.get('page') ?? 1), [rawParams]);
  const viewId = useMemo(() => searchParams.get('view') ?? null, [rawParams]);
  const modalOpen = useMemo(() => searchParams.get('modal') === 'create', [rawParams]);

  const listParams = useMemo(
    () => ({ ...filters, sort: serializeSort(sort), page, pageSize: 25 }),
    [filters, sort, page]
  );
  const filterParams = useMemo(
    () => ({ ...filters, sort: serializeSort(sort) }),
    [filters, sort]
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
    if (detail.isError && (detail.error as any)?.response?.status === 404 && ticketId !== handled404Ref.current) {
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
      newTicketsBannerCount: (banner.data as { count: number } | undefined)?.count ?? 0,
    },
  };
}