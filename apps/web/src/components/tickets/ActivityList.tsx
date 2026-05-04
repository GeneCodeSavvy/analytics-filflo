import type { ActivityEntry } from "../../types/tickets";
import { relativeTime } from "../../lib/ticketsComponent";

type ActivityListProps = {
  activity: ActivityEntry[];
};

export function ActivityList({ activity }: ActivityListProps) {
  if (activity.length === 0)
    return (
      <div className="pt-4 text-sm text-muted-foreground">No activity yet.</div>
    );

  return (
    <div className="tickets-activity">
      {activity.map((item) => {
        const change = item.changes ? Object.entries(item.changes)[0] : null;
        const verb =
          item.type === "created"
            ? "created"
            : item.type === "status_change"
              ? "changed status to"
              : item.type === "assignee_change"
                ? "assigned"
                : item.type.replace("_", " ");
        const object = change?.[1]?.to ?? item.comment ?? "ticket";
        return (
          <div key={item.id} className="tickets-activity-item">
            <span className="text-foreground">{item.actor.name}</span>{" "}
            <span className="text-muted-foreground">{verb}</span>{" "}
            <span className="text-foreground">{object}</span>{" "}
            <span className="text-muted-foreground">
              · {relativeTime(item.createdAt)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
