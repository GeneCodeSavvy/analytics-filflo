import { CheckCircle, ChevronDown } from "lucide-react";
import type { NotificationRowViewProps } from "../../types/notifications";
import {
  notificationIcon,
  relativeTime,
  rowSummary,
} from "../../lib/notificationsComponent";
import { cn } from "../../lib/utils";
import { NotificationActions } from "./NotificationActions";
import { ThreadEvents } from "./ThreadEvents";

export function NotificationRowView({
  row,
  focused,
  selected,
  expanded,
  dismissing,
  onFocus,
  onToggleSelect,
  onToggleExpand,
  onOpen,
  onDone,
  onSnooze,
  onInvite,
}: NotificationRowViewProps) {
  const Icon = notificationIcon(row.type);
  const isAction = row.tier === "action_required";
  const isStatus = row.tier === "status_update";

  return (
    <div
      tabIndex={0}
      className={cn(
        "group relative cursor-pointer overflow-hidden rounded-none border border-transparent border-b-[oklch(0.93_0.006_264)] border-l-[3px] bg-white transition-[background,border-color,opacity,transform,max-height] duration-[150ms,150ms,250ms,250ms,250ms] ease-in-out hover:bg-[oklch(0.967_0.003_264)]",
        isAction && "border-l-[oklch(0.67_0.14_48.5)]",
        isStatus && "border-l-[oklch(0.59_0.04_196)]",
        focused &&
          "border-l-[oklch(0.67_0.14_48.5)] bg-[oklch(0.967_0.003_264)] outline outline-1 outline-[oklch(0.93_0.006_264)]",
        selected && "bg-[oklch(0.967_0.003_264)]",
        dismissing && "max-h-0 -translate-x-5 opacity-0",
      )}
      onFocus={onFocus}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          onOpen();
        }
      }}
    >
      <div className="grid min-h-[76px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2.5 py-2.5 pl-[9px] max-[720px]:grid-cols-[auto_minmax(0,1fr)] max-[720px]:items-start">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label={
              selected ? "Deselect notification" : "Select notification"
            }
            className={cn(
              "grid size-[18px] scale-100 place-items-center rounded-md border border-[oklch(0.82_0.006_264)] bg-white text-[oklch(0.67_0.14_48.5)] opacity-0 transition-[opacity,transform,background] duration-150 group-hover:opacity-100 max-[720px]:opacity-100",
              focused && "opacity-100",
              selected && "animate-[pulse_150ms_ease-out_1] opacity-100",
            )}
            onClick={(event) => {
              event.stopPropagation();
              onToggleSelect();
            }}
          >
            {selected ? <CheckCircle className="size-3.5" /> : null}
          </button>
          <Icon className="size-4 text-[oklch(0.42_0.01_264)]" />
        </div>

        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-[7px]">
            {row.eventCount > 1 ? (
              <button
                type="button"
                className="inline-grid size-[18px] place-items-center rounded-md border-0 bg-transparent p-0 text-[oklch(0.55_0.023_264)]"
                aria-label={
                  expanded
                    ? "Collapse notification group"
                    : "Expand notification group"
                }
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleExpand();
                }}
              >
                <ChevronDown
                  className={cn(
                    "size-3.5 transition-transform duration-200",
                    expanded && "rotate-180",
                  )}
                />
              </button>
            ) : null}
            <span className="rounded-md border border-[oklch(0.93_0.006_264)] bg-[oklch(0.985_0.002_264)] px-[5px] py-px font-mono text-[0.6875rem]/[1.45] text-[oklch(0.38_0.01_264)]">
              #{row.ticket?.id ?? "ticket"}
            </span>
            <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-[0.8125rem] text-[oklch(0.18_0_0)]">
              {rowSummary(row)}
            </span>
            {row.eventCount > 1 ? (
              <span className="rounded-xl border border-[oklch(0.93_0.006_264)] px-1.5 text-[0.625rem]/[1.4] text-[oklch(0.55_0.023_264)]">
                {row.eventCount} updates
              </span>
            ) : null}
          </div>
          <p className="mt-[3px] mb-0 overflow-hidden text-ellipsis whitespace-nowrap text-xs/[1.45] text-[oklch(0.55_0.023_264)]">
            {row.ticket?.subject ?? row.latestEvent.description}
          </p>
          <p className="mt-0.5 mb-0 text-[0.625rem]/[1.4] text-[oklch(0.55_0.023_264)]">
            {relativeTime(row.latestEvent.at)}
          </p>
        </div>

        <NotificationActions
          row={row}
          visible={focused}
          onOpen={onOpen}
          onDone={onDone}
          onSnooze={onSnooze}
          onInvite={onInvite}
        />
      </div>
      <div
        className={cn(
          "grid grid-rows-[0fr] opacity-0 transition-[grid-template-rows,opacity] duration-200 ease-out",
          expanded && "grid-rows-[1fr] opacity-100",
        )}
      >
        {expanded ? <ThreadEvents row={row} /> : null}
      </div>
    </div>
  );
}
