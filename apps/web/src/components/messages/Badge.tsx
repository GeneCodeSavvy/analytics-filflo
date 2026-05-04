import { cn } from "../../lib/utils";
import type { MessageBadgeProps } from "../../types/messages";

const statusClasses: Record<string, string> = {
  OPEN: "border-[--status-info-border] bg-[--status-info-bg] text-[--status-info-fg]",
  IN_PROGRESS:
    "border-[--status-warn-border] bg-[--status-warn-bg] text-[--status-warn-fg]",
  REVIEW:
    "border-[--status-neutral-border] bg-[--status-neutral-bg] text-[--status-neutral-fg]",
  RESOLVED:
    "border-[--status-success-border] bg-[--status-success-bg] text-[--status-success-fg]",
};

const priorityClasses: Record<string, string> = {
  HIGH: "border-[--status-danger-border] bg-[--status-danger-bg] text-[--status-danger-fg]",
  MEDIUM:
    "border-[--status-warn-border] bg-[--status-warn-bg] text-[--status-warn-fg]",
  LOW: "border-[--status-neutral-border] bg-[--status-neutral-bg] text-[--status-neutral-fg]",
};

export function Badge({ value, tone }: MessageBadgeProps) {
  const classes =
    tone === "status" ? statusClasses[value] : priorityClasses[value];
  return (
    <span
      className={cn(
        "inline-flex h-5 shrink-0 items-center rounded-[--radius-sm] border px-1.5 font-mono text-[10px] font-medium leading-none",
        classes ??
          "border-[--status-neutral-border] bg-[--status-neutral-bg] text-[--status-neutral-fg]",
      )}
    >
      {value.replace("_", " ")}
    </span>
  );
}
