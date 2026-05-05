import { cn } from "../../lib/utils";
import type { MessageUserMessageProps } from "../../types/messages";
import { formatTime } from "../../lib/messagesComponent";
import { useAuthState } from "../../stores/useAuthStore";
import { FileAttachment } from "./FileAttachment";

export function UserMessage({ message, justSent }: MessageUserMessageProps) {
  const currentUserId = useAuthState((s) => s.user?.id);
  const own = !!currentUserId && message.sender.id === currentUserId;
  return (
    <div
      className={cn(
        "grid w-full grid-cols-[96px_minmax(0,1fr)] gap-3 max-[720px]:grid-cols-1 max-[720px]:gap-1",
        justSent && "animate-in slide-in-from-bottom-2 fade-in",
      )}
    >
      <div className="pt-2 text-[11px] text-[--ink-3] max-[720px]:pt-0">
        <div className="font-mono">{formatTime(message.at)}</div>
        <div className="mt-1 w-fit rounded-[--radius-sm] border border-[--border-default] bg-[--surface-card] px-1.5 py-0.5 text-[10px] uppercase tracking-[0.08em] text-[--ink-2]">
          {own ? "Outbound" : "Inbound"}
        </div>
      </div>
      <article
        className={cn(
          "rounded-[--radius-md] border bg-[--surface-card] px-3 py-2.5 shadow-[--elev-1]",
          own
            ? "border-[--status-info-border]"
            : "border-[--border-default]",
        )}
      >
        <div className="mb-1.5 flex min-w-0 items-center justify-between gap-3">
          <span className="truncate text-[12px] font-semibold text-[--ink-1]">
            {own ? "Operator reply" : message.sender.name}
          </span>
          <span className="shrink-0 text-[11px] text-[--ink-3]">
            Ticket thread
          </span>
        </div>
        <div
          className={cn(
            "border-l-[3px] pl-3 text-[13px] leading-6 text-[--ink-1]",
            own ? "border-l-[--status-info-fg]" : "border-l-[--action-bg]",
          )}
        >
          {message.content ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : null}
          {message.file ? <FileAttachment file={message.file} /> : null}
        </div>
      </article>
    </div>
  );
}
