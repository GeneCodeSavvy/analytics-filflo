import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import type { MemberRow, TeamRole } from "../../types/teams";
import type { PreviewRole } from "../../types/teams";
import { canAct, validRoleOptions } from "../../lib/teamsComponent";
import { RolePill } from "./RolePill";

export function ActionMenu({
  actorRole,
  member,
  onRole,
  onRemove,
  onProfile,
}: {
  actorRole: PreviewRole;
  member: MemberRow;
  onRole: (role: TeamRole) => void;
  onRemove: () => void;
  onProfile: () => void;
}) {
  const [open, setOpen] = useState(false);
  const options = validRoleOptions(actorRole, member);

  if (!canAct(actorRole, member)) return null;

  return (
    <div className="relative inline-flex">
      <button
        className="inline-flex items-center justify-center w-[30px] h-[30px] border border-[#E8E6E1] rounded-[6px] bg-white text-[#78756E]"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <MoreHorizontal size={16} />
      </button>
      {open ? (
        <div className="absolute right-0 top-[34px] z-30 min-w-[190px] border border-[#E8E6E1] rounded-[8px] bg-white shadow-[0_12px_30px_rgba(26,25,23,0.12)] p-[6px]">
          {options.length ? (
            <div>
              <div className="px-2 py-[6px] text-[#A8A49C] text-[11px]">Change role</div>
              {options.map((role) => (
                <button
                  key={role}
                  onClick={() => onRole(role)}
                  type="button"
                  className="w-full flex items-center gap-2 border-0 rounded-[5px] bg-transparent p-2 text-[#1A1917] text-left hover:bg-[#F5F4F0]"
                >
                  <RolePill role={role} />
                </button>
              ))}
            </div>
          ) : null}
          <button
            onClick={onProfile}
            type="button"
            className="w-full flex items-center gap-2 border-0 rounded-[5px] bg-transparent p-2 text-[#1A1917] text-left hover:bg-[#F5F4F0]"
          >
            View profile
          </button>
          <div className="h-px bg-[#E8E6E1] my-1" />
          <button
            className="w-full flex items-center gap-2 border-0 rounded-[5px] bg-transparent p-2 text-[#B83A2A] text-left hover:bg-[#F5F4F0]"
            onClick={onRemove}
            type="button"
          >
            Remove from org
          </button>
        </div>
      ) : null}
    </div>
  );
}
