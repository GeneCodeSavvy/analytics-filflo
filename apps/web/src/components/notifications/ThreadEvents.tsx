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
    <div className="mb-2.5 ml-[52px] mr-2 overflow-hidden border-l border-[oklch(0.93_0.006_264)]">
      {isLoading ? (
        <div className="grid grid-cols-[auto_1fr] gap-2 py-[7px] pl-2.5 text-[0.6875rem] text-[oklch(0.55_0.023_264)]">
          <LoaderCircle className="size-3.5 animate-spin" />
          Loading updates
        </div>
      ) : null}
      {(data?.events ?? []).map((event) => {
        const Icon = notificationIcon(event.type);
        return (
          <div
            key={event.id}
            className="grid grid-cols-[auto_1fr] gap-2 py-[7px] pl-2.5 text-[0.6875rem] text-[oklch(0.38_0.01_264)]"
          >
            <Icon className="size-3.5" />
            <div>
              <p className="m-0">{event.description}</p>
              <span className="text-[oklch(0.55_0.023_264)]">
                {event.actor.name} · {relativeTime(event.at)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
