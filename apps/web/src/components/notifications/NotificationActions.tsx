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
      <div className="flex translate-y-0 items-center gap-1.5 pr-2 opacity-100 transition-[opacity,transform] duration-150 max-[720px]:col-start-2 max-[720px]:flex-wrap max-[720px]:justify-start max-[720px]:pt-0.5 max-[720px]:pr-0">
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
        "flex translate-y-0.5 items-center gap-1.5 pr-2 opacity-0 transition-[opacity,transform] duration-150 group-hover:translate-y-0 group-hover:opacity-100 max-[720px]:col-start-2 max-[720px]:translate-y-0 max-[720px]:flex-wrap max-[720px]:justify-start max-[720px]:pt-0.5 max-[720px]:pr-0 max-[720px]:opacity-100",
        (visible || alwaysVisible) && "translate-y-0 opacity-100",
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
        <div className="relative">
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
