import { Inbox } from "lucide-react";
import type { EmptyStateProps } from "../../types/notifications";
import { emptyStateCopy } from "../../lib/notificationsComponent";

export function EmptyState({
  activeTab,
  hasFilters,
  onClear,
}: EmptyStateProps) {
  const copy = emptyStateCopy(activeTab, hasFilters);

  return (
    <div className="grid min-h-[280px] place-items-center text-center text-[oklch(0.55_0.023_264)]">
      <Inbox className="size-10" />
      <h2 className="mt-3 mb-1 text-base text-[oklch(0.18_0_0)]">
        {copy.heading}
      </h2>
      <p className="m-0 text-[0.8125rem]">{copy.text}</p>
      {hasFilters ? (
        <button
          type="button"
          className="mt-3 cursor-pointer border-0 bg-transparent text-xs text-[oklch(0.67_0.14_48.5)]"
          onClick={onClear}
        >
          Clear filters
        </button>
      ) : null}
    </div>
  );
}
