import { Clock } from "lucide-react";
import type { SnoozeMenuProps } from "../../types/notifications";
import { snoozeOptions } from "../../lib/notificationsComponent";

export function SnoozeMenu({ onSelect }: SnoozeMenuProps) {
  return (
    <div
      className="absolute right-0 top-[calc(100%+6px)] z-40 w-44 rounded-xl border border-[oklch(0.93_0.006_264)] bg-white p-[5px] shadow-[0px_1px_4px_0px_hsl(0_0%_0%_/_0.05)]"
      role="menu"
    >
      {snoozeOptions.map((option) => (
        <button
          key={option.label}
          type="button"
          role="menuitem"
          className="flex w-full cursor-pointer items-center gap-2 rounded-lg border-0 bg-transparent px-2 py-[7px] text-xs text-[oklch(0.18_0_0)] hover:bg-[oklch(0.967_0.003_264)]"
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
