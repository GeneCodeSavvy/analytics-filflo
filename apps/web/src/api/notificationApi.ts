import { api } from ".";
import type {
  NotificationListParams,
  NotificationListResponse,
  NotificationCountResponse,
  NotificationThread,
  SnoozePayload,
  BulkNotificationPayload,
  InvitationResponsePayload,
  NotificationState,
} from "../types/notifications";

export const notificationApi = {
  getList: (
    params: NotificationListParams,
    signal?: AbortSignal,
  ): Promise<NotificationListResponse> =>
    api.get<NotificationListResponse>("/notifications", { params, signal }),

  getCount: (signal?: AbortSignal): Promise<NotificationCountResponse> =>
    api.get<NotificationCountResponse>("/notifications/count", { signal }),

  getThread: (id: string, signal?: AbortSignal): Promise<NotificationThread> =>
    api.get<NotificationThread>(`/notifications/${id}/thread`, { signal }),

  updateState: (id: string, state: NotificationState): Promise<void> =>
    api.patch(`/notifications/${id}`, { state }),

  markRead: (id: string): Promise<void> =>
    notificationApi.updateState(id, "read"),

  markUnread: (id: string): Promise<void> =>
    notificationApi.updateState(id, "inbox"),

  snooze: (id: string, payload: SnoozePayload): Promise<void> =>
    api.patch(`/notifications/${id}/snooze`, payload),

  bulk: (payload: BulkNotificationPayload): Promise<void> =>
    api.post("/notifications/bulk", payload),

  respondToInvitation: (
    invitationId: string,
    payload: InvitationResponsePayload,
  ): Promise<void> =>
    api.post(`/notifications/invitations/${invitationId}/respond`, payload),

  muteTicket: (ticketId: string): Promise<void> =>
    api.post("/notifications/mute", { ticketId }),

  unmuteTicket: (ticketId: string): Promise<void> =>
    api.delete(`/notifications/mute/${ticketId}`),
};
