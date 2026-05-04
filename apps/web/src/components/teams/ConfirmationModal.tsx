import { useState } from "react";
import { ArrowRight } from "lucide-react";
import type { ModalState } from "../../types/teams";
import { roleLabels } from "../../lib/teamsComponent";
import {
  useChangeTeamMemberRoleMutation,
  useRemoveTeamMemberMutation,
} from "../../hooks/useTeamsMutations";
import { RolePill } from "./RolePill";

export function ConfirmationModal({
  modal,
  onClose,
}: {
  modal: ModalState;
  onClose: () => void;
}) {
  const changeRole = useChangeTeamMemberRoleMutation();
  const removeMember = useRemoveTeamMemberMutation();
  const [typed, setTyped] = useState("");
  if (!modal) return null;

  const member = modal.member;
  const confirm = () => {
    if (modal.type === "role") {
      changeRole.mutate({
        userId: member.id,
        payload: { role: modal.nextRole },
      });
    } else {
      removeMember.mutate({
        userId: member.id,
        params: { orgId: member.org.id },
      });
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[--z-modal] bg-[--surface-overlay] backdrop-blur-[4px]"
      onMouseDown={onClose}
    >
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(480px,calc(100vw-32px))] border border-[--border-default] rounded-[--radius-md] bg-[--surface-card] p-5 shadow-[--elev-4] font-mono text-[13px] text-[--ink-1]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {modal.type === "role" ? (
          <>
            <h2 className="m-0 text-[18px] font-semibold">
              Promote {member.name} from {roleLabels[member.role]} to{" "}
              {roleLabels[modal.nextRole]}?
            </h2>
            <p className="mt-1 mb-0 text-[--ink-3]">
              They&apos;ll be able to manage Users and handle ticket assignments
              in this org.
            </p>
            <div className="flex items-center gap-[10px] my-4">
              <RolePill role={member.role} />
              <ArrowRight size={16} className="text-[--ink-3]" />
              <RolePill role={modal.nextRole} />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                className="inline-flex items-center justify-center gap-[7px] rounded-[--radius-sm] border border-transparent px-3 py-[9px] bg-[--action-bg] text-[--action-fg] font-medium transition-colors hover:bg-[--action-bg-hover]"
                onClick={confirm}
                type="button"
              >
                Confirm
              </button>
              <button
                className="inline-flex items-center justify-center gap-[7px] rounded-[--radius-sm] border border-[--border-default] px-3 py-[9px] bg-[--surface-card] text-[--ink-1] font-medium transition-colors hover:bg-[--surface-sunken]"
                onClick={onClose}
                type="button"
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="m-0 text-[18px] font-semibold text-[--brick-500]">
              Remove {member.name} from org?
            </h2>
            <p className="mt-1 mb-0 text-[--ink-3]">
              Their open tickets will be reassigned to you.
            </p>
            <label className="grid gap-[6px] my-3">
              <span className="text-[--ink-3] text-[12px]">
                Type REMOVE to confirm
              </span>
              <input
                className="w-full border border-[--border-default] rounded-[--radius-sm] bg-[--surface-card] text-[--ink-1] px-[10px] py-[9px] outline-none focus:border-[--border-focus]"
                value={typed}
                onChange={(event) => setTyped(event.target.value)}
              />
            </label>
            <div className="flex justify-end gap-2 mt-4">
              <button
                className="inline-flex items-center justify-center gap-[7px] rounded-[--radius-sm] border border-transparent px-3 py-[9px] bg-[--brick-500] text-[--ink-on-accent] font-medium disabled:opacity-45 disabled:cursor-not-allowed hover:bg-[--brick-700]"
                disabled={typed !== "REMOVE"}
                onClick={confirm}
                type="button"
              >
                Remove member
              </button>
              <button
                className="inline-flex items-center justify-center gap-[7px] rounded-[--radius-sm] border border-[--border-default] px-3 py-[9px] bg-[--surface-card] text-[--ink-1] font-medium transition-colors hover:bg-[--surface-sunken]"
                onClick={onClose}
                type="button"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
