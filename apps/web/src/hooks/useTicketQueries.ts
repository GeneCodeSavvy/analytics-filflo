import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useEffect } from 'react';
import { ticketApi } from '../api/ticketApi';
import { userApi } from '../api/userApi';
import type {
  TicketListParams,
  TicketFilterParams,
  ListResponse,
  TicketDetail,
  View,
  ActivityEntry,
  UserRef,
} from '../lib/ticketParams';
import {
  TicketListParamsSchema,
  TicketFilterParamsSchema,
  buildListKey,
} from '../lib/ticketParams';

export function useTicketListQuery(params: TicketListParams) {
  const validated = TicketListParamsSchema.parse(params);
  return useQuery({
    queryKey: ['tickets', 'list', buildListKey(validated)],
    queryFn: ({ signal }) => ticketApi.getList(validated, signal),
    staleTime: 25_000,
    placeholderData: (previousData) => previousData,
    retry: 1,
  });
}

export function useViewsQuery() {
  return useQuery<View[]>({
    queryKey: ['tickets', 'views'],
    queryFn: ({ signal }) => ticketApi.getViews(signal),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

export function useTicketDetailQuery(ticketId: string | null) {
  return useQuery<TicketDetail>({
    queryKey: ['tickets', 'detail', ticketId],
    queryFn: ({ signal }) => ticketApi.getById(ticketId!, signal),
    enabled: !!ticketId,
    retry: (failureCount, error) =>
      (error as unknown as { response?: { status: number } })?.response?.status !== 404 && failureCount < 2,
  });
}

export function useTicketActivityQuery(ticketId: string | null) {
  return useQuery<ActivityEntry[]>({
    queryKey: ['tickets', 'activity', ticketId],
    queryFn: ({ signal }) => ticketApi.getActivity(ticketId!, signal),
    enabled: !!ticketId,
  });
}

export function useNewTicketsPoll(filterParams: TicketFilterParams) {
  const queryClient = useQueryClient();
  const sinceRef = useRef<string>('');

  const validated = TicketFilterParamsSchema.parse(filterParams);
  const filterKey = JSON.stringify(buildListKey(validated));

  useEffect(() => {
    sinceRef.current = '';
  }, [filterKey]);

  return useQuery<{ count: number }>({
    queryKey: ['tickets', 'since', buildListKey(validated)],
    queryFn: ({ signal }) => {
      const listData = queryClient.getQueryData<ListResponse>([
        'tickets',
        'list',
        buildListKey({ ...validated, page: 1, pageSize: 25 }),
      ]);
      if (listData?.serverTime && !sinceRef.current) {
        sinceRef.current = listData.serverTime;
      }
      return ticketApi.getSince(sinceRef.current, validated, signal);
    },
    enabled: !!sinceRef.current,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    retry: 0,
  });
}

export function useUserSearchQuery(q: string, orgId?: string) {
  return useQuery<UserRef[]>({
    queryKey: ['users', 'search', q, orgId],
    queryFn: ({ signal }) => userApi.search(q, orgId, signal),
    enabled: q.length >= 2,
    staleTime: 60_000,
    gcTime: 60_000,
  });
}