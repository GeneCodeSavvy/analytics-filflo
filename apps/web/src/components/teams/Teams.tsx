import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
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
  TeamRole,
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
import { InviteModal } from "./InviteModal";
import { ConfirmationModal } from "./ConfirmationModal";
import { DetailDrawer } from "./DetailDrawer";
import { PendingInvitations } from "./PendingInvitations";
import { useAuthState } from "@/stores/useAuthStore";
import { PageLoader } from "@/components/PageLoader";
import { CreateOrgModal } from "./CreateOrgModal";

const pageShell =
  "app-page-frame bg-[--surface-page] font-mono text-[13px] text-[--ink-1] tracking-0 [&_*]:box-border [&_button]:cursor-pointer";
const contentShell = "app-page-frame-content min-h-full";
const controlClass =
  "h-9 rounded-[--radius-sm] border border-[--border-default] bg-[--surface-card] px-3 text-[13px] text-[--ink-1] outline-none transition-colors focus:border-[--border-focus]";
const secondaryButton =
  "inline-flex h-9 items-center justify-center gap-2 rounded-[--radius-sm] border border-[--border-default] bg-[--surface-card] px-3 text-[13px] font-medium text-[--ink-1] transition-colors hover:bg-[--surface-sunken]";
const primaryButton =
  "inline-flex h-9 items-center justify-center gap-2 rounded-[--radius-sm] border border-transparent bg-[--action-bg] px-3 text-[13px] font-medium text-[--action-fg] transition-colors hover:bg-[--action-bg-hover]";
const cardClass =
  "rounded-[--radius-md] border border-[--border-default] bg-[--surface-card] shadow-[--elev-1]";

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

  const initializedRef = useRef(false);
  useEffect(() => {
    if (!initializedRef.current && orgs.length) {
      initializedRef.current = true;
      expandAllOrgs(orgs.map((org) => org.org.id));
    }
  }, [orgs, expandAllOrgs]);

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
  const orgGroupedView = superAdminView || adminView;
  const canInvite = superAdminView || moderatorView;
  const canModifyMembers = superAdminView || moderatorView;
  const canManageInvitations = superAdminView || moderatorView;
  const canCreateOrg = superAdminView;
  const visibleRoleFilters = useMemo<TeamRole[]>(
    () =>
      orgGroupedView
        ? roles
        : roles.filter((role) => role === "MODERATOR" || role === "USER"),
    [orgGroupedView],
  );
  const allExpanded = orgs.length > 0 && expandedOrgIds.length >= orgs.length;

  useEffect(() => {
    if (roleFilter !== "ALL" && !visibleRoleFilters.includes(roleFilter)) {
      setRoleFilter("ALL");
    }
  }, [roleFilter, visibleRoleFilters]);

  return (
    <div className={pageShell}>
      <div className={contentShell}>
        <header className="sticky top-0 z-[--z-overlay] grid min-h-16 grid-cols-[1fr_auto] items-center gap-4 border-b border-[--border-default] bg-background py-3 shadow-sm">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="m-0 text-[30px] leading-none font-bold text-[--ink-1]">
                {superAdminView || adminView ? "Teams" : "Team"}
              </h1>
            </div>
            {moderatorView ? (
              <p className="mt-2 mb-0 text-[--ink-3]">
                {orgs[0]?.org.name ?? "Your organization"}
              </p>
            ) : null}
          </div>
          <div className="flex gap-2 items-center">
            <label className="flex h-9 w-72 items-center gap-2 rounded-[--radius-sm] border border-[--border-default] bg-[--surface-card] px-2.5 text-[--ink-4]">
              <Search size={16} />
              <input
                className="w-full border-0 bg-transparent py-2 text-[--ink-1] outline-none placeholder:text-[--ink-4]"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search members..."
              />
            </label>
            <select
              className={controlClass}
              value={roleFilter}
              onChange={(event) =>
                setRoleFilter(event.target.value as RoleFilter)
              }
            >
              <option value="ALL">All roles</option>
              {visibleRoleFilters.map((role) => (
                <option key={role} value={role}>
                  {roleLabels[role]}
                </option>
              ))}
            </select>
            {canInvite ? (
              <button
                className={primaryButton}
                onClick={() => openInviteModal()}
                type="button"
              >
                <UserPlus size={16} /> Invite Member
              </button>
            ) : null}
            {canCreateOrg ? (
              <button
                className={secondaryButton}
                onClick={() => setCreateOrgOpen(true)}
                type="button"
              >
                <Building2 size={16} /> Create org
              </button>
            ) : null}
          </div>
          {orgGroupedView ? (
            <button
              className="col-start-2 border-0 bg-transparent p-0 text-right text-[--action-tint-fg]"
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
          className="mb-4 flex gap-1 border-b border-[--border-default]"
          aria-label="Team tabs"
        >
          <button
            className={`-mb-px border-0 border-b-2 bg-transparent px-2.5 py-3 ${activeTab === "members" ? "border-b-[--action-bg] text-[--ink-1]" : "border-b-transparent text-[--ink-3]"}`}
            onClick={() => setActiveTab("members")}
            type="button"
          >
            Members ({members.length})
          </button>
          <button
            className={`-mb-px border-0 border-b-2 bg-transparent px-2.5 py-3 ${activeTab === "pending" ? "border-b-[--action-bg] text-[--ink-1]" : "border-b-transparent text-[--ink-3]"}`}
            onClick={() => setActiveTab("pending")}
            type="button"
          >
            Pending ({invitations.length})
          </button>
        </nav>

        {(adminView || userView) && activeTab === "members" ? (
          <div className="mb-4 flex items-center gap-2.5 rounded-[--radius-md] border border-[--status-warn-border] bg-[--status-warn-bg] px-4 py-3 text-[--status-warn-fg]">
            <Info size={16} />
            You have view-only access to team membership.
          </div>
        ) : null}

        {activeTab === "pending" ? (
          <PendingInvitations
            invitations={invitations}
            showActions={canManageInvitations}
          />
        ) : orgGroupedView ? (
          <div className="grid gap-3">
            {orgs.map((org) => {
              const rows = rowsByOrg.get(org.org.id) ?? [];
              const expanded = expandedOrgIds.includes(org.org.id);
              const selectedInOrg = rows
                .filter((row) => selectedRowIds.includes(row.id))
                .map((row) => row.id);
              return (
                <section className={cardClass} key={org.org.id}>
                  <button
                    className="grid w-full grid-cols-[auto_auto_1fr_auto] items-center gap-2.5 border-0 border-b border-[--border-default] bg-[--surface-card] px-4 py-3 text-left"
                    onClick={() => toggleOrgExpanded(org.org.id)}
                    type="button"
                  >
                    {expanded ? (
                      <ChevronDown size={16} />
                    ) : (
                      <ChevronRight size={16} />
                    )}
                    <strong>{org.org.name}</strong>
                    <span className="text-[--ink-4]">{orgStats(rows)}</span>
                  </button>
                  <div
                    className={`grid transition-[grid-template-rows] duration-200 ease-out ${expanded ? "[grid-template-rows:1fr]" : "[grid-template-rows:0fr]"}`}
                  >
                    <div className="overflow-hidden">
                      <MemberTable
                        orgs={orgs}
                        query={deferredSearch}
                        rows={rows}
                        showCheckboxes={canModifyMembers}
                        showActions={canModifyMembers}
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
                      {canModifyMembers ? (
                        <BulkBar
                          orgId={org.org.id}
                          selectedIds={selectedInOrg}
                        />
                      ) : null}
                    </div>
                  </div>
                </section>
              );
            })}
            {!orgs.length ? (
              <div className={cardClass}>
                <PageLoader inline />
              </div>
            ) : null}
          </div>
        ) : (
          <div className={cardClass}>
            <MemberTable
              orgs={orgs}
              query={deferredSearch}
              rows={visibleRows}
              showCheckboxes={canModifyMembers}
              showActions={canModifyMembers}
              sortDirection={sortDirection}
              sortKey={sortKey}
              onRemove={(member) => setModal({ type: "remove", member })}
              onRole={(member, nextRole) =>
                setModal({ type: "role", member, nextRole })
              }
              onSort={handleSort}
            />
            {canModifyMembers && orgs[0] ? (
              <BulkBar
                orgId={orgs[0].org.id}
                selectedIds={visibleRows
                  .filter((r) => selectedRowIds.includes(r.id))
                  .map((r) => r.id)}
              />
            ) : null}
          </div>
        )}

        {memberQuery.isError ? (
          <div className="mt-3.5 rounded-[--radius-md] border border-[--status-danger-border] bg-[--status-danger-bg] p-3 text-[--status-danger-fg]">
            Unable to load members yet. The UI is ready for the backend
            response.
          </div>
        ) : null}
        <InviteModal orgs={orgs} />
        <CreateOrgModal
          onClose={() => setCreateOrgOpen(false)}
          open={createOrgOpen}
        />
        <ConfirmationModal modal={modal} onClose={() => setModal(null)} />
        <DetailDrawer />
      </div>
    </div>
  );
};
