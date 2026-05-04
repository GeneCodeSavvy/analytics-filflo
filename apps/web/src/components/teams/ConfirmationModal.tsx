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
      className="fixed inset-0 z-50 bg-[rgba(26,25,23,0.22)] backdrop-blur-[4px]"
      onMouseDown={onClose}
    >
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(480px,calc(100vw-32px))] border border-[#E8E6E1] rounded-[8px] bg-white p-5 shadow-[0_24px_70px_rgba(26,25,23,0.18)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {modal.type === "role" ? (
          <>
            <h2 className="m-0 text-[18px]">
              Promote {member.name} from {roleLabels[member.role]} to{" "}
              {roleLabels[modal.nextRole]}?
            </h2>
            <p className="text-[#78756E]">
              They&apos;ll be able to manage Users and handle ticket assignments
              in this org.
            </p>
            <div className="flex items-center gap-[10px] my-4">
              <RolePill role={member.role} />
              <ArrowRight size={16} />
              <RolePill role={modal.nextRole} />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                className="inline-flex items-center justify-center gap-[7px] rounded-[6px] border border-transparent px-3 py-[9px] bg-[#C4642A] text-white transition-[background] duration-150 ease-[ease]"
                onClick={confirm}
                type="button"
              >
                Confirm
              </button>
              <button
                className="inline-flex items-center justify-center gap-[7px] rounded-[6px] border border-[#E8E6E1] px-3 py-[9px] bg-white text-[#1A1917]"
                onClick={onClose}
                type="button"
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="m-0 text-[18px] text-[#B83A2A]">
              Remove {member.name} from org?
            </h2>
            <p className="text-[#78756E]">
              Their open tickets will be reassigned to you.
            </p>
            <label className="grid gap-[6px] my-3">
              <span className="text-[#78756E] text-[12px]">
                Type REMOVE to confirm
              </span>
              <input
                className="w-full border border-[#E8E6E1] rounded-[6px] bg-white text-[#1A1917] px-[10px] py-[9px] outline-[#C4642A]"
                value={typed}
                onChange={(event) => setTyped(event.target.value)}
              />
            </label>
            <div className="flex justify-end gap-2 mt-4">
              <button
                className="inline-flex items-center justify-center gap-[7px] rounded-[6px] border border-transparent px-3 py-[9px] bg-[#B83A2A] text-white disabled:opacity-45 disabled:cursor-not-allowed"
                disabled={typed !== "REMOVE"}
                onClick={confirm}
                type="button"
              >
                Remove member
              </button>
              <button
                className="inline-flex items-center justify-center gap-[7px] rounded-[6px] border border-[#E8E6E1] px-3 py-[9px] bg-white text-[#1A1917]"
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
