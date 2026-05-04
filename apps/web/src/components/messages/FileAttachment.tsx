import { Paperclip } from "lucide-react";
import type { MessageFileAttachmentProps } from "../../types/messages";
import { formatFileSize } from "../../lib/messagesComponent";

export function FileAttachment({ file }: MessageFileAttachmentProps) {
  return (
    <a
      href={file.url}
      className="mt-2 flex items-center gap-2 rounded-sm border border-border bg-white px-3 py-2 text-xs text-zinc-700 shadow-sm transition-colors hover:bg-muted/60"
    >
      <Paperclip className="size-3.5 text-muted-foreground" />
      <span className="min-w-0 flex-1 truncate font-medium">{file.name}</span>
      <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
        {formatFileSize(file.size)}
      </span>
    </a>
  );
}
