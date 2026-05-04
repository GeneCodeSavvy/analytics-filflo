import type {
  OrgSummary,
  TeamRole,
  SortKey,
  SortDirection,
  TeamMemberListItem,
} from "../../types/teams";
import { formatDate } from "../../lib/teamsComponent";
import { useTeamsStore } from "../../stores/useTeamsStore";
import { Avatar } from "./Avatar";
import { RolePill } from "./RolePill";
import { HighlightedText } from "./HighlightedText";
import { SortHeader } from "./SortHeader";
import { ActionMenu } from "./ActionMenu";
import { Users } from "lucide-react";

export function MemberTable({
  rows,
  orgs,
  query,
  showCheckboxes,
  sortKey,
  sortDirection,
  onSort,
  onRole,
  onRemove,
}: {
  rows: TeamMemberListItem[];
  orgs: OrgSummary[];
  query: string;
  showCheckboxes: boolean;
  sortKey: SortKey;
  sortDirection: SortDirection;
  onSort: (key: SortKey) => void;
  onRole: (member: TeamMemberListItem, role: TeamRole) => void;
  onRemove: (member: TeamMemberListItem) => void;
}) {
  const { selectedRowIds, toggleRowSelected, openMemberDetail } =
    useTeamsStore();
  const selected = new Set(selectedRowIds);

  return (
    <div className="relative overflow-auto">
      <table className="w-full border-separate border-spacing-0">
        <thead>
          <tr>
            {showCheckboxes ? <th className="w-[38px] border-b border-[--border-default]" /> : null}
            <th className="border-b border-[--border-default] px-3 py-[10px] text-left text-[13px] font-semibold text-[--ink-3] whitespace-nowrap">
              <SortHeader
                label="Member"
                sortKey="member"
                active={sortKey}
                direction={sortDirection}
                onSort={onSort}
              />
            </th>
            <th className="border-b border-[--border-default] px-3 py-[10px] text-left text-[13px] font-semibold text-[--ink-3] whitespace-nowrap">
              <SortHeader
                label="Role"
                sortKey="role"
                active={sortKey}
                direction={sortDirection}
                onSort={onSort}
              />
            </th>
            <th className="border-b border-[--border-default] px-3 py-[10px] text-left text-[13px] font-semibold text-[--ink-3] whitespace-nowrap">
              <SortHeader
                label="Joined"
                sortKey="joined"
                active={sortKey}
                direction={sortDirection}
                onSort={onSort}
              />
            </th>
            <th className="border-b border-[--border-default] px-3 py-[10px] text-left text-[13px] font-semibold text-[--ink-3] whitespace-nowrap">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((member) => {
            const checked = selected.has(member.id);
            return (
              <tr
                key={`${member?.org?.id}-${member.id}`}
                className={[
                  "group transition-[background] duration-150 ease-linear hover:bg-[--surface-sunken] [&:last-child>td]:border-b-0",
                  checked
                    ? "bg-[--action-tint-bg] shadow-[inset_3px_0_0_var(--action-bg)]"
                    : "",
                ].join(" ")}
                tabIndex={0}
              >
                {showCheckboxes ? (
                  <td className="w-[38px] border-b border-[--border-subtle] p-3 align-middle">
                    <input
                      aria-label={`Select ${member.name}`}
                      checked={checked}
                      onChange={() => toggleRowSelected(member.id)}
                      type="checkbox"
                      className={[
                        "transition-opacity duration-150 group-hover:opacity-100",
                        checked ? "opacity-100" : "opacity-0",
                      ].join(" ")}
                    />
                  </td>
                ) : null}
                <td className="border-b border-[--border-subtle] p-3 align-middle">
                  <div className="flex min-w-[280px] items-center gap-[10px]">
                    <Avatar member={member} />
                    <div>
                      <button
                        className="border-0 bg-transparent p-0 text-left font-medium text-[--ink-1] hover:underline"
                        onClick={() =>
                          openMemberDetail(member.id, member.org.id)
                        }
                        type="button"
                      >
                        <HighlightedText text={member.name} query={query} />
                      </button>
                      <div className="text-[12px] text-[--ink-3]">
                        <HighlightedText text={member.email} query={query} />
                      </div>
                    </div>
                  </div>
                </td>
                <td className="border-b border-[--border-subtle] p-3 align-middle">
                  <RolePill role={member.role} />
                </td>
                <td className="border-b border-[--border-subtle] p-3 align-middle text-[--ink-1]">
                  {formatDate(member.joinedAt)}
                </td>
                <td className="border-b border-[--border-subtle] p-3 align-middle">
                  <ActionMenu
                    member={member}
                    onProfile={() =>
                      openMemberDetail(member.id, member.org?.id)
                    }
                    onRemove={() => onRemove(member)}
                    onRole={(role) => onRole(member, role)}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {!rows.length ? (
        <div className="flex min-h-[120px] flex-col items-center justify-center gap-[6px] text-center text-[--ink-3]">
          <Users size={20} />
          <span>No members match this view yet.</span>
          <small className="text-[--ink-4]">
            {orgs.length
              ? "Try a different filter."
              : "Backend team data will appear here when available."}
          </small>
        </div>
      ) : null}
    </div>
  );
}
