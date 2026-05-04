import { useDeferredValue, useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Building2,
  Info,
  Search,
  UserPlus,
} from "lucide-react";
import type {
  ModalState,
  RoleFilter,
  SortDirection,
  SortKey,
  TeamMemberListItem,
  TeamTab,
} from "../../types/teams";
import {
  filterTeamRows,
  groupRowsByOrg,
  nextSortState,
  orgStats,
  roleLabels,
  roles,
  sortRows,
} from "../../lib/teamsComponent";
import {
  useTeamInvitationsQuery,
  useTeamMembersQuery,
  useTeamOrgsQuery,
} from "../../hooks/useTeamsQueries";
import { useTeamsStore } from "../../stores/useTeamsStore";
import { MemberTable } from "./MemberTable";
import { BulkBar } from "./BulkBar";
import { UserGrid } from "./UserGrid";
import { InviteModal } from "./InviteModal";
import { ConfirmationModal } from "./ConfirmationModal";
import { DetailDrawer } from "./DetailDrawer";
import { PendingInvitations } from "./PendingInvitations";
import { useAuthState } from "@/stores/useAuthStore";
import { CreateOrgModal } from "./CreateOrgModal";

export const Teams = () => {
  const actorRole = useAuthState((state) => state.user?.role);
  if (!actorRole) throw new Error("Authentication is not complete");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("role");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [activeTab, setActiveTab] = useState<TeamTab>("members");
  const [modal, setModal] = useState<ModalState>(null);
  const [createOrgOpen, setCreateOrgOpen] = useState(false);
  const {
    expandedOrgIds,
    expandAllOrgs,
    collapseAllOrgs,
    toggleOrgExpanded,
    selectedRowIds,
    openInviteModal,
  } = useTeamsStore();
  const memberQuery = useTeamMembersQuery({
    role: roleFilter === "ALL" ? [] : [roleFilter],
    q: deferredSearch,
    page: 1,
    pageSize: 250,
  });
  const orgQuery = useTeamOrgsQuery();
  const invitationQuery = useTeamInvitationsQuery({ status: "PENDING" });
  const members = memberQuery.data?.rows ?? [];
  const orgs = orgQuery.data ?? [];
  const invitations = invitationQuery.data ?? [];

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setModal(null);
        useTeamsStore.getState().closeInviteModal();
        useTeamsStore.getState().closeMemberDetail();
        setCreateOrgOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!expandedOrgIds.length && orgs.length)
      expandAllOrgs(orgs.map((org) => org.org.id));
  }, [expandedOrgIds.length, expandAllOrgs, orgs]);

  const visibleRows: TeamMemberListItem[] = useMemo(() => {
    const filtered = filterTeamRows(members, deferredSearch, roleFilter);
    return sortRows(filtered, sortKey, sortDirection);
  }, [members, deferredSearch, roleFilter, sortDirection, sortKey]);

  const rowsByOrg = useMemo(() => {
    return groupRowsByOrg(visibleRows);
  }, [visibleRows]);

  const handleSort = (key: SortKey) => {
    const next = nextSortState(key, sortKey, sortDirection);
    setSortKey(next.sortKey);
    setSortDirection(next.sortDirection);
  };

  const superAdminView = actorRole === "SUPER_ADMIN";
  const moderatorView = actorRole === "MODERATOR";
  const adminView = actorRole === "ADMIN";
  const userView = actorRole === "USER";
  const canInvite = superAdminView || moderatorView;
  const allExpanded = orgs.length > 0 && expandedOrgIds.length >= orgs.length;

  return (
    <div className="min-h-full -m-[2.5rem] px-6 pb-8 bg-[#FAFAF8] text-[#1A1917] font-[Geist_Mono,ui-monospace,monospace] tracking-[0] text-[13px] [&_button]:cursor-pointer   [&_*]:box-border">
      <header className="sticky top-[43px] z-10 grid grid-cols-[1fr_auto] gap-3 items-start pt-6 pb-4 bg-[rgba(250,250,248,0.94)] backdrop-blur-[10px]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="m-0 text-[30px] leading-none font-bold text-black!">
              Teams
            </h1>
            {!superAdminView && (
              <span className="border border-[#E8E6E1] rounded-full bg-white px-2 py-1 text-[#78756E] text-xs">
                {memberQuery.data?.total ?? members.length} members
              </span>
            )}
          </div>
          {moderatorView ? (
            <p className="mt-2 mb-0 text-[#78756E]">
              {orgs[0]?.org.name ?? "Your organization"}
            </p>
          ) : null}
        </div>
        <div className="flex gap-2 items-center">
          <label className="w-60 flex items-center gap-2 border border-[#E8E6E1] rounded-md bg-white px-2.5 text-[#A8A49C]">
            <Search size={16} />
            <input
              className="w-full border-0 outline-none bg-transparent py-[9px] text-[#1A1917]"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search members..."
            />
          </label>
          <select
            className="border border-[#E8E6E1] rounded-md bg-white text-[#1A1917] px-2.5 py-[9px] outline-[#C4642A]"
            value={roleFilter}
            onChange={(event) =>
              setRoleFilter(event.target.value as RoleFilter)
            }
          >
            <option value="ALL">All roles</option>
            {roles.map((role) => (
              <option key={role} value={role}>
                {roleLabels[role]}
              </option>
            ))}
          </select>
          {canInvite ? (
            <button
              className="inline-flex items-center justify-center gap-[7px] rounded-md border border-transparent px-3 py-[9px] transition-[background,box-shadow,transform] duration-150 bg-[#C4642A] text-white hover:bg-[#A8521E]"
              onClick={() => openInviteModal()}
              type="button"
            >
              <UserPlus size={16} /> Invite Member
            </button>
          ) : null}
          {superAdminView ? (
            <button
              className="inline-flex items-center justify-center gap-[7px] rounded-md border border-[#E8E6E1] bg-white px-3 py-[9px] text-[#1A1917] transition-[background,box-shadow,transform] duration-150 hover:bg-[#F5F3EE]"
              onClick={() => setCreateOrgOpen(true)}
              type="button"
            >
              <Building2 size={16} /> Create org
            </button>
          ) : null}
        </div>
        {superAdminView ? (
          <button
            className="col-start-2 border-0 bg-transparent text-[#C4642A] p-0 text-right"
            onClick={() =>
              allExpanded
                ? collapseAllOrgs()
                : expandAllOrgs(orgs.map((org) => org.org.id))
            }
            type="button"
          >
            {allExpanded ? "Collapse all" : "Expand all"}
          </button>
        ) : null}
      </header>

      <nav
        className="flex gap-1 border-b border-[#E8E6E1] mb-4"
        aria-label="Team tabs"
      >
        <button
          className={`border-0 bg-transparent px-2.5 py-3 border-b-2 -mb-px ${activeTab === "members" ? "text-[#1A1917] border-b-[#C4642A]" : "text-[#78756E] border-b-transparent"}`}
          onClick={() => setActiveTab("members")}
          type="button"
        >
          Members ({members.length})
        </button>
        <button
          className={`border-0 bg-transparent px-2.5 py-3 border-b-2 -mb-px ${activeTab === "pending" ? "text-[#1A1917] border-b-[#C4642A]" : "text-[#78756E] border-b-transparent"}`}
          onClick={() => setActiveTab("pending")}
          type="button"
        >
          Pending ({invitations.length})
        </button>
      </nav>

      {adminView && activeTab === "members" ? (
        <div className="flex gap-2.5 items-center border border-[#E8E6E1] rounded-lg bg-[#F5F0E6] text-[#6B5B3E] px-4 py-3.5 mb-4">
          <Info size={16} />
          You have view-only access to team membership. Contact a Super Admin to
          request changes.
        </div>
      ) : null}

      {activeTab === "pending" ? (
        <PendingInvitations invitations={invitations} />
      ) : userView ? (
        <UserGrid rows={visibleRows} />
      ) : superAdminView ? (
        <div className="grid gap-3">
          {orgs.map((org) => {
            const rows = rowsByOrg.get(org.org.id) ?? [];
            const expanded = expandedOrgIds.includes(org.org.id);
            const selectedInOrg = rows
              .filter((row) => selectedRowIds.includes(row.id))
              .map((row) => row.id);
            return (
              <section
                className="border border-[#E8E6E1] rounded-lg bg-white shadow-[0_1px_3px_rgba(26,25,23,0.06),0_1px_2px_rgba(26,25,23,0.04)]"
                key={org.org.id}
              >
                <button
                  className="w-full grid grid-cols-[auto_auto_1fr_auto] items-center gap-2.5 border-0 border-b border-[#E8E6E1] bg-white px-4 py-3.5 text-left"
                  onClick={() => toggleOrgExpanded(org.org.id)}
                  type="button"
                >
                  {expanded ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                  <strong>{org.org.name}</strong>
                  <span className="text-[#A8A49C]">{orgStats(rows)}</span>
                  <a
                    className="text-[#78756E] no-underline"
                    onClick={(event) => event.stopPropagation()}
                  >
                    Manage org
                  </a>
                </button>
                <div
                  className={`grid transition-[grid-template-rows] duration-200 ease-out ${expanded ? "[grid-template-rows:1fr]" : "[grid-template-rows:0fr]"}`}
                >
                  <div className="overflow-hidden">
                    <MemberTable
                      orgs={orgs}
                      query={deferredSearch}
                      rows={rows}
                      showCheckboxes
                      sortDirection={sortDirection}
                      sortKey={sortKey}
                      onRemove={(member) =>
                        setModal({ type: "remove", member })
                      }
                      onRole={(member, nextRole) =>
                        setModal({ type: "role", member, nextRole })
                      }
                      onSort={handleSort}
                    />
                    <BulkBar orgId={org.org.id} selectedIds={selectedInOrg} />
                  </div>
                </div>
              </section>
            );
          })}
          {!orgs.length ? (
            <div className="border border-[#E8E6E1] rounded-lg bg-white shadow-[0_1px_3px_rgba(26,25,23,0.06),0_1px_2px_rgba(26,25,23,0.04)]">
              <div className="flex min-h-[120px] flex-col items-center justify-center gap-1.5 text-[#78756E] text-center">
                Organizations will appear when the backend returns team data.
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="border border-[#E8E6E1] rounded-lg bg-white shadow-[0_1px_3px_rgba(26,25,23,0.06),0_1px_2px_rgba(26,25,23,0.04)]">
          <MemberTable
            orgs={orgs}
            query={deferredSearch}
            rows={visibleRows}
            showCheckboxes={false}
            sortDirection={sortDirection}
            sortKey={sortKey}
            onRemove={(member) => setModal({ type: "remove", member })}
            onRole={(member, nextRole) =>
              setModal({ type: "role", member, nextRole })
            }
            onSort={handleSort}
          />
        </div>
      )}

      {memberQuery.isError ? (
        <div className="mt-3.5 border border-[#E8E6E1] rounded-lg bg-white p-3 text-[#B83A2A]">
          Unable to load members yet. The UI is ready for the backend response.
        </div>
      ) : null}
      <InviteModal orgs={orgs} />
      <CreateOrgModal
        onClose={() => setCreateOrgOpen(false)}
        open={createOrgOpen}
      />
      <ConfirmationModal modal={modal} onClose={() => setModal(null)} />
      <DetailDrawer orgs={orgs} />
    </div>
  );
};
