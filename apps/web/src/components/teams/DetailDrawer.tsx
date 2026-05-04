import { X } from "lucide-react";
import type { OrgSummary } from "../../types/teams";
import {
  formatMonth,
  orgNameFor,
  relativeTime,
} from "../../lib/teamsComponent";
import { useTeamsStore } from "../../stores/useTeamsStore";
import { useTeamMemberQuery } from "../../hooks/useTeamsQueries";
import { Avatar } from "./Avatar";
import { RolePill } from "./RolePill";
import { useAuthState } from "@/stores/useAuthStore";

export function DetailDrawer({ orgs }: { orgs: OrgSummary[] }) {
  const actorRole = useAuthState((state) => state.user?.role);
  if (!actorRole) throw new Error("Authentication not complete");
  const {
    detailOpen,
    selectedMemberId,
    selectedMemberOrgId,
    closeMemberDetail,
  } = useTeamsStore();
  const detailQuery = useTeamMemberQuery(
    selectedMemberId,
    selectedMemberOrgId ?? undefined,
  );
  const member = detailQuery.data;
  if (!detailOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-[rgba(26,25,23,0.22)] backdrop-blur-[4px]"
      onMouseDown={closeMemberDetail}
    >
      <aside
        className="absolute right-0 top-0 w-[min(400px,100vw)] h-full overflow-auto bg-white border-l border-[#E8E6E1] p-6 shadow-[-18px_0_40px_rgba(26,25,23,0.14)] animate-[teams-drawer-in_250ms_ease-out]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          className="absolute right-4 top-4 inline-flex items-center justify-center w-[30px] h-[30px] border border-[#E8E6E1] rounded-[6px] bg-white text-[#78756E]"
          onClick={closeMemberDetail}
          type="button"
        >
          <X size={16} />
        </button>
        {member ? (
          <>
            <div className="grid justify-items-start gap-2 mb-6">
              <Avatar member={member} size={64} />
              <h2 className="mt-1 mb-0">{member.name}</h2>
              <p className="m-0 text-[#78756E]">{member.email}</p>
              <RolePill role={member.role} />
              <span>Member since {formatMonth(member.joinedAt)}</span>
            </div>
            <section className="border-t border-[#E8E6E1] pt-[18px] mt-[18px]">
              <h3 className="m-0 mb-2.5 text-[13px]">Activity</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="border border-[#E8E6E1] rounded-lg p-3">
                  <span className="block text-[#A8A49C] text-[11px]">
                    Tickets Requested
                  </span>
                  <strong className="block mt-[5px] text-[18px]">
                    {member.stats.ticketsRequested}
                  </strong>
                </div>
                <div className="border border-[#E8E6E1] rounded-lg p-3">
                  <span className="block text-[#A8A49C] text-[11px]">
                    Tickets Resolved
                  </span>
                  <strong className="block mt-[5px] text-[18px]">
                    {member.stats.ticketsAssigned}
                  </strong>
                </div>
                <div className="border border-[#E8E6E1] rounded-lg p-3">
                  <span className="block text-[#A8A49C] text-[11px]">
                    Avg Response Time
                  </span>
                  <strong className="block mt-[5px] text-[18px]">
                    {member.stats.avgResolutionMs
                      ? `${(member.stats.avgResolutionMs / 3_600_000).toFixed(1)}h`
                      : "n/a"}
                  </strong>
                </div>
                <div className="border border-[#E8E6E1] rounded-lg p-3">
                  <span className="block text-[#A8A49C] text-[11px]">
                    Last Active
                  </span>
                  <strong className="block mt-[5px] text-[18px]">
                    {relativeTime(member.lastActiveAt)}
                  </strong>
                </div>
              </div>
            </section>
            {actorRole === "SUPER_ADMIN" ? (
              <section className="border-t border-[#E8E6E1] pt-[18px] mt-[18px]">
                <h3 className="m-0 mb-2.5 text-[13px]">Organizations</h3>
                <div className="grid gap-2">
                  <div className="flex items-center justify-between border border-[#E8E6E1] rounded-lg p-[10px]">
                    <span>{member.org.name}</span>
                    <RolePill role={member.role} />
                  </div>
                </div>
              </section>
            ) : null}
            <section className="border-t border-[#E8E6E1] pt-[18px] mt-[18px]">
              <h3 className="m-0 mb-2.5 text-[13px]">Actions</h3>
              <button
                className="inline-flex items-center justify-center gap-[7px] rounded-[6px] border border-[#E8E6E1] px-3 py-[9px] bg-white text-[#1A1917]"
                type="button"
              >
                Change role
              </button>
              <button
                className="bg-transparent text-[#B83A2A] border border-transparent"
                type="button"
              >
                Remove from org
              </button>
            </section>
          </>
        ) : (
          <div className="flex min-h-[120px] flex-col items-center justify-center gap-[6px] text-[#78756E] text-center">
            Member details will appear when the backend returns this record.
          </div>
        )}
        <span className="block mt-3 text-[#A8A49C]">
          {selectedMemberOrgId ? orgNameFor(selectedMemberOrgId, orgs) : ""}
        </span>
      </aside>
    </div>
  );
}
