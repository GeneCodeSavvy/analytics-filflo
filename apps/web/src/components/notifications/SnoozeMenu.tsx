import { Clock } from "lucide-react";
import type { SnoozeMenuProps } from "../../types/notifications";
import { snoozeOptions } from "../../lib/notificationsComponent";

export function SnoozeMenu({ onSelect }: SnoozeMenuProps) {
  return (
    <div className="notifications-popover" role="menu">
      {snoozeOptions.map((option) => (
        <button
          key={option.label}
          type="button"
          role="menuitem"
          onClick={(event) => {
            event.stopPropagation();
            onSelect(option.getDate(), option.label);
          }}
        >
          <Clock className="size-3.5" />
          {option.label}
        </button>
      ))}
    </div>
  );
}
