import {
  backgroundNotificationListParams,
  useNotificationCountQuery,
  useNotificationsQuery,
} from "../hooks/useNotificationQueries";

export function NotificationQueryPoller() {
  useNotificationCountQuery();
  useNotificationsQuery(backgroundNotificationListParams);

  return null;
}
