import { cn } from "../../lib/utils";
import type { MessageThreadRowProps } from "../../types/messages";
import { firstName, formatRelative } from "../../lib/messagesComponent";
import { Badge } from "./Badge";

export function ThreadRow({ row, active, onSelect }: MessageThreadRowProps) {
  const resolved = row.ticket.status === "RESOLVED";
  const unread = row.unreadCount > 0;
  const highPriority = row.ticket.priority === "HIGH";
  const accentClass = highPriority
    ? "border-l-[--status-danger-fg]"
    : unread
      ? "border-l-[--action-bg]"
      : "border-l-[--border-subtle]";

  return (
    <button
      type="button"
      onClick={onSelect}
      title={`Open ${row.ticket.subject}`}
      className={cn(
        "group relative w-full border-l-[4px] px-3 py-3 text-left transition-colors duration-200 hover:bg-[--surface-sunken]",
        accentClass,
        active && "bg-[--action-tint-bg]",
        unread && !active && "bg-[--surface-card]",
        resolved && "opacity-60",
      )}
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-start gap-2">
            <span
              className={cn(
                "mt-1 size-2 shrink-0 rounded-full",
                unread
                  ? "bg-[--action-bg]"
                  : resolved
                    ? "bg-[--status-success-fg]"
                    : "bg-[--border-strong]",
              )}
              aria-hidden="true"
            />
            <span className="truncate text-[13px] font-semibold leading-5 text-[--ink-1]">
              {row.ticket.subject}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge value={row.ticket.priority} tone="priority" />
            <Badge value={row.ticket.status} tone="status" />
          </div>
          <p className="mt-2 truncate text-[12px] leading-5 text-[--ink-2]">
            <span className="font-medium text-[--ink-2]">
              {firstName(row.lastMessage.senderName)}:
            </span>{" "}
            {row.lastMessage.snippet}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <span className="font-mono text-[10px] text-[--ink-3]">
            {formatRelative(row.lastMessage.at)}
          </span>
          {unread ? (
            <span className="grid min-w-5 place-items-center rounded-[--radius-pill] bg-[--action-bg] px-1.5 py-0.5 text-[10px] font-semibold leading-none text-[--action-fg] shadow-[--elev-1]">
              {row.unreadCount}
            </span>
          ) : null}
        </div>
      </div>
    </button>
  );
}
