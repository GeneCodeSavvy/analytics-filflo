import { IconInbox } from "@tabler/icons-react";
import { dashboardPriorityColor } from "../../lib/dashboardComponent";
import type { MyQueueTicket } from "../../types/dashboard";
import { Panel } from "./Panel";

export function MyQueue({ tickets }: { tickets: MyQueueTicket[] }) {
  return (
    <Panel title="My queue" count={tickets.length}>
      <div className="py-3">
        {tickets.length ? (
          tickets.map((ticket) => (
            <button
              key={ticket.id}
              type="button"
              className="mx-3 mb-2 block w-[calc(100%-1.5rem)] cursor-crosshair rounded-lg border border-[#F0EDE8] bg-[#FAFAF8] p-3 text-left transition hover:-translate-y-px hover:border-[#E8E6E0]"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span
                  className="rounded-full border px-2 py-0.5 text-[10px] font-medium"
                  style={{
                    color: dashboardPriorityColor[ticket.priority],
                    borderColor: dashboardPriorityColor[ticket.priority],
                  }}
                >
                  {ticket.priority}
                </span>
                <span className="font-mono text-[11px] text-[#6B7280]">
                  {ticket.id}
                </span>
              </div>
              <div className="truncate text-[13px] font-medium text-[#08060d]">
                {ticket.subject}
              </div>
              <div className="mt-1 truncate text-[10px] uppercase tracking-[0.08em] text-[#9CA3AF]">
                {ticket.requester?.name ?? ticket.status.replace("_", " ")}
              </div>
            </button>
          ))
        ) : (
          <div className="flex h-52 flex-col items-center justify-center gap-2 text-center">
            <IconInbox size={32} className="text-[#D1CEC7]" />
            <p className="text-[13px] text-[#9CA3AF]">You're all caught up</p>
          </div>
        )}
      </div>
    </Panel>
  );
}
