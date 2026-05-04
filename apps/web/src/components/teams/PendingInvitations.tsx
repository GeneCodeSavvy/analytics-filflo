import { Link, RefreshCw } from "lucide-react";
import type { Invitation } from "../../types/teams";
import { formatDate, isInvitationExpired } from "../../lib/teamsComponent";
import {
  useCancelTeamInvitationMutation,
  useResendTeamInvitationMutation,
} from "../../hooks/useTeamsMutations";
import { RolePill } from "./RolePill";

export function PendingInvitations({ invitations }: { invitations: Invitation[] }) {
  const resend = useResendTeamInvitationMutation();
  const cancel = useCancelTeamInvitationMutation();
  return (
    <div className="border border-[#E8E6E1] rounded-[8px] bg-white shadow-[0_1px_3px_rgba(26,25,23,0.06),0_1px_2px_rgba(26,25,23,0.04)]">
      <table className="w-full border-spacing-0" style={{ borderCollapse: "separate" }}>
        <thead>
          <tr>
            <th className="px-3 py-[10px] border-b border-[#E8E6E1] text-[#78756E] font-semibold text-left whitespace-nowrap">Email</th>
            <th className="px-3 py-[10px] border-b border-[#E8E6E1] text-[#78756E] font-semibold text-left whitespace-nowrap">Role</th>
            <th className="px-3 py-[10px] border-b border-[#E8E6E1] text-[#78756E] font-semibold text-left whitespace-nowrap">Invited By</th>
            <th className="px-3 py-[10px] border-b border-[#E8E6E1] text-[#78756E] font-semibold text-left whitespace-nowrap">Sent</th>
            <th className="px-3 py-[10px] border-b border-[#E8E6E1] text-[#78756E] font-semibold text-left whitespace-nowrap">Expires</th>
            <th className="px-3 py-[10px] border-b border-[#E8E6E1] text-[#78756E] font-semibold text-left whitespace-nowrap">Actions</th>
          </tr>
        </thead>
        <tbody>
          {invitations.map((invite) => {
            const expired = isInvitationExpired(invite);
            return (
              <tr
                key={invite.id}
                className="transition-[background] duration-150 ease-linear hover:bg-[#F5F4F0] [&:last-child>td]:border-b-0"
              >
                <td className={`p-3 border-b border-[#F0EEE9] align-middle${expired ? " line-through text-[#A8A49C]" : ""}`}>{invite.email}</td>
                <td className="p-3 border-b border-[#F0EEE9] align-middle">
                  <RolePill role={invite.role} />
                </td>
                <td className="p-3 border-b border-[#F0EEE9] align-middle">{invite.invitedBy.name}</td>
                <td className="p-3 border-b border-[#F0EEE9] align-middle">{formatDate(invite.sentAt)}</td>
                <td className="p-3 border-b border-[#F0EEE9] align-middle">
                  {expired ? (
                    <span className="inline-flex border border-[rgba(184,58,42,0.25)] rounded-[4px] bg-[rgba(184,58,42,0.08)] text-[#B83A2A] px-[6px] py-[2px]">Expired</span>
                  ) : (
                    formatDate(invite.expiresAt)
                  )}
                </td>
                <td className="p-3 border-b border-[#F0EEE9] align-middle flex gap-[6px] flex-wrap">
                  <button
                    className="inline-flex items-center justify-center gap-[7px] rounded-[6px] border border-[#E8E6E1] px-[9px] py-[7px] bg-white text-[#1A1917]"
                    onClick={() => resend.mutate(invite.id)}
                    type="button"
                  >
                    <RefreshCw size={14} /> Resend
                  </button>
                  <button
                    className="inline-flex items-center justify-center gap-[7px] rounded-[6px] border border-[#E8E6E1] px-[9px] py-[7px] bg-white text-[#1A1917]"
                    onClick={() =>
                      navigator.clipboard?.writeText(invite.inviteUrl)
                    }
                    type="button"
                  >
                    <Link size={14} /> Copy link
                  </button>
                  <button
                    className="bg-transparent text-[#B83A2A] border border-transparent px-[9px] py-[7px]"
                    onClick={() => cancel.mutate(invite.id)}
                    type="button"
                  >
                    Cancel
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {!invitations.length ? (
        <div className="flex min-h-[120px] flex-col items-center justify-center gap-[6px] text-[#78756E] text-center">No pending invitations.</div>
      ) : null}
    </div>
  );
}
