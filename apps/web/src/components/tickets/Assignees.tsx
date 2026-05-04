import type { TicketRow } from "../../types/tickets";
import { uniqueAssignees } from "../../lib/ticketsComponent";
import { Avatar } from "./Avatar";

type AssigneesProps = {
  row: TicketRow;
};

export function Assignees({ row }: AssigneesProps) {
  const assignees = uniqueAssignees(row);
  const visible = assignees.slice(0, 3);
  const hidden = Math.max(row.assigneeCount - visible.length, 0);

  return (
    <div className="group/assignees relative flex h-6 items-center">
      {visible.length === 0 ? (
        <span className="text-[12px] text-muted-foreground">None</span>
      ) : (
        visible.map((user, index) => (
          <Avatar
            key={user.id}
            user={user}
            className={index > 0 ? "-ml-2" : ""}
          />
        ))
      )}
      {hidden > 0 && <span className="tickets-plus-chip">+{hidden}</span>}
      {assignees.length > 0 && (
        <div className="tickets-popover pointer-events-none absolute right-0 top-7 z-30 min-w-44 opacity-0 group-hover/assignees:opacity-100">
          {assignees.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-2 whitespace-nowrap px-2 py-1.5 text-[12px]"
            >
              <Avatar user={user} />
              <span>{user.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
