import { IconInbox } from "@tabler/icons-react";
import { dashboardPriorityColor } from "../../lib/dashboardComponent";
import type { MyQueueTicket } from "../../types/dashboard";
import { Panel } from "./Panel";

const queueButtonClass =
  "mx-3 mb-2 block w-[calc(100%-1.5rem)] cursor-crosshair rounded-[--radius-sm] border border-[--border-subtle] bg-[--surface-sunken] p-3 text-left transition hover:-translate-y-px hover:border-[--border-default]";

export function MyQueue({ tickets }: { tickets: MyQueueTicket[] }) {
  return (
    <Panel title="My queue" count={tickets.length}>
      <div className="py-3">
        {tickets.length ? (
          tickets.map((ticket) => (
            <button key={ticket.id} type="button" className={queueButtonClass}>
              <div className="mb-2 flex items-center justify-between gap-2">
                <span
                  className="rounded-[--radius-pill] border px-2 py-0.5 text-[10px] font-medium"
                  style={{
                    color: dashboardPriorityColor[ticket.priority],
                    borderColor: dashboardPriorityColor[ticket.priority],
                  }}
                >
                  {ticket.priority}
                </span>
                <span className="text-[11px] text-[--ink-2]">{ticket.id}</span>
              </div>
              <div className="truncate text-[13px] font-medium text-[--ink-1]">
                {ticket.subject}
              </div>
              <div className="mt-1 truncate text-[10px] uppercase tracking-[0.08em] text-[--ink-3]">
                {ticket.requester?.name ?? ticket.status.replace("_", " ")}
              </div>
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
