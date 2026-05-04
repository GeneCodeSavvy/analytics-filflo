import { Paperclip } from "lucide-react";
import type { MessageFileAttachmentProps } from "../../types/messages";
import { formatFileSize } from "../../lib/messagesComponent";

export function FileAttachment({ file }: MessageFileAttachmentProps) {
  return (
    <a
      href={file.url}
      className="mt-2 flex items-center gap-2 rounded-[--radius-sm] border border-[--border-default] bg-[--surface-card] px-3 py-2 text-[12px] text-[--ink-2] shadow-[--elev-1] transition-colors hover:bg-[--surface-sunken]"
    >
      <Paperclip className="size-3.5 text-[--ink-3]" />
      <span className="min-w-0 flex-1 truncate font-medium">{file.name}</span>
      <span className="shrink-0 font-mono text-[10px] text-[--ink-3]">
        {formatFileSize(file.size)}
      </span>
    </a>
  );
}
