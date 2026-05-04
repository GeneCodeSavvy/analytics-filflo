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
    <div className="fixed bottom-6 left-1/2 z-[--z-toast] flex h-12 w-[min(720px,calc(100vw-32px))] -translate-x-1/2 animate-[teams-slide-up_180ms_ease-out] items-center gap-3 rounded-[--radius-lg] border border-[--border-default] bg-[--surface-card] px-3.5 shadow-[--elev-3]">
      <strong className="text-[13px] text-[--ink-1]">{selectedIds.length} selected</strong>
      <select
        className="rounded-[--radius-sm] border border-[--border-default] bg-[--surface-card] text-[--ink-1] px-[10px] py-[6px] text-[13px] outline-none focus:border-[--border-focus]"
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
        className="inline-flex items-center justify-center gap-[7px] rounded-[--radius-sm] border border-transparent px-3 py-1.5 bg-transparent text-[13px] font-medium text-[--brick-500] hover:bg-[--brick-50]"
        onClick={() =>
          bulkMutation.mutate({ ids: selectedIds, orgId, op: "remove" })
        }
        type="button"
      >
        Remove
      </button>
      <button
        className="inline-flex items-center justify-center gap-[7px] rounded-[--radius-sm] border border-transparent px-3 py-1.5 bg-transparent text-[13px] font-medium text-[--ink-3] hover:bg-[--surface-sunken]"
        onClick={clearSelection}
        type="button"
      >
        Clear selection
      </button>
    </div>
  );
}
