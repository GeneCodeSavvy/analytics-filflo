import { cn } from "../../lib/utils";
import type { MessageThreadRowProps } from "../../types/messages";
import { firstName, formatRelative } from "../../lib/messagesComponent";
import { Badge } from "./Badge";

export function ThreadRow({ row, active, onSelect }: MessageThreadRowProps) {
  const resolved = row.ticket.status === "RESOLVED";
  const unread = row.unreadCount > 0;
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group relative w-full border-l-[3px] border-l-transparent px-[12px] py-[10px] text-left transition-colors duration-200 hover:bg-[--surface-sunken]",
        active && "border-l-[--action-bg] bg-[--surface-sunken]",
        unread && !active && "border-l-[--border-strong]",
        resolved && "opacity-60",
      )}
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="shrink-0 rounded-[--radius-sm] border border-[--border-default] bg-[--surface-card] px-1.5 py-0.5 font-mono text-[11px] font-medium text-[--ink-3]">
              #{row.ticket.id}
            </span>
            <span className="truncate text-[13px] font-semibold text-[--ink-1]">
              {row.ticket.subject}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            <Badge value={row.ticket.priority} tone="priority" />
            <Badge value={row.ticket.status} tone="status" />
          </div>
          <p className="mt-2 truncate text-[12px] leading-5 text-[--ink-3]">
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
            <span className="grid min-w-5 place-items-center rounded-full bg-[--action-bg] px-1.5 py-0.5 text-[10px] font-semibold leading-none text-[--action-fg]">
              {row.unreadCount}
            </span>
          ) : null}
        </div>
      </div>
    </button>
  );
}
