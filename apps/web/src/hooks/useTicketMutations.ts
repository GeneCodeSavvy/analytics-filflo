import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { QueryClient } from '@tanstack/react-query';
import { ticketApi } from '../api/ticketApi';
import type { UpdateTicketPayload } from '../api/ticketApi';
import type { TicketStatus, TicketPriority, NewTicketDraft, AssignPayload, BulkResult, TicketRow, TicketDetail } from '../lib/ticketParams';

function patchTicketInLists(
  queryClient: QueryClient,
  id: string,
  patch: Partial<TicketRow>
) {
  queryClient.setQueriesData(
    { queryKey: ['tickets', 'list'] },
    (old: unknown) => {
      if (!old) return old;
      const data = old as { rows: TicketRow[] };
      return {
        ...data,
        rows: data.rows.map((r: TicketRow) => (r.id === id ? { ...r, ...patch } : r)),
      };
    }
  );
}

function patchDetail(queryClient: QueryClient, id: string, patch: Partial<TicketDetail>) {
  queryClient.setQueryData<TicketDetail>(['tickets', 'detail', id], (old) => {
    if (!old) return old;
    return { ...old, ...patch };
  });
}

function getAllListPages(queryClient: QueryClient) {
  return queryClient.getQueriesData({ queryKey: ['tickets', 'list'] });
}

export function useStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TicketStatus }) =>
      ticketApi.updateStatus(id, status),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['tickets', 'list'] });
      await queryClient.cancelQueries({ queryKey: ['tickets', 'detail', id] });

      const prevPages = getAllListPages(queryClient);
      const prevDetail = queryClient.getQueryData(['tickets', 'detail', id]);

      patchTicketInLists(queryClient, id, { status });
      patchDetail(queryClient, id, { status });

      return { prevPages, prevDetail };
    },
    onError: (_err, { id }, ctx) => {
      if (ctx?.prevPages) {
        ctx.prevPages.forEach(([key, data]) => queryClient.setQueryData(key, data));
      }
      if (ctx?.prevDetail) {
        queryClient.setQueryData(['tickets', 'detail', id], ctx.prevDetail);
      }
    },
    onSettled: (_data, _err, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['tickets', 'list'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['tickets', 'detail', id] });
      queryClient.invalidateQueries({ queryKey: ['tickets', 'activity', id] });
    },
  });
}

export function usePriorityMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, priority }: { id: string; priority: TicketPriority }) =>
      ticketApi.updatePriority(id, priority),
    onMutate: async ({ id, priority }) => {
      await queryClient.cancelQueries({ queryKey: ['tickets', 'list'] });
      await queryClient.cancelQueries({ queryKey: ['tickets', 'detail', id] });

      const prevPages = getAllListPages(queryClient);
      const prevDetail = queryClient.getQueryData(['tickets', 'detail', id]);

      patchTicketInLists(queryClient, id, { priority });
      patchDetail(queryClient, id, { priority });

      return { prevPages, prevDetail };
    },
    onError: (_err, { id }, ctx) => {
      if (ctx?.prevPages) {
        ctx.prevPages.forEach(([key, data]) => queryClient.setQueryData(key, data));
      }
      if (ctx?.prevDetail) {
        queryClient.setQueryData(['tickets', 'detail', id], ctx.prevDetail);
      }
    },
    onSettled: (_data, _err, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['tickets', 'list'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['tickets', 'detail', id] });
      queryClient.invalidateQueries({ queryKey: ['tickets', 'activity', id] });
    },
  });
}

export function useAssignMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AssignPayload }) =>
      ticketApi.assign(id, payload),
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: ['tickets', 'list'] });
      await queryClient.cancelQueries({ queryKey: ['tickets', 'detail', id] });

      const prevPages = getAllListPages(queryClient);
      const prevDetail = queryClient.getQueryData(['tickets', 'detail', id]);

      const patch: Partial<TicketRow> = {};
      if (payload.add.length > 0 && payload.remove.length === 0) {
        patch.assigneeCount = (prevDetail as any)?.assigneeCount + payload.add.length || 1;
      } else if (payload.remove.length > 0 && payload.add.length === 0) {
        patch.assigneeCount = Math.max(((prevDetail as any)?.assigneeCount || 1) - payload.remove.length, 0);
      }

      patchTicketInLists(queryClient, id, patch);
      patchDetail(queryClient, id, patch);

      return { prevPages, prevDetail };
    },
    onError: (_err, { id }, ctx) => {
      if (ctx?.prevPages) {
        ctx.prevPages.forEach(([key, data]) => queryClient.setQueryData(key, data));
      }
      if (ctx?.prevDetail) {
        queryClient.setQueryData(['tickets', 'detail', id], ctx.prevDetail);
      }
    },
    onSettled: (_data, _err, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['tickets', 'list'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['tickets', 'detail', id] });
      queryClient.invalidateQueries({ queryKey: ['tickets', 'activity', id] });
    },
  });
}

export function useUpdateTicketMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: UpdateTicketPayload }) =>
      ticketApi.update(id, patch),
    onMutate: async ({ id, patch }) => {
      await queryClient.cancelQueries({ queryKey: ['tickets', 'list'] });
      await queryClient.cancelQueries({ queryKey: ['tickets', 'detail', id] });

      const prevPages = getAllListPages(queryClient);
      const prevDetail = queryClient.getQueryData(['tickets', 'detail', id]);

      patchTicketInLists(queryClient, id, patch);
      patchDetail(queryClient, id, patch);

      return { prevPages, prevDetail };
    },
    onError: (_err, { id }, ctx) => {
      if (ctx?.prevPages) {
        ctx.prevPages.forEach(([key, data]) => queryClient.setQueryData(key, data));
      }
      if (ctx?.prevDetail) {
        queryClient.setQueryData(['tickets', 'detail', id], ctx.prevDetail);
      }
    },
    onSettled: (_data, _err, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['tickets', 'list'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['tickets', 'detail', id] });
      queryClient.invalidateQueries({ queryKey: ['tickets', 'activity', id] });
    },
  });
}

export function useBulkUpdateMutation() {
  const queryClient = useQueryClient();

  return useMutation<BulkResult, Error, { ids: string[]; status?: TicketStatus; priority?: TicketPriority; category?: string }>({
    mutationFn: (payload) => ticketApi.bulkUpdate(payload),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['tickets', 'list'] });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets', 'list'], refetchType: 'active' });
    },
  });
}

export function useBulkDeleteMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { ids: string[] }>({
    mutationFn: (payload) => ticketApi.bulkDelete(payload),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['tickets', 'list'] });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets', 'list'], refetchType: 'active' });
    },
  });
}

export function useCreateTicketMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: NewTicketDraft) => ticketApi.create(data),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets', 'list'], refetchType: 'active' });
    },
  });
}

export function useDeleteTicketMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => ticketApi.delete(id),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets', 'list'], refetchType: 'active' });
    },
  });
}

export function useSaveViewMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; filters?: Record<string, unknown>; sort?: { field: string; dir: string }[] }) =>
      ticketApi.createView(data),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets', 'views'] });
    },
  });
}

export function useUpdateViewMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; filters?: Record<string, unknown>; sort?: { field: string; dir: string }[] } }) =>
      ticketApi.updateView(id, data),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets', 'views'] });
    },
  });
}

export function useDeleteViewMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => ticketApi.deleteView(id),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets', 'views'] });
    },
  });
}