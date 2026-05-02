import { api } from ".";
import type {
  NotificationListParams,
  NotificationListResponse,
  NotificationCountResponse,
  NotificationThread,
  SnoozePayload,
  BulkNotificationPayload,
  InvitationResponsePayload,
  NotificationApiSettings,
} from "../lib/notificationParams";

export const notificationApi = {
  getList: (
    params: NotificationListParams,
    signal?: AbortSignal
  ): Promise<NotificationListResponse> =>
    api.get<NotificationListResponse>("/notifications", { params, signal }),

  getCount: (signal?: AbortSignal): Promise<NotificationCountResponse> =>
    api.get<NotificationCountResponse>("/notifications/count", { signal }),

  getThread: (
    id: string,
    signal?: AbortSignal
  ): Promise<NotificationThread> =>
    api.get<NotificationThread>(`/notifications/${id}/thread`, { signal }),

  getSettings: (signal?: AbortSignal): Promise<NotificationApiSettings> =>
    api.get<NotificationApiSettings>("/notifications/settings", { signal }),

  markRead: (id: string): Promise<void> =>
    api.patch(`/notifications/${id}`, { state: "read" }),

  markDone: (id: string): Promise<void> =>
    api.patch(`/notifications/${id}`, { state: "done" }),

  markUnread: (id: string): Promise<void> =>
    api.patch(`/notifications/${id}`, { state: "inbox" }),

  snooze: (id: string, payload: SnoozePayload): Promise<void> =>
    api.patch(`/notifications/${id}/snooze`, payload),

  bulk: (payload: BulkNotificationPayload): Promise<void> =>
    api.post("/notifications/bulk", payload),

  respondToInvitation: (
    invitationId: string,
    payload: InvitationResponsePayload
  ): Promise<void> =>
    api.post(`/notifications/invitations/${invitationId}/respond`, payload),

  muteTicket: (ticketId: string): Promise<void> =>
    api.post("/notifications/mute", { ticketId }),

  unmuteTicket: (ticketId: string): Promise<void> =>
    api.delete(`/notifications/mute/${ticketId}`),

  updateSettings: (
    data: Partial<NotificationApiSettings>
  ): Promise<NotificationApiSettings> =>
    api.patch<NotificationApiSettings>("/notifications/settings", data),
};
