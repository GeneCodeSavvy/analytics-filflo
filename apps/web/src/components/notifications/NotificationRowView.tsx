import { ChevronDown } from "lucide-react";
import type { NotificationRowViewProps } from "../../types/notifications";
import { relativeTime, rowSummary } from "../../lib/notificationsComponent";
import { cn } from "../../lib/utils";
import { NotificationActions } from "./NotificationActions";
import { ThreadEvents } from "./ThreadEvents";

const rowBase =
  "group relative cursor-pointer overflow-hidden border border-transparent border-b-[--border-subtle] border-l-[4px] bg-[--surface-card] transition-[background,border-color,opacity,transform,max-height] duration-[150ms,150ms,250ms,250ms,250ms] ease-in-out last:border-b-transparent hover:bg-[--surface-sunken]";
const rowFocus =
  "border-l-[--action-bg] bg-[--action-tint-bg] outline outline-1 outline-[--action-bg]";

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
  onStateChange,
}: NotificationRowViewProps) {
  const isAction = row.tier === "action_required";
  const isStatus = row.tier === "status_update";

  return (
    <div
      tabIndex={0}
      className={cn(
        rowBase,
        isAction && "border-l-[--action-bg]",
        isStatus && "border-l-[--status-info-fg]",
        focused && rowFocus,
        selected && "bg-[--action-tint-bg]",
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
      <div className="grid min-h-[78px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-3 py-3 max-[720px]:grid-cols-[auto_minmax(0,1fr)] max-[720px]:items-start">
        <div className="flex items-center">
          <input
            type="checkbox"
            aria-label={
              selected ? "Deselect notification" : "Select notification"
            }
            checked={selected}
            className={cn(
              "size-4 cursor-pointer accent-[--action-bg] opacity-0 transition-opacity duration-150 group-hover:opacity-100 max-[720px]:opacity-100",
              focused && "opacity-100",
              selected && "opacity-100",
            )}
            onChange={onToggleSelect}
            onClick={(event) => event.stopPropagation()}
          />
        </div>

        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-[7px]">
            {row.eventCount > 1 ? (
              <button
                type="button"
                className="inline-grid size-[18px] place-items-center rounded-[--radius-sm] border-0 bg-transparent p-0 text-[--ink-3]"
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
            <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-[0.8125rem] font-semibold text-[--ink-1]">
              {rowSummary(row)}
            </span>
            {row.eventCount > 1 ? (
              <span className="rounded-[--radius-pill] border border-[--status-info-border] bg-[--status-info-bg] px-1.5 text-[0.625rem]/[1.4] text-[--status-info-fg]">
                {row.eventCount} updates
              </span>
            ) : null}
          </div>
          <p className="mt-1 mb-0 overflow-hidden text-ellipsis whitespace-nowrap text-xs/[1.45] text-[--ink-2]">
            {row.ticket?.subject ?? row.latestEvent.description}
          </p>
          <p className="mt-0.5 mb-0 text-[0.625rem]/[1.4] text-[--ink-3]">
            {relativeTime(row.latestEvent.at)}
          </p>
        </div>

        <NotificationActions
          row={row}
          visible={focused}
          onOpen={onOpen}
          onStateChange={onStateChange}
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
