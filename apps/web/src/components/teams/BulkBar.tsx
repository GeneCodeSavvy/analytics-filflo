import type { TeamRole } from "../../types/teams";
import { roles, roleLabels } from "../../lib/teamsComponent";
import { useTeamsStore } from "../../stores/useTeamsStore";
import { useBulkTeamMembersMutation } from "../../hooks/useTeamsMutations";

export function BulkBar({
  orgId,
  selectedIds,
}: {
  orgId: string;
  selectedIds: string[];
}) {
  const clearSelection = useTeamsStore((state) => state.clearSelection);
  const bulkMutation = useBulkTeamMembersMutation();
  if (!selectedIds.length) return null;
  return (
    <div className="sticky bottom-0 flex items-center gap-[10px] p-3 border-t border-[#E8E6E1] bg-white shadow-[0_-6px_18px_rgba(26,25,23,0.08)] animate-[teams-slide-up_180ms_ease-out]">
      <strong>{selectedIds.length} selected</strong>
      <select
        className="border border-[#E8E6E1] rounded-md bg-white text-[#1A1917] px-2.5 py-[9px]"
        onChange={(event) =>
          bulkMutation.mutate({
            ids: selectedIds,
            orgId,
            op: "change_role",
            payload: { role: event.target.value as TeamRole },
          })
        }
        defaultValue=""
      >
        <option value="" disabled>
          Change role
        </option>
        {roles.map((role) => (
          <option key={role} value={role}>
            {roleLabels[role]}
          </option>
        ))}
      </select>
      <button
        className="inline-flex items-center justify-center gap-[7px] rounded-[6px] border border-transparent px-3 py-[9px] bg-transparent text-[#B83A2A] transition-[background,box-shadow,transform] duration-150 ease-in-out"
        onClick={() =>
          bulkMutation.mutate({ ids: selectedIds, orgId, op: "remove" })
        }
        type="button"
      >
        Remove
      </button>
      <button
        className="inline-flex items-center justify-center gap-[7px] rounded-[6px] border border-transparent px-3 py-[9px] bg-transparent text-[#78756E] transition-[background,box-shadow,transform] duration-150 ease-in-out"
        onClick={clearSelection}
        type="button"
      >
        Clear selection
      </button>
    </div>
  );
}
