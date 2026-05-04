import { LoaderCircle } from "lucide-react";
import type { ThreadEventsProps } from "../../types/notifications";
import {
  notificationIcon,
  relativeTime,
} from "../../lib/notificationsComponent";
import { useNotificationThreadQuery } from "../../hooks/useNotificationQueries";

export function ThreadEvents({ row }: ThreadEventsProps) {
  const { data, isLoading } = useNotificationThreadQuery(row.id);

  return (
    <div className="notifications-thread">
      {isLoading ? (
        <div className="notifications-thread-loading">
          <LoaderCircle className="size-3.5 animate-spin" />
          Loading updates
        </div>
      ) : null}
      {(data?.events ?? []).map((event) => {
        const Icon = notificationIcon(event.type);
        return (
          <div key={event.id} className="notifications-thread-item">
            <Icon className="size-3.5" />
            <div>
              <p>{event.description}</p>
              <span>
                {event.actor.name} · {relativeTime(event.at)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
