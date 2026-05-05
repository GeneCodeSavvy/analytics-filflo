import type { TicketPriority, TicketStatus } from "../../types/tickets";
import type { BulkUpdatePayload } from "../../api/ticketApi";
import { ticketBulkBar } from "./styles";

type AdminOption = { id: string; name: string };

type BulkBarProps = {
  clearSelection: () => void;
  mutate: (payload: BulkUpdatePayload) => void;
  selectedCount: number;
  selectedRowIds: string[];
  isSuperAdmin?: boolean;
  admins?: AdminOption[];
};

export function BulkBar({
  clearSelection,
  mutate,
  selectedCount,
  selectedRowIds,
  isSuperAdmin,
  admins = [],
}: BulkBarProps) {
  return (
    <div className={ticketBulkBar}>
      <span className="font-mono text-[13px]">{selectedCount} selected</span>
      <div className="ml-auto flex items-center gap-1">
        <label className="sr-only" htmlFor="bulk-status">
          Bulk Status
        </label>
        <select
          id="bulk-status"
          className="h-7 rounded-sm border border-border bg-background px-2 text-[12px] text-foreground hover:bg-muted"
          defaultValue=""
          onChange={(event) => {
            const status = event.target.value as TicketStatus | "";
            if (!status) return;
            mutate({ ids: selectedRowIds, status });
            event.target.value = "";
          }}
        >
          <option value="">Set Status</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="ON_HOLD">On Hold</option>
          <option value="REVIEW">Review</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
        </select>
        <label className="sr-only" htmlFor="bulk-priority">
          Bulk Priority
        </label>
        <select
          id="bulk-priority"
          className="h-7 rounded-sm border border-border bg-background px-2 text-[12px] text-foreground hover:bg-muted"
          defaultValue=""
          onChange={(event) => {
            const priority = event.target.value as TicketPriority | "";
            if (!priority) return;
            mutate({ ids: selectedRowIds, priority });
            event.target.value = "";
          }}
        >
          <option value="">Set Priority</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
        {isSuperAdmin && admins.length > 0 && (
          <>
            <span className="h-5 w-px bg-border" />
            <label className="sr-only" htmlFor="bulk-assign">
              Bulk Assign
            </label>
            <select
              id="bulk-assign"
              className="h-7 rounded-sm border border-border bg-background px-2 text-[12px] text-foreground hover:bg-muted"
              defaultValue=""
              onChange={(event) => {
                const assigneeId = event.target.value;
                if (!assigneeId) return;
                mutate({ ids: selectedRowIds, action: "assign", assigneeIds: [assigneeId] });
                event.target.value = "";
              }}
            >
              <option value="">Assign to…</option>
              {admins.map((admin) => (
                <option key={admin.id} value={admin.id}>
                  {admin.name}
                </option>
              ))}
            </select>
          </>
        )}
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
