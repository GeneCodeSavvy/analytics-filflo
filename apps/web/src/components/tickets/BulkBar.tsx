import type { TicketPriority, TicketStatus } from "../../types/tickets";

type BulkBarProps = {
  clearSelection: () => void;
  mutate: (payload: {
    ids: string[];
    status?: TicketStatus;
    priority?: TicketPriority;
  }) => void;
  role: string;
  selectedCount: number;
  selectedRowIds: string[];
};

export function BulkBar({
  clearSelection,
  mutate,
  role,
  selectedCount,
  selectedRowIds,
}: BulkBarProps) {
  return (
    <div className="tickets-bulk-bar">
      <span className="font-mono text-[13px]">{selectedCount} selected</span>
      <div className="ml-auto flex items-center gap-1">
        {role !== "USER" && <button type="button">Assign</button>}
        <button
          type="button"
          onClick={() =>
            mutate({
              ids: selectedRowIds,
              status: "REVIEW",
            })
          }
        >
          Status
        </button>
        <button
          type="button"
          onClick={() =>
            mutate({
              ids: selectedRowIds,
              priority: "HIGH",
            })
          }
        >
          Priority
        </button>
        <button
          type="button"
          onClick={() =>
            mutate({
              ids: selectedRowIds,
              status: "CLOSED" as TicketStatus,
            })
          }
        >
          Close ticket
        </button>
        <span className="h-5 w-px bg-border" />
        <button type="button" onClick={clearSelection}>
          Clear selection
        </button>
      </div>
    </div>
  );
}
