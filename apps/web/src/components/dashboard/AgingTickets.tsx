import { IconAlertCircle } from "@tabler/icons-react";
import { ageLabel, dashboardPriorityColor } from "../../lib/dashboardComponent";
import type { AgingTicket } from "../../types/dashboard";
import { Panel } from "./Panel";

export function AgingTickets({ tickets }: { tickets: AgingTicket[] }) {
  return (
    <Panel title="Aging tickets" count={tickets.length}>
      <div className="divide-y divide-[#F0EDE8]">
        {tickets.slice(0, 6).map((ticket) => (
          <button
            key={ticket.id}
            type="button"
            className="group grid w-full cursor-crosshair grid-cols-[18px_minmax(72px,92px)_1fr_54px_16px] items-center gap-2 px-4 py-3 text-left transition hover:-translate-x-0.5 hover:bg-[#FAFAF8]"
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{
                backgroundColor: dashboardPriorityColor[ticket.priority],
              }}
            />
            <span className="truncate font-mono text-xs text-[#08060d] transition group-hover:text-[#D97706]">
              {ticket.id}
            </span>
            <span className="truncate text-sm text-[#08060d]">
              {ticket.subject}
            </span>
            <span
              className={`flex items-center justify-end gap-1 font-mono text-xs ${
                ticket.isStaleHigh ? "text-[#DC2626]" : "text-[#9CA3AF]"
              }`}
            >
              {ticket.isStaleHigh ? <IconAlertCircle size={12} /> : null}
              {ageLabel(ticket.ageMs)}
            </span>
            <span className="text-[#D97706] opacity-0 transition group-hover:opacity-100">
              →
            </span>
          </button>
        ))}
      </div>
      <button
        type="button"
        className="cursor-crosshair px-5 py-3 text-xs font-medium text-[#D97706]"
      >
        Show all →
      </button>
    </Panel>
  );
}
