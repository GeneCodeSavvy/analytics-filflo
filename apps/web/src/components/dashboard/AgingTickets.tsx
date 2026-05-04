import { IconAlertCircle } from "@tabler/icons-react";
import { ageLabel, dashboardPriorityColor } from "../../lib/dashboardComponent";
import type { AgingTicket } from "../../types/dashboard";
import { Panel } from "./Panel";

const agingRowClass =
  "group grid w-full cursor-crosshair grid-cols-[18px_minmax(72px,92px)_1fr_54px_16px] items-center gap-2 px-4 py-3 text-left transition hover:-translate-x-0.5 hover:bg-[--surface-sunken]";

export function AgingTickets({ tickets }: { tickets: AgingTicket[] }) {
  return (
    <Panel title="Aging tickets" count={tickets.length}>
      <div className="divide-y divide-[--border-subtle]">
        {tickets.slice(0, 6).map((ticket) => (
          <button key={ticket.id} type="button" className={agingRowClass}>
            <span
              className="h-2 w-2 rounded-full"
              style={{
                backgroundColor: dashboardPriorityColor[ticket.priority],
              }}
            />
            <span className="truncate text-xs text-[--ink-1] transition group-hover:text-[--action-tint-fg]">
              {ticket.id}
            </span>
            <span className="truncate text-[13px] text-[--ink-1]">
              {ticket.subject}
            </span>
            <span
              className={`flex items-center justify-end gap-1 text-xs ${
                ticket.isStaleHigh
                  ? "text-[--status-danger-fg]"
                  : "text-[--ink-3]"
              }`}
            >
              {ticket.isStaleHigh ? <IconAlertCircle size={12} /> : null}
              {ageLabel(ticket.ageMs)}
            </span>
            <span className="text-[--action-tint-fg] opacity-0 transition group-hover:opacity-100">
              →
            </span>
          </button>
        ))}
      </div>
      <button
        type="button"
        className="cursor-crosshair px-5 py-3 text-xs font-medium text-[--action-tint-fg]"
      >
        Show all →
      </button>
    </Panel>
  );
}
