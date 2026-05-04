import { Clock } from "lucide-react";
import type { SnoozeMenuProps } from "../../types/notifications";
import { snoozeOptions } from "../../lib/notificationsComponent";

export function SnoozeMenu({ onSelect }: SnoozeMenuProps) {
  return (
    <div
      className="absolute right-0 top-[calc(100%+6px)] z-40 w-44 rounded-[--radius-md] border border-[--border-default] bg-[--surface-card] p-[5px] shadow-[--elev-2]"
      role="menu"
    >
      {snoozeOptions.map((option) => (
        <button
          key={option.label}
          type="button"
          role="menuitem"
          className="flex w-full cursor-pointer items-center gap-2 rounded-[--radius-sm] border-0 bg-transparent px-2 py-[7px] text-xs text-[--ink-1] hover:bg-[--surface-sunken]"
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
