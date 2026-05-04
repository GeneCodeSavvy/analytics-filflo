import type { MemberRow } from "../../types/teams";
import { relativeTime } from "../../lib/teamsComponent";
import { useTeamsStore } from "../../stores/useTeamsStore";
import { Avatar } from "./Avatar";
import { RolePill } from "./RolePill";

export function UserGrid({ rows }: { rows: MemberRow[] }) {
  const openMemberDetail = useTeamsStore((state) => state.openMemberDetail);
  return (
    <div className="grid grid-cols-3 gap-3">
      {rows.map((member) => (
        <button
          className="flex min-h-[168px] flex-col items-center justify-center gap-[9px] border border-[#E8E6E1] rounded-lg bg-white p-4 text-[#1A1917] transition-[transform,box-shadow] duration-150 ease-[ease] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(26,25,23,0.09)]"
          key={`${member.orgId}-${member.id}`}
          onClick={() => openMemberDetail(member.id, member.orgId)}
          type="button"
        >
          <Avatar member={member} size={48} />
          <strong>{member.name}</strong>
          <RolePill role={member.role} />
          <span className="text-[#A8A49C] text-xs">Last seen {relativeTime(member.lastActiveAt)}</span>
        </button>
      ))}
      {!rows.length ? (
        <div className="flex min-h-[120px] flex-col items-center justify-center gap-1.5 text-[#78756E] text-center col-span-full bg-white border border-[#E8E6E1] rounded-lg">
          No teammates to show yet.
        </div>
      ) : null}
    </div>
  );
}
