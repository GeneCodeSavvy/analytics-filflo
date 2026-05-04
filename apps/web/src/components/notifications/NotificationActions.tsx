import { useState } from "react";
import { CheckCircle, Clock, Eye, MessageSquare, X } from "lucide-react";
import type { NotificationActionsProps } from "../../types/notifications";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { SnoozeMenu } from "./SnoozeMenu";

export function NotificationActions({
  row,
  visible,
  onOpen,
  onDone,
  onSnooze,
  onInvite,
}: NotificationActionsProps) {
  const [snoozeOpen, setSnoozeOpen] = useState(false);
  const alwaysVisible = row.type === "TICKET_INVITATION";

  if (row.type === "TICKET_INVITATION") {
    return (
      <div className="notifications-actions notifications-actions-visible">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={(event) => {
            event.stopPropagation();
            onInvite("ACCEPTED");
          }}
        >
          <CheckCircle /> Accept
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={(event) => {
            event.stopPropagation();
            onInvite("CANCELLED");
          }}
        >
          <X /> Decline
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "notifications-actions",
        (visible || alwaysVisible) && "notifications-actions-visible",
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={(event) => {
          event.stopPropagation();
          onOpen();
        }}
      >
        {row.type === "REVIEW_REQUESTED" ? <Eye /> : <MessageSquare />}
        {row.type === "REVIEW_REQUESTED"
          ? "Review"
          : row.type === "MESSAGE_ACTIVITY"
            ? "Open thread"
            : "Open"}
      </Button>
      {row.type === "REVIEW_REQUESTED" ? (
        <div className="notifications-snooze-wrap">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(event) => {
              event.stopPropagation();
              setSnoozeOpen((value) => !value);
            }}
          >
            <Clock /> Snooze
          </Button>
          {snoozeOpen ? (
            <SnoozeMenu
              onSelect={(date, label) => {
                setSnoozeOpen(false);
                onSnooze(date, label);
              }}
            />
          ) : null}
        </div>
      ) : null}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={(event) => {
          event.stopPropagation();
          onDone();
        }}
      >
        <CheckCircle /> Done
      </Button>
    </div>
  );
}
