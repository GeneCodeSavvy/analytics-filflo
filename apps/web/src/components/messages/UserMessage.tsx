import { cn } from "../../lib/utils";
import type { MessageUserMessageProps } from "../../types/messages";
import { formatTime } from "../../lib/messagesComponent";
import { useAuthState } from "../../stores/useAuthStore";
import { FileAttachment } from "./FileAttachment";

export function UserMessage({ message, justSent }: MessageUserMessageProps) {
  const currentUserId = useAuthState((s) => s.user?.email);
  const own = !!currentUserId && message.sender.email === currentUserId;
  const clientMessage = !own;
  console.log(own, clientMessage, message?.sender?.email, currentUserId);

  return (
    <div
      className={cn(
        "flex w-full",
        own ? "justify-end" : "justify-start",
        justSent && "animate-in slide-in-from-bottom-2 fade-in",
      )}
    >
      <article
        className={cn(
          "max-w-[min(760px,86%)] rounded-[--radius-md] bg-[--surface-card] px-3 py-2.5 shadow-[--elev-1] transition-shadow duration-200 hover:shadow-[--elev-2]",
          clientMessage
            ? "bg-[--action-tint-bg]"
            : "bg-[--status-info-bg]",
        )}
      >
        <div className="mb-1.5 flex min-w-0 items-center justify-between gap-3">
          <span className="truncate text-[12px] font-semibold text-[--ink-1]">
            {own ? "You" : message.sender.name}
          </span>
          <span className="shrink-0 font-mono text-[11px] text-[--ink-3]">
            {formatTime(message.at)}
          </span>
        </div>
        <div
          className={cn(
            "border-l-[3px] pl-3 text-[13px] leading-6 text-[--ink-1]",
            clientMessage
              ? "border-l-[--action-bg]"
              : "border-l-[--status-info-fg]",
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
