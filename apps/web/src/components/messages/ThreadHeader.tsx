import { ArrowUpRight } from "lucide-react";
import type { MessageThreadHeaderProps } from "../../types/messages";
import { Badge } from "./Badge";
import { ParticipantAvatar } from "./ParticipantAvatar";

export function ThreadHeader({ thread }: MessageThreadHeaderProps) {
  return (
    <header className="flex min-h-20 items-center justify-between gap-4 border-b border-border bg-white px-5 py-3">
      <div className="min-w-0">
        <div className="mb-1 flex items-center gap-2">
          <span className="font-mono text-xs font-medium text-muted-foreground">
            #{thread.ticket.id}
          </span>
          <Badge value={thread.ticket.status} tone="status" />
          <Badge value={thread.ticket.priority} tone="priority" />
        </div>
        <h2 className="truncate text-base font-semibold leading-6 text-foreground">
          {thread.ticket.subject}
        </h2>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {thread.ticket.orgName}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-4">
        <div className="flex items-center">
          {thread.participants.slice(0, 4).map((participant, index) => (
            <ParticipantAvatar
              key={participant.id}
              user={participant}
              index={index}
            />
          ))}
        </div>
        <button
          type="button"
          className="inline-flex h-8 items-center gap-2 rounded-sm border border-border bg-white px-3 text-xs font-medium text-foreground shadow-sm transition-colors hover:bg-muted/60"
        >
          <ArrowUpRight className="size-3.5" />
          View Ticket
        </button>
      </div>
    </header>
  );
}
