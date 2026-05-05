import { Inbox } from "lucide-react";
import type { EmptyStateProps } from "../../types/notifications";
import { emptyStateCopy } from "../../lib/notificationsComponent";
import { notificationPanel } from "./styles";

export function EmptyState({
  activeTab,
  hasFilters,
  onClear,
}: EmptyStateProps) {
  const copy = emptyStateCopy(activeTab, hasFilters);

  return (
    <div className="grid min-h-[280px] place-items-center text-center text-[--ink-3]">
      <div className={`${notificationPanel} max-w-sm px-6 py-8`}>
        <div className="mx-auto grid size-12 place-items-center rounded-[--radius-lg] border border-[--border-default] bg-[--surface-sunken]">
          <Inbox className="size-6 text-[--ink-2]" />
        </div>
        <h2 className="mt-3 mb-1 text-[16px] font-semibold text-[--ink-1]">
          {copy.heading}
        </h2>
        <p className="m-0 text-[13px] text-[--ink-3]">{copy.text}</p>
        {hasFilters ? (
          <button
            type="button"
            className="mt-4 cursor-pointer rounded-[--radius-pill] border border-[--action-bg] bg-[--action-tint-bg] px-3 py-1.5 text-xs font-medium text-[--action-tint-fg]"
            onClick={onClear}
          >
            Clear filters
          </button>
        ) : null}
      </div>
    </div>
  );
}
