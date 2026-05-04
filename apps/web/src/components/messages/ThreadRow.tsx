import { cn } from "../../lib/utils";
import type { MessageThreadRowProps } from "../../types/messages";
import { firstName, formatRelative } from "../../lib/messagesComponent";
import { Badge } from "./Badge";

export function ThreadRow({ row, active, onSelect }: MessageThreadRowProps) {
  const resolved = row.ticket.status === "RESOLVED";
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group relative w-full border-l-2 border-l-transparent px-4 py-3 text-left transition-colors duration-200 hover:bg-muted/50",
        active && "border-l-zinc-950 bg-muted",
        resolved && "opacity-60",
      )}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <span className="shrink-0 font-mono text-[11px] font-medium text-muted-foreground">
              #{row.ticket.id}
            </span>
            <span className="truncate text-sm font-semibold text-foreground">
              {row.ticket.subject}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge value={row.ticket.priority} tone="priority" />
            <Badge value={row.ticket.status} tone="status" />
          </div>
          <p className="mt-2 truncate text-xs leading-5 text-muted-foreground">
            <span className="font-medium text-zinc-700">
              {firstName(row.lastMessage.senderName)}:
            </span>{" "}
            {row.lastMessage.snippet}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <span className="font-mono text-[10px] text-muted-foreground">
            {formatRelative(row.lastMessage.at)}
          </span>
          {row.unreadCount > 0 ? (
            <span className="size-2 rounded-full bg-zinc-950" />
          ) : null}
        </div>
      </div>
    </button>
  );
}
