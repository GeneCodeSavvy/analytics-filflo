import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { notificationApi } from "../api/notificationApi";
import { NotificationListParamsSchema } from "../types/notifications";
import { buildListKey } from "../lib/notificationParams";
import {
  NOTIFICATION_POLL_INTERVAL_MS,
  backgroundNotificationListParams,
} from "../lib/notificationPolling";
import type {
  NotificationListParams,
  NotificationListResponse,
  NotificationCountResponse,
  NotificationThread,
} from "../types/notifications";

export { NOTIFICATION_POLL_INTERVAL_MS, backgroundNotificationListParams };

export function useNotificationsQuery(params: NotificationListParams) {
  const validated = NotificationListParamsSchema.parse(params);
  return useQuery<NotificationListResponse>({
    queryKey: ["notifications", "list", buildListKey(validated)],
    queryFn: ({ signal }) => notificationApi.getList(validated, signal),
    refetchInterval: NOTIFICATION_POLL_INTERVAL_MS,
    refetchIntervalInBackground: true,
    staleTime: 25_000,
    placeholderData: (prev) => prev,
    retry: 1,
  });
}

export function useNotificationCountQuery() {
  const queryClient = useQueryClient();
  const prevCountRef = useRef<number>(0);

  return useQuery<NotificationCountResponse>({
    queryKey: ["notifications", "count"],
    queryFn: ({ signal }) => notificationApi.getCount(signal),
    refetchInterval: NOTIFICATION_POLL_INTERVAL_MS,
    refetchIntervalInBackground: true,
    retry: 0,
    select: (data) => {
      if (data.inbox > prevCountRef.current) {
        queryClient.invalidateQueries({ queryKey: ["notifications", "list"] });
      }
      prevCountRef.current = data.inbox;
      return data;
    },
  });
}

export function useNotificationThreadQuery(notificationId: string | null) {
  return useQuery<NotificationThread>({
    queryKey: ["notifications", "thread", notificationId],
    queryFn: ({ signal }) => notificationApi.getThread(notificationId!, signal),
    enabled: !!notificationId,
    staleTime: 60_000,
  });
}
