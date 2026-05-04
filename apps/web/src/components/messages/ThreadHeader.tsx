import { ArrowUpRight } from "lucide-react";
import type { MessageThreadHeaderProps } from "../../types/messages";
import { Badge } from "./Badge";
import { ParticipantAvatar } from "./ParticipantAvatar";
import { messageSecondaryButton } from "./styles";

export function ThreadHeader({ thread }: MessageThreadHeaderProps) {
  return (
    <header className="flex min-h-20 items-center justify-between gap-4 border-b border-[--border-default] bg-[--surface-card] px-4 py-3 max-[720px]:flex-col max-[720px]:items-start">
      <div className="min-w-0">
        <div className="mb-1 flex items-center gap-2">
          <span className="rounded-[--radius-sm] border border-[--border-default] bg-[--surface-sunken] px-1.5 py-0.5 font-mono text-[11px] font-medium text-[--ink-3]">
            #{thread.ticket.id}
          </span>
          <Badge value={thread.ticket.status} tone="status" />
          <Badge value={thread.ticket.priority} tone="priority" />
        </div>
        <h2 className="m-0 truncate text-[16px] font-semibold leading-6 text-[--ink-1]">
          {thread.ticket.subject}
        </h2>
        <p className="mt-0.5 truncate text-[12px] text-[--ink-3]">
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
          className={messageSecondaryButton}
        >
          <ArrowUpRight className="size-3.5" />
          View Ticket
        </button>
      </div>
    </header>
  );
}
