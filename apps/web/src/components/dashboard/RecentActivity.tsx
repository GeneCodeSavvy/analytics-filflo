import { avatarColor, initials, timeAgo } from "../../lib/dashboardComponent";
import type { ActivityEntry } from "../../types/dashboard";
import { Panel } from "./Panel";

export function RecentActivity({ activity }: { activity: ActivityEntry[] }) {
  return (
    <Panel title="Recent activity" count={activity.length}>
      <div className="dashboard-feed max-h-[330px] overflow-y-auto px-5 py-4">
        {activity.map((entry, index) => (
          <div
            key={`${entry.ticket.id}-${entry.at}`}
            className="relative flex gap-3 pb-4 last:pb-0"
          >
            {index < activity.length - 1 ? (
              <span className="absolute left-3 top-7 h-[calc(100%-28px)] w-px bg-[#F0EDE8]" />
            ) : null}
            <div
              className="z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-white text-[10px] font-medium text-white"
              style={{ backgroundColor: avatarColor(entry.actor.name) }}
            >
              {initials(entry.actor.name)}
            </div>
            <p className="min-w-0 pt-0.5 text-[13px] leading-5 text-[#08060d]">
              <span>
                {entry.actor.name} {entry.action}{" "}
              </span>
              <span className="font-mono text-[#D97706]">
                {entry.ticket.id}
              </span>
              <span className="text-[#9CA3AF]"> · {timeAgo(entry.at)}</span>
            </p>
          </div>
        ))}
      </div>
    </Panel>
  );
}
