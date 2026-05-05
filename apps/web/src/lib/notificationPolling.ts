import type { NotificationListParams } from "../types/notifications";

export const NOTIFICATION_POLL_INTERVAL_MS = 30_000;

export const backgroundNotificationListParams = {
  tab: "inbox",
  page: 1,
  pageSize: 30,
} satisfies NotificationListParams;
