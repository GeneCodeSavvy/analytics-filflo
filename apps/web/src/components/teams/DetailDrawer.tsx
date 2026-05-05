import { X } from "lucide-react";
import { formatMonth } from "../../lib/teamsComponent";
import { useTeamsStore } from "../../stores/useTeamsStore";
import { useTeamMemberQuery } from "../../hooks/useTeamsQueries";
import { Avatar } from "./Avatar";
import { RolePill } from "./RolePill";
import { useAuthState } from "@/stores/useAuthStore";

export function DetailDrawer() {
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
      className="fixed inset-0 z-[--z-drawer] bg-black/40"
      onMouseDown={closeMemberDetail}
    >
      <aside
        className="absolute right-0 top-0 w-[min(560px,calc(100%-382px))] min-w-[360px] h-full overflow-auto bg-white bg-[--surface-card] border-l border-[--border-default] p-6 shadow-[0_8px_40px_rgba(0,0,0,0.18),0_2px_12px_rgba(0,0,0,0.12)] animate-[teams-drawer-in_220ms_ease-out_forwards] font-mono text-[13px] text-[--ink-1]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          className="absolute right-4 top-4 inline-flex items-center justify-center w-[30px] h-[30px] border border-transparent rounded-[--radius-sm] bg-transparent text-[--ink-3] hover:bg-[--surface-sunken]"
          onClick={closeMemberDetail}
          type="button"
        >
          <X size={16} />
        </button>
        {member ? (
          <>
            <div className="grid justify-items-start gap-2 mb-6 pr-10">
              <Avatar member={member} size={64} />
              <h2 className="mt-1 mb-0 text-[20px] font-semibold text-[--ink-1]">
                {member.name}
              </h2>
              <p className="m-0 text-[--ink-3]">{member.email}</p>
              <RolePill role={member.role} />
              <span className="text-[--ink-3]">
                Member since {formatMonth(member.joinedAt)}
              </span>
            </div>
            {actorRole === "SUPER_ADMIN" || actorRole === "ADMIN" ? (
              <section className="border-t border-[--border-subtle] pt-[18px] mt-[18px]">
                <h3 className="m-0 mb-2.5 text-[16px] font-semibold text-[--ink-1]">
                  Organization
                </h3>
                <div className="grid gap-2">
                  <div className="flex items-center justify-between border border-[--border-default] rounded-[--radius-md] p-[10px]">
                    <span className="text-[--ink-1]">{member.org.name}</span>
                    <RolePill role={member.role} />
                  </div>
                </div>
              </section>
            ) : null}
            <section className="border-t border-[--border-subtle] pt-[18px] mt-[18px]">
              <h3 className="m-0 mb-2.5 text-[16px] font-semibold text-[--ink-1]">
                Activity
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="border border-[--border-default] rounded-[--radius-md] p-3">
                  <span className="block text-[--ink-3] text-[11px] font-medium tracking-[0.04em] uppercase">
                    Tickets Requested
                  </span>
                  <strong className="block mt-[5px] text-[18px] font-normal text-[--ink-1]">
                    {member.stats.ticketsRequested}
                  </strong>
                </div>
                <div className="border border-[--border-default] rounded-[--radius-md] p-3">
                  <span className="block text-[--ink-3] text-[11px] font-medium tracking-[0.04em] uppercase">
                    Tickets Resolved
                  </span>
                  <strong className="block mt-[5px] text-[18px] font-normal text-[--ink-1]">
                    {member.stats.ticketsAssigned}
                  </strong>
                </div>
                <div className="border border-[--border-default] rounded-[--radius-md] p-3">
                  <span className="block text-[--ink-3] text-[11px] font-medium tracking-[0.04em] uppercase">
                    Avg Response Time
                  </span>
                  <strong className="block mt-[5px] text-[18px] font-normal text-[--ink-1]">
                    {member.stats.avgResolutionMs
                      ? `${(member.stats.avgResolutionMs / 3_600_000).toFixed(1)}h`
                      : "n/a"}
                  </strong>
                </div>
              </div>
            </section>
          </>
        ) : (
          <div className="flex min-h-[120px] flex-col items-center justify-center gap-[6px] text-[--ink-3] text-center">
            Member details will appear when the backend returns this record.
          </div>
        )}
      </aside>
    </div>
  );
}
