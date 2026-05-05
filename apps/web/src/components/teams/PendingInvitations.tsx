import { Link, RefreshCw } from "lucide-react";
import type { Invitation } from "../../types/teams";
import { formatDate, isInvitationExpired } from "../../lib/teamsComponent";
import {
  useCancelTeamInvitationMutation,
  useResendTeamInvitationMutation,
} from "../../hooks/useTeamsMutations";
import { RolePill } from "./RolePill";

export function PendingInvitations({
  invitations,
  showActions,
}: {
  invitations: Invitation[];
  showActions: boolean;
}) {
  const resend = useResendTeamInvitationMutation();
  const cancel = useCancelTeamInvitationMutation();
  return (
    <div className="rounded-[--radius-md] border border-[--border-default] bg-[--surface-card] shadow-[--elev-1]">
      <table className="w-full border-spacing-0" style={{ borderCollapse: "separate" }}>
        <thead>
          <tr>
            <th className="border-b border-[--border-default] px-3 py-[10px] text-left text-[13px] font-semibold text-[--ink-3] whitespace-nowrap">Email</th>
            <th className="border-b border-[--border-default] px-3 py-[10px] text-left text-[13px] font-semibold text-[--ink-3] whitespace-nowrap">Role</th>
            <th className="border-b border-[--border-default] px-3 py-[10px] text-left text-[13px] font-semibold text-[--ink-3] whitespace-nowrap">Invited By</th>
            <th className="border-b border-[--border-default] px-3 py-[10px] text-left text-[13px] font-semibold text-[--ink-3] whitespace-nowrap">Sent</th>
            <th className="border-b border-[--border-default] px-3 py-[10px] text-left text-[13px] font-semibold text-[--ink-3] whitespace-nowrap">Expires</th>
            {showActions ? (
              <th className="border-b border-[--border-default] px-3 py-[10px] text-left text-[13px] font-semibold text-[--ink-3] whitespace-nowrap">Actions</th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {invitations.map((invite) => {
            const expired = isInvitationExpired(invite);
            return (
              <tr
                key={invite.id}
                className="transition-[background] duration-150 ease-linear hover:bg-[--surface-sunken] [&:last-child>td]:border-b-0"
              >
                <td className={`border-b border-[--border-subtle] p-3 align-middle${expired ? " line-through text-[--ink-4]" : " text-[--ink-1]"}`}>{invite.email}</td>
                <td className="border-b border-[--border-subtle] p-3 align-middle">
                  <RolePill role={invite.role} />
                </td>
                <td className="border-b border-[--border-subtle] p-3 align-middle text-[--ink-1]">{invite.invitedBy.name}</td>
                <td className="border-b border-[--border-subtle] p-3 align-middle text-[--ink-1]">{formatDate(invite.sentAt)}</td>
                <td className="border-b border-[--border-subtle] p-3 align-middle text-[--ink-1]">
                  {expired ? (
                    <span className="inline-flex rounded-[--radius-xs] border border-[--status-danger-border] bg-[--status-danger-bg] px-[6px] py-[2px] text-[11px] font-medium tracking-[0.04em] text-[--status-danger-fg]">Expired</span>
                  ) : (
                    formatDate(invite.expiresAt)
                  )}
                </td>
                {showActions ? (
                  <td className="flex flex-wrap gap-[6px] border-b border-[--border-subtle] p-3 align-middle text-[13px]">
                    <button
                      className="inline-flex items-center justify-center gap-[7px] rounded-[--radius-sm] border border-[--border-default] bg-[--surface-card] px-[9px] py-[7px] text-[--ink-1]"
                      onClick={() => resend.mutate(invite.id)}
                      type="button"
                    >
                      <RefreshCw size={14} /> Resend
                    </button>
                    <button
                      className="inline-flex items-center justify-center gap-[7px] rounded-[--radius-sm] border border-[--border-default] bg-[--surface-card] px-[9px] py-[7px] text-[--ink-1]"
                      onClick={() =>
                        navigator.clipboard?.writeText(invite.inviteUrl)
                      }
                      type="button"
                    >
                      <Link size={14} /> Copy link
                    </button>
                    <button
                      className="border border-transparent bg-transparent px-[9px] py-[7px] text-[--brick-500]"
                      onClick={() => cancel.mutate(invite.id)}
                      type="button"
                    >
                      Cancel
                    </button>
                  </td>
                ) : null}
              </tr>
            );
          })}
        </tbody>
      </table>
      {!invitations.length ? (
        <div className="flex min-h-[120px] flex-col items-center justify-center gap-[6px] text-center text-[--ink-3]">No pending invitations.</div>
      ) : null}
    </div>
  );
}
