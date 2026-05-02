import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { QueryClient, QueryKey } from "@tanstack/react-query";
import { notificationApi } from "../api/notificationApi";
import type {
  NotificationRow,
  NotificationListResponse,
  NotificationState,
  BulkNotificationPayload,
  SnoozePayload,
  InvitationResponsePayload,
  NotificationApiSettings,
} from "../lib/notificationParams";

function restoreSnapshots(
  queryClient: QueryClient,
  snapshots: Array<readonly [QueryKey, NotificationListResponse | undefined]>
) {
  snapshots.forEach(([key, data]) => queryClient.setQueryData(key, data));
}

function patchNotificationState(
  queryClient: QueryClient,
  id: string,
  patch: Partial<NotificationRow>
) {
  queryClient.setQueriesData(
    { queryKey: ["notifications", "list"] },
    (old: NotificationListResponse | undefined) => {
      if (!old) return old;
      return {
        ...old,
        rows: old.rows.map((row) =>
          row.id === id ? { ...row, ...patch } : row
        ),
      };
    }
  );
}

function patchNotificationRows(
  queryClient: QueryClient,
  updater: (row: NotificationRow) => NotificationRow
) {
  queryClient.setQueriesData(
    { queryKey: ["notifications", "list"] },
    (old: NotificationListResponse | undefined) => {
      if (!old) return old;
      return {
        ...old,
        rows: old.rows.map(updater),
      };
    }
  );
}

function stateForBulkOp(
  op: BulkNotificationPayload["op"]
): NotificationState | null {
  if (op === "read") return "read";
  if (op === "done") return "done";
  if (op === "unread") return "inbox";
  return null;
}

export function useMarkReadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationApi.markRead(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["notifications", "list"] });
      const snapshots = queryClient.getQueriesData<NotificationListResponse>({
        queryKey: ["notifications", "list"],
      });
      patchNotificationState(queryClient, id, { state: "read" });
      return { snapshots };
    },
    onError: (_error, _id, context) => {
      if (context) restoreSnapshots(queryClient, context.snapshots);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", "count"] });
    },
  });
}

export function useMarkDoneMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationApi.markDone(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["notifications", "list"] });
      const snapshots = queryClient.getQueriesData<NotificationListResponse>({
        queryKey: ["notifications", "list"],
      });
      patchNotificationState(queryClient, id, { state: "done" });
      return { snapshots };
    },
    onError: (_error, _id, context) => {
      if (context) restoreSnapshots(queryClient, context.snapshots);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", "count"] });
    },
  });
}

export function useMarkUnreadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationApi.markUnread(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["notifications", "list"] });
      const snapshots = queryClient.getQueriesData<NotificationListResponse>({
        queryKey: ["notifications", "list"],
      });
      patchNotificationState(queryClient, id, { state: "inbox" });
      return { snapshots };
    },
    onError: (_error, _id, context) => {
      if (context) restoreSnapshots(queryClient, context.snapshots);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", "count"] });
    },
  });
}

export function useSnoozeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: SnoozePayload }) =>
      notificationApi.snooze(id, payload),
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: ["notifications", "list"] });
      const snapshots = queryClient.getQueriesData<NotificationListResponse>({
        queryKey: ["notifications", "list"],
      });
      patchNotificationState(queryClient, id, {
        state: "done",
        snoozedUntil: payload.snoozedUntil,
      });
      return { snapshots };
    },
    onError: (_error, _vars, context) => {
      if (context) restoreSnapshots(queryClient, context.snapshots);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", "count"] });
    },
  });
}

export function useBulkMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: BulkNotificationPayload) =>
      notificationApi.bulk(payload),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: ["notifications", "list"] });
      const snapshots = queryClient.getQueriesData<NotificationListResponse>({
        queryKey: ["notifications", "list"],
      });
      const targetState = stateForBulkOp(payload.op);

      if (targetState && payload.scope === "ids" && payload.ids) {
        const idSet = new Set(payload.ids);
        patchNotificationRows(queryClient, (row) =>
          idSet.has(row.id) ? { ...row, state: targetState } : row
        );
      } else if (
        targetState &&
        payload.scope === "ticket" &&
        payload.ticketId
      ) {
        patchNotificationRows(queryClient, (row) =>
          row.ticket.id === payload.ticketId
            ? { ...row, state: targetState }
            : row
        );
      }

      return { snapshots };
    },
    onError: (_error, _vars, context) => {
      if (context) restoreSnapshots(queryClient, context.snapshots);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", "list"] });
      queryClient.invalidateQueries({ queryKey: ["notifications", "count"] });
    },
  });
}

export function useInvitationResponseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      invitationId,
      payload,
    }: {
      invitationId: string;
      payload: InvitationResponsePayload;
    }) => notificationApi.respondToInvitation(invitationId, payload),
    onMutate: async ({ invitationId, payload }) => {
      await queryClient.cancelQueries({ queryKey: ["notifications", "list"] });
      const snapshots = queryClient.getQueriesData<NotificationListResponse>({
        queryKey: ["notifications", "list"],
      });
      patchNotificationRows(queryClient, (row) => {
        if (
          row.type === "ticket_invitation" &&
          row.invitationId === invitationId
        ) {
          return { ...row, invitationStatus: payload.response };
        }
        return row;
      });
      return { snapshots };
    },
    onError: (_error, _vars, context) => {
      if (context) restoreSnapshots(queryClient, context.snapshots);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", "list"] });
    },
  });
}

export function useMuteTicketMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ticketId: string) => notificationApi.muteTicket(ticketId),
    onMutate: async (ticketId) => {
      await queryClient.cancelQueries({ queryKey: ["notifications", "list"] });
      const snapshots = queryClient.getQueriesData<NotificationListResponse>({
        queryKey: ["notifications", "list"],
      });
      patchNotificationRows(queryClient, (row) =>
        row.ticket.id === ticketId ? { ...row, state: "done" } : row
      );
      return { snapshots };
    },
    onError: (_error, _ticketId, context) => {
      if (context) restoreSnapshots(queryClient, context.snapshots);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", "list"] });
      queryClient.invalidateQueries({ queryKey: ["notifications", "count"] });
    },
  });
}

export function useUpdateNotificationSettingsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<NotificationApiSettings>) =>
      notificationApi.updateSettings(data),
    onSuccess: (updated) => {
      queryClient.setQueryData(["notifications", "settings"], updated);
    },
  });
}
