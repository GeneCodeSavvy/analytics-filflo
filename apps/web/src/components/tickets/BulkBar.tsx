import type { TicketPriority, TicketStatus } from "../../types/tickets";
import { ticketBulkBar } from "./styles";

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
    <div className={ticketBulkBar}>
      <span className="font-mono text-[13px]">{selectedCount} selected</span>
      <div className="ml-auto flex items-center gap-1">
        {role !== "USER" && (
          <button
            type="button"
            className="h-7 rounded-sm px-2 text-[12px] text-foreground hover:bg-muted"
          >
            Assign
          </button>
        )}
        <button
          type="button"
          className="h-7 rounded-sm px-2 text-[12px] text-foreground hover:bg-muted"
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
          className="h-7 rounded-sm px-2 text-[12px] text-foreground hover:bg-muted"
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
          className="h-7 rounded-sm px-2 text-[12px] text-foreground hover:bg-muted"
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
        <button
          type="button"
          onClick={clearSelection}
          className="h-7 rounded-sm px-2 text-[12px] text-foreground hover:bg-muted"
        >
          Clear selection
        </button>
      </div>
    </div>
  );
}
