import { AlertCircle } from "lucide-react";
import type {
  OrgSummary,
  TeamRole,
  SortKey,
  SortDirection,
  TeamMemberListItem,
} from "../../types/teams";
import { isStale, relativeTime, formatDate } from "../../lib/teamsComponent";
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
            {showCheckboxes ? <th className="w-[38px]" /> : null}
            <th className="px-3 py-[10px] border-b border-[#E8E6E1] text-[#78756E] font-semibold text-left whitespace-nowrap">
              <SortHeader
                label="Member"
                sortKey="member"
                active={sortKey}
                direction={sortDirection}
                onSort={onSort}
              />
            </th>
            <th className="px-3 py-[10px] border-b border-[#E8E6E1] text-[#78756E] font-semibold text-left whitespace-nowrap">
              <SortHeader
                label="Role"
                sortKey="role"
                active={sortKey}
                direction={sortDirection}
                onSort={onSort}
              />
            </th>
            <th className="px-3 py-[10px] border-b border-[#E8E6E1] text-[#78756E] font-semibold text-left whitespace-nowrap">
              <SortHeader
                label="Last Active"
                sortKey="lastActive"
                active={sortKey}
                direction={sortDirection}
                onSort={onSort}
              />
            </th>
            <th className="px-3 py-[10px] border-b border-[#E8E6E1] text-[#78756E] font-semibold text-left whitespace-nowrap">
              <SortHeader
                label="Joined"
                sortKey="joined"
                active={sortKey}
                direction={sortDirection}
                onSort={onSort}
              />
            </th>
            <th className="px-3 py-[10px] border-b border-[#E8E6E1] text-[#78756E] font-semibold text-left whitespace-nowrap">
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
                  "group transition-colors duration-150 hover:bg-[#F5F4F0] [&:last-child>td]:border-b-0",
                  checked
                    ? "!bg-[rgba(196,100,42,0.08)] shadow-[inset_3px_0_0_#C4642A]"
                    : "",
                ].join(" ")}
                tabIndex={0}
              >
                {showCheckboxes ? (
                  <td className="w-[38px] p-3 border-b border-[#F0EEE9] align-middle">
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
                <td className="p-3 border-b border-[#F0EEE9] align-middle">
                  <div className="flex items-center gap-[10px] min-w-[280px]">
                    <Avatar member={member} />
                    <div>
                      <button
                        className="border-0 bg-transparent p-0 text-[#1A1917] font-medium text-left hover:underline"
                        onClick={() =>
                          openMemberDetail(member.id, member.org.id)
                        }
                        type="button"
                      >
                        <HighlightedText text={member.name} query={query} />
                      </button>
                      <div className="text-[#78756E] text-[12px]">
                        <HighlightedText text={member.email} query={query} />
                      </div>
                    </div>
                  </div>
                </td>
                <td className="p-3 border-b border-[#F0EEE9] align-middle">
                  <RolePill role={member.role} />
                </td>
                <td className="p-3 border-b border-[#F0EEE9] align-middle">
                  <span
                    className={
                      isStale(member.lastActiveAt)
                        ? "inline-flex items-center gap-[5px] text-[#B8860B]"
                        : ""
                    }
                  >
                    {isStale(member.lastActiveAt) ? (
                      <AlertCircle size={14} />
                    ) : null}
                    {relativeTime(member.lastActiveAt)}
                  </span>
                </td>
                <td className="p-3 border-b border-[#F0EEE9] align-middle">
                  {formatDate(member.joinedAt)}
                </td>
                <td className="p-3 border-b border-[#F0EEE9] align-middle">
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
        <div className="flex min-h-[120px] flex-col items-center justify-center gap-[6px] text-[#78756E] text-center">
          <Users size={20} />
          <span>No members match this view yet.</span>
          <small className="text-[#A8A49C]">
            {orgs.length
              ? "Try a different filter."
              : "Backend team data will appear here when available."}
          </small>
        </div>
      ) : null}
    </div>
  );
}
