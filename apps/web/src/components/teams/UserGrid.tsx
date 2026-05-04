import type { TeamMemberListItem } from "../../types/teams";
import { useTeamsStore } from "../../stores/useTeamsStore";
import { Avatar } from "./Avatar";
import { RolePill } from "./RolePill";

export function UserGrid({ rows }: { rows: TeamMemberListItem[] }) {
  const openMemberDetail = useTeamsStore((state) => state.openMemberDetail);
  return (
    <div className="grid grid-cols-3 gap-3">
      {rows.map((member) => (
        <button
          className="flex min-h-[168px] flex-col items-center justify-center gap-[9px] border border-[--border-default] rounded-[--radius-md] bg-[--surface-card] p-4 text-[--ink-1] transition-[transform,box-shadow] duration-150 ease-out hover:-translate-y-0.5 hover:shadow-[--elev-2]"
          key={`${member.org.id}-${member.id}`}
          onClick={() => openMemberDetail(member.id, member.org.id)}
          type="button"
        >
          <Avatar member={member} size={48} />
          <strong className="font-semibold text-[15px]">{member.name}</strong>
          <RolePill role={member.role} />
        </button>
      ))}
      {!rows.length ? (
        <div className="flex min-h-[120px] flex-col items-center justify-center gap-1.5 text-[--ink-3] text-center col-span-full bg-[--surface-card] border border-[--border-default] rounded-[--radius-md]">
          No teammates to show yet.
        </div>
      ) : null}
    </div>
  );
}
