import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { OrgSummary, TeamRole } from "../../types/teams";
import { roles, roleLabels, roleDescriptions } from "../../lib/teamsComponent";
import { useTeamsStore } from "../../stores/useTeamsStore";
import { useInviteTeamMemberMutation } from "../../hooks/useTeamsMutations";
import { RolePill } from "./RolePill";
import { useAuthState } from "@/stores/useAuthStore";

export function InviteModal({ orgs }: { orgs: OrgSummary[] }) {
  const actorRole = useAuthState((state) => state.user?.role);
  if (!actorRole) throw new Error("Authentication not completed");
  const { inviteModalOpen, closeInviteModal, inviteDraft, saveInviteDraft } =
    useTeamsStore();
  const inviteMutation = useInviteTeamMemberMutation();
  const [email, setEmail] = useState(inviteDraft?.email ?? "");
  const [role, setRole] = useState<TeamRole>(inviteDraft?.role ?? "USER");
  const [orgId, setOrgId] = useState(
    inviteDraft?.orgId ?? orgs[0]?.org.id ?? "",
  );

  useEffect(() => {
    if (inviteModalOpen)
      setOrgId((current) => current || orgs[0]?.org.id || "");
  }, [inviteModalOpen, orgs]);

  if (!inviteModalOpen) return null;

  const submit = () => {
    saveInviteDraft({ email, role, orgId, message: "" });
    inviteMutation.mutate({ email, role, orgId, message: "" });
  };

  return (
    <div
      className="fixed inset-0 z-[--z-modal] bg-[--surface-overlay] backdrop-blur-[4px]"
      onMouseDown={closeInviteModal}
    >
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(480px,calc(100vw-32px))] border border-[--border-default] rounded-[--radius-md] bg-[--surface-card] p-5 shadow-[--elev-4] font-mono text-[13px]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="m-0 text-[18px] font-semibold text-[--ink-1]">Invite a new member</h2>
          <button
            className="inline-flex items-center justify-center w-[30px] h-[30px] border border-transparent rounded-[--radius-sm] bg-transparent text-[--ink-3] hover:bg-[--surface-sunken]"
            onClick={closeInviteModal}
            type="button"
          >
            <X size={16} />
          </button>
        </div>
        <label className="grid gap-1.5 my-3">
          <span className="text-[--ink-3] text-[12px]">Email</span>
          <input
            className="w-full border border-[--border-default] rounded-[--radius-sm] bg-[--surface-card] text-[--ink-1] px-[10px] py-[9px] outline-none focus:border-[--border-focus]"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@company.com"
          />
        </label>
        <div className="grid gap-2">
          {roles.map((option) => (
            <button
              className={
                option === role
                  ? "flex items-center justify-between gap-3 border border-[--action-bg] rounded-[--radius-sm] bg-[--action-tint-bg] p-3 text-left"
                  : "flex items-center justify-between gap-3 border border-[--border-default] rounded-[--radius-sm] bg-[--surface-card] p-3 text-left transition-colors hover:border-[--border-strong]"
              }
              key={option}
              onClick={() => setRole(option)}
              type="button"
            >
              <div>
                <strong className="block font-medium text-[--ink-1]">{roleLabels[option]}</strong>
                <span className="block mt-[3px] text-[--ink-3] text-[12px]">
                  {roleDescriptions[option]}
                </span>
              </div>
              <RolePill role={option} />
            </button>
          ))}
        </div>
        {actorRole === "SUPER_ADMIN" ? (
          <label className="grid gap-1.5 my-3">
            <span className="text-[--ink-3] text-[12px]">Organization</span>
            <select
              className="w-full border border-[--border-default] rounded-[--radius-sm] bg-[--surface-card] text-[--ink-1] px-[10px] py-[9px] outline-none focus:border-[--border-focus]"
              value={orgId}
              onChange={(event) => setOrgId(event.target.value)}
            >
              {orgs.map((org) => (
                <option key={org.org.id} value={org.org.id}>
                  {org.org.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <div className="flex justify-end gap-2 mt-4">
          <button
            className="inline-flex items-center justify-center gap-[7px] rounded-[--radius-sm] border border-transparent px-3 py-[9px] font-medium bg-[--action-bg] text-[--action-fg] transition-colors hover:bg-[--action-bg-hover] disabled:opacity-45 disabled:cursor-not-allowed"
            disabled={!email || !orgId}
            onClick={submit}
            type="button"
          >
            Send Invitation
          </button>
          <button
            className="inline-flex items-center justify-center gap-[7px] rounded-[--radius-sm] border border-[--border-default] px-3 py-[9px] font-medium bg-[--surface-card] text-[--ink-1] transition-colors hover:bg-[--surface-sunken]"
            onClick={closeInviteModal}
            type="button"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
