import { Clock } from "lucide-react";
import type { MessageSystemMessageProps } from "../../types/messages";
import { formatTime } from "../../lib/messagesComponent";

export function SystemMessage({ message }: MessageSystemMessageProps) {
  return (
    <div className="flex items-center gap-3 py-1.5 text-[12px] text-[--ink-3]">
      <span className="h-px flex-1 bg-[--border-default]" />
      <span className="inline-flex max-w-[70%] items-center gap-1.5 rounded-[--radius-sm] border border-[--border-default] bg-[--surface-card] px-2.5 py-1 shadow-[--elev-1]">
        <Clock className="size-3.5" />
        <span className="truncate">
          Ticket activity • {formatTime(message.at)}
        </span>
      </span>
      <span className="h-px flex-1 bg-[--border-default]" />
    </div>
  );
}
