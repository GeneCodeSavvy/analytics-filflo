import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import type { MemberRow, TeamRole } from "../../types/teams";
import { canAct, validRoleOptions } from "../../lib/teamsComponent";
import { RolePill } from "./RolePill";
import { useAuthState } from "@/stores/useAuthStore";

export function ActionMenu({
  member,
  onRole,
  onRemove,
  onProfile,
}: {
  member: MemberRow;
  onRole: (role: TeamRole) => void;
  onRemove: () => void;
  onProfile: () => void;
}) {
  const actorRole = useAuthState((state) => state.user?.role);
  if (!actorRole) throw new Error("Authentication not completed");
  const [open, setOpen] = useState(false);
  const options = validRoleOptions(actorRole, member);

  if (!canAct(actorRole, member)) return null;

  return (
    <div className="relative inline-flex">
      <button
        className="inline-flex items-center justify-center w-[30px] h-[30px] border border-[--border-default] rounded-[--radius-sm] bg-[--surface-card] text-[--ink-3] hover:bg-[--surface-sunken] transition-colors"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <MoreHorizontal size={16} />
      </button>
      {open ? (
        <div className="absolute right-0 top-[34px] z-[--z-popover] min-w-[190px] border border-[--border-default] rounded-[--radius-md] bg-[--surface-card] shadow-[--elev-2] p-[6px] font-mono text-[13px]">
          {options.length ? (
            <div>
              <div className="px-2 py-[6px] text-[--ink-3] text-[11px] font-medium tracking-[0.04em] uppercase">
                Change role
              </div>
              {options.map((role) => (
                <button
                  key={role}
                  onClick={() => onRole(role)}
                  type="button"
                  className="w-full flex items-center gap-2 border-0 rounded-[--radius-sm] bg-transparent p-2 text-[--ink-1] text-left hover:bg-[--surface-sunken]"
                >
                  <RolePill role={role} />
                </button>
              ))}
            </div>
          ) : null}
          <button
            onClick={onProfile}
            type="button"
            className="w-full flex items-center gap-2 border-0 rounded-[--radius-sm] bg-transparent p-2 text-[--ink-1] text-left hover:bg-[--surface-sunken]"
          >
            View profile
          </button>
          <div className="h-px bg-[--border-subtle] my-1" />
          <button
            className="w-full flex items-center gap-2 border-0 rounded-[--radius-sm] bg-transparent p-2 text-[--brick-500] text-left hover:bg-[--brick-50]"
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
