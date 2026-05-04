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
    <div className="notifications-empty">
      <Inbox className="size-10" />
      <h2>{copy.heading}</h2>
      <p>{copy.text}</p>
      {hasFilters ? (
        <button type="button" onClick={onClear}>
          Clear filters
        </button>
      ) : null}
    </div>
  );
}
