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
        "notifications-row",
        isAction && "notifications-row-action",
        isStatus && "notifications-row-status",
        focused && "notifications-row-focused",
        selected && "notifications-row-selected",
        dismissing && "notifications-row-dismissing",
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
      <div className="notifications-row-inner">
        <div className="notifications-row-left">
          <button
            type="button"
            aria-label={
              selected ? "Deselect notification" : "Select notification"
            }
            className={cn(
              "notifications-check",
              selected && "notifications-check-on",
            )}
            onClick={(event) => {
              event.stopPropagation();
              onToggleSelect();
            }}
          >
            {selected ? <CheckCircle className="size-3.5" /> : null}
          </button>
          <Icon className="notifications-type-icon" />
        </div>

        <div className="notifications-main">
          <div className="notifications-line">
            {row.eventCount > 1 ? (
              <button
                type="button"
                className="notifications-expand"
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
                  className={cn("size-3.5", expanded && "rotate-180")}
                />
              </button>
            ) : null}
            <span className="notifications-ticket">
              #{row.ticket?.id ?? "ticket"}
            </span>
            <span className="notifications-summary">{rowSummary(row)}</span>
            {row.eventCount > 1 ? (
              <span className="notifications-count">
                {row.eventCount} updates
              </span>
            ) : null}
          </div>
          <p className="notifications-title">
            {row.ticket?.subject ?? row.latestEvent.description}
          </p>
          <p className="notifications-time">
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
          "notifications-thread-shell",
          expanded && "notifications-thread-open",
        )}
      >
        {expanded ? <ThreadEvents row={row} /> : null}
      </div>
    </div>
  );
}
