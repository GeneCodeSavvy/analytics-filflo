import {
  NOTIFICATION_POLL_INTERVAL_MS,
  backgroundNotificationListParams,
} from "../lib/notificationPolling";

if (NOTIFICATION_POLL_INTERVAL_MS !== 30_000) {
  throw new Error("Notification polling must run every 30 seconds.");
}

if (
  backgroundNotificationListParams.tab !== "inbox" ||
  backgroundNotificationListParams.page !== 1 ||
  backgroundNotificationListParams.pageSize !== 30
) {
  throw new Error("Background notification polling must keep the inbox warm.");
}
