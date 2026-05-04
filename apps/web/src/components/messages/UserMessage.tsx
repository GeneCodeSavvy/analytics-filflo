import { cn } from "../../lib/utils";
import type { MessageUserMessageProps } from "../../types/messages";
import { CURRENT_USER_ID, formatTime } from "../../lib/messagesComponent";
import { FileAttachment } from "./FileAttachment";

export function UserMessage({ message, justSent }: MessageUserMessageProps) {
  const own = message.sender.id === CURRENT_USER_ID;
  return (
    <div
      className={cn(
        "flex w-full",
        own ? "justify-end" : "justify-start",
        justSent && "animate-in slide-in-from-bottom-2 fade-in",
      )}
    >
      <div className={cn("max-w-[72%]", own && "text-right")}>
        <div className="mb-1 flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="font-medium text-zinc-700">
            {own ? "You" : message.sender.name}
          </span>
          <span className="font-mono">{formatTime(message.at)}</span>
        </div>
        <div
          className={cn(
            "rounded-sm px-3 py-2 text-sm leading-6 shadow-sm",
            own
              ? "bg-zinc-900 text-white"
              : "border border-border bg-white text-foreground",
          )}
        >
          {message.content ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : null}
          {message.file ? <FileAttachment file={message.file} /> : null}
        </div>
      </div>
    </div>
  );
}
