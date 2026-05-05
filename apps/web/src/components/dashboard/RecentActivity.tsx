import { avatarColor, initials, timeAgo } from "../../lib/dashboardComponent";
import type { ActivityEntry } from "../../types/dashboard";
import { Panel } from "./Panel";

const ACTION_LABELS: Record<string, { verb: string; prep: string }> = {
  "status change": { verb: "changed the status of", prep: "" },
  "assignee change": { verb: "reassigned", prep: "" },
  created: { verb: "created", prep: "" },
  commented: { verb: "commented on", prep: "" },
  resolved: { verb: "resolved", prep: "" },
  closed: { verb: "closed", prep: "" },
  reopened: { verb: "reopened", prep: "" },
  "priority change": { verb: "changed the priority of", prep: "" },
  deleted: { verb: "deleted", prep: "" },
};

function formatAction(raw: string): string {
  return ACTION_LABELS[raw.toLowerCase()]?.verb ?? raw;
}

export function RecentActivity({ activity }: { activity: ActivityEntry[] }) {
  return (
    <Panel title="Recent activity" count={activity.length}>
      <div className="max-h-[330px] overflow-y-auto px-5 py-4 [scrollbar-color:var(--border-strong)_var(--border-default)] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-[--radius-pill] [&::-webkit-scrollbar-thumb]:bg-[--border-strong] [&::-webkit-scrollbar-track]:bg-[--border-default]">
        {activity.map((entry, index) => (
          <div
            key={`${entry.ticket.id}-${entry.at}`}
            className="relative flex gap-3 pb-4 last:pb-0"
          >
            {index < activity.length - 1 ? (
              <span className="absolute left-3 top-7 h-[calc(100%-28px)] w-px bg-[--border-subtle]" />
            ) : null}
            <div
              className="z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-[--radius-pill] border-2 border-[--surface-card] text-[10px] font-medium text-[--surface-card]"
              style={{ backgroundColor: avatarColor(entry.actor.name) }}
            >
              {initials(entry.actor.name)}
            </div>
            <div className="min-w-0 pt-0.5">
              <p className="text-[13px] leading-5 text-[--ink-1]">
                <span className="font-medium">{entry.actor.name}</span>
                <span className="text-[--ink-2]"> {formatAction(entry.action)} </span>
                <span className="font-medium text-[--action-tint-fg]">{entry.ticket.subject}</span>
              </p>
              <p className="mt-0.5 text-[11px] text-[--ink-3]">{timeAgo(entry.at)}</p>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}
