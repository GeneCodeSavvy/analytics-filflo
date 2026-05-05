import { IconInbox } from "@tabler/icons-react";
import { dashboardPriorityColor } from "../../lib/dashboardComponent";
import type { MyQueueTicket } from "../../types/dashboard";
import { Panel } from "./Panel";

const queueRowClass =
  "group flex w-full cursor-crosshair items-center gap-3 px-4 py-3 text-left transition hover:-translate-x-0.5 hover:bg-[--surface-sunken]";

export function MyQueue({ tickets }: { tickets: MyQueueTicket[] }) {
  return (
    <Panel title="My queue" count={tickets.length}>
      <div className="divide-y divide-[--border-subtle]">
        {tickets.length ? (
          tickets.map((ticket) => (
            <button key={ticket.id} type="button" className={queueRowClass}>
              <span
                className="shrink-0 rounded-[--radius-pill] border px-2 py-0.5 text-[10px] font-medium"
                style={{
                  color: dashboardPriorityColor[ticket.priority],
                  borderColor: dashboardPriorityColor[ticket.priority],
                }}
              >
                {ticket.priority}
              </span>
              <span className="min-w-0 flex-1 truncate text-[13px] text-[--ink-1]">
                {ticket.subject}
              </span>
              <span className="shrink-0 text-[11px] uppercase tracking-[0.08em] text-[--ink-3]">
                {ticket.requester?.name ?? ticket.status.replace("_", " ")}
              </span>
            </button>
          ))
        ) : (
          <div className="flex h-52 flex-col items-center justify-center gap-2 text-center">
            <IconInbox size={32} className="text-[--border-strong]" />
            <p className="text-[13px] text-[--ink-3]">You're all caught up</p>
          </div>
        )}
      </div>
    </Panel>
  );
}
