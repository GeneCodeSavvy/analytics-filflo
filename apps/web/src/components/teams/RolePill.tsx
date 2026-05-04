import type { TeamRole } from "../../types/teams";
import { roleClass, roleLabels } from "../../lib/teamsComponent";

export function RolePill({ role }: { role: TeamRole }) {
  return (
    <span className={`inline-flex items-center border border-solid rounded-[999px] px-2 py-0.5 text-[11px] leading-[1.4] whitespace-nowrap ${roleClass[role]}`}>
      {roleLabels[role]}
    </span>
  );
}
