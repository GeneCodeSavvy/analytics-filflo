import { Inbox, MailOpen, MessageSquare } from "lucide-react";
import type { NotificationActionsProps } from "../../types/notifications";
import type { NotificationState } from "../../types/notifications";
import { notificationStateActions } from "../../lib/notificationsComponent";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { notificationSecondaryButton } from "./styles";

const stateIcons = {
  inbox: Inbox,
  read: MailOpen,
} satisfies Record<NotificationState, typeof Inbox>;

export function NotificationActions({
  row,
  visible,
  onOpen,
  onStateChange,
}: NotificationActionsProps) {
  const actions = notificationStateActions(row.state);

  return (
    <div
      className={cn(
        "flex translate-y-0.5 items-center gap-1.5 pr-2 opacity-0 transition-[opacity,transform] duration-150 group-hover:translate-y-0 group-hover:opacity-100 max-[720px]:col-start-2 max-[720px]:translate-y-0 max-[720px]:flex-wrap max-[720px]:justify-start max-[720px]:pt-0.5 max-[720px]:pr-0 max-[720px]:opacity-100",
        visible && "translate-y-0 opacity-100",
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={notificationSecondaryButton}
        onClick={(event) => {
          event.stopPropagation();
          onOpen();
        }}
      >
        <MessageSquare /> Open
      </Button>
      {actions.map((action) => {
        const Icon = stateIcons[action.state];
        return (
          <Button
            key={action.state}
            type="button"
            variant="ghost"
            size="sm"
            className={notificationSecondaryButton}
            onClick={(event) => {
              event.stopPropagation();
              onStateChange(action.state);
            }}
          >
            <Icon /> {action.label}
          </Button>
        );
      })}
    </div>
  );
}
