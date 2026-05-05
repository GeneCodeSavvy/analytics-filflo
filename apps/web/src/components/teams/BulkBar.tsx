import type { TeamRole } from "../../types/teams";
import { roles, roleLabels } from "../../lib/teamsComponent";
import { useTeamsStore } from "../../stores/useTeamsStore";
import { useBulkTeamMembersMutation } from "../../hooks/useTeamsMutations";
import { useAuthState } from "../../stores/useAuthStore";

export function BulkBar({
  orgId,
  selectedIds,
}: {
  orgId: string;
  selectedIds: string[];
}) {
  const actorRole = useAuthState((state) => state.user?.role);
  const clearSelection = useTeamsStore((state) => state.clearSelection);
  const bulkMutation = useBulkTeamMembersMutation();
  if (!selectedIds.length) return null;
  const roleOptions =
    actorRole === "SUPER_ADMIN"
      ? roles
      : actorRole === "MODERATOR"
        ? (["MODERATOR"] as TeamRole[])
        : [];

  return (
    <div className="fixed bottom-4 left-1/2 z-[--z-toast] grid w-[calc(100vw-24px)] max-w-[560px] -translate-x-1/2 animate-[teams-slide-up_180ms_ease-out] grid-cols-1 items-center gap-2 rounded-[--radius-md] border border-[--border-default] bg-[--surface-card] p-2.5 shadow-[--elev-3] sm:bottom-6 sm:w-[min(560px,calc(100vw-48px))] sm:grid-cols-[1fr_1.2fr_1fr_1fr] sm:gap-2">
      <strong className="text-center text-[13px] text-[--ink-1] sm:text-left">
        {selectedIds.length} selected
      </strong>
      <select
        className="h-9 w-full rounded-[--radius-sm] border border-[--border-default] bg-[--surface-card] px-[10px] py-[6px] text-[13px] text-[--ink-1] outline-none focus:border-[--border-focus]"
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
        {roleOptions.map((role) => (
          <option key={role} value={role}>
            {roleLabels[role]}
          </option>
        ))}
      </select>
      <button
        className="inline-flex h-9 w-full items-center justify-center gap-[7px] rounded-[--radius-sm] border border-transparent bg-transparent px-3 py-1.5 text-[13px] font-medium text-[--brick-500] hover:bg-[--brick-50]"
        onClick={() =>
          bulkMutation.mutate({ ids: selectedIds, orgId, op: "remove" })
        }
        type="button"
      >
        Remove
      </button>
      <button
        className="inline-flex h-9 w-full items-center justify-center gap-[7px] rounded-[--radius-sm] border border-transparent bg-transparent px-3 py-1.5 text-[13px] font-medium text-[--ink-3] hover:bg-[--surface-sunken]"
        onClick={clearSelection}
        type="button"
      >
        Clear selection
      </button>
    </div>
  );
}
