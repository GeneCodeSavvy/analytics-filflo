import { cn } from "../../lib/utils";
import type { MessageBadgeProps } from "../../types/messages";
import { priorityClasses, statusClasses } from "../../lib/messagesComponent";

export function Badge({ value, tone }: MessageBadgeProps) {
  const classes =
    tone === "status" ? statusClasses[value] : priorityClasses[value];
  return (
    <span
      className={cn(
        "inline-flex h-5 shrink-0 items-center rounded-sm border px-1.5 font-mono text-[10px] font-medium leading-none",
        classes ?? "border-zinc-300 bg-zinc-50 text-zinc-700",
      )}
    >
      {value.replace("_", " ")}
    </span>
  );
}
