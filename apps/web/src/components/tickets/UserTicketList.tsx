import type { TicketRow } from "../../types/tickets";
import { displayId, relativeTime } from "../../lib/ticketsComponent";
import { StatusPill } from "./StatusPill";

type UserTicketListProps = {
  rows: TicketRow[];
  onOpen: (id: string) => void;
};

export function UserTicketList({ rows, onOpen }: UserTicketListProps) {
  return (
    <div className="flex flex-1 justify-center overflow-auto border-t border-border bg-background px-4 py-6">
      <div className="flex w-full max-w-[480px] flex-col gap-2">
        {rows.map((row) => (
          <button
            key={row.id}
            type="button"
            onClick={() => onOpen(row.id)}
            className="h-24 rounded-sm border border-border bg-background p-3 text-left hover:bg-muted/40"
          >
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="font-mono text-[12px] text-muted-foreground">
                {displayId(row.id)}
              </span>
              <StatusPill status={row.status} />
            </div>
            <div className="truncate text-[16px] font-medium text-foreground">
              {row.subject}
            </div>
            <div className="mt-2 font-mono text-[12px] text-muted-foreground">
              {relativeTime(row.updatedAt)}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
