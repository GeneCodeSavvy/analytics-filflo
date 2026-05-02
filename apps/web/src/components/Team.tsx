import { useDeferredValue, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Info,
  Link,
  MoreHorizontal,
  RefreshCw,
  Search,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import type { Invitation, MemberRow, OrgSummary, TeamRole } from "../lib/teamParams";
import {
  useTeamInvitationsQuery,
  useTeamMemberQuery,
  useTeamMembersQuery,
  useTeamOrgsQuery,
} from "../hooks/useTeamsQueries";
import {
  useCancelTeamInvitationMutation,
  useChangeTeamMemberRoleMutation,
  useBulkTeamMembersMutation,
  useInviteTeamMemberMutation,
  useRemoveTeamMemberMutation,
  useResendTeamInvitationMutation,
} from "../hooks/useTeamsMutations";
import { useTeamsStore } from "../stores/useTeamsStore";

type PreviewRole = "SUPER_ADMIN" | "ADMIN" | "MODERATOR" | "USER";
type SortKey = "member" | "role" | "lastActive" | "joined";
type SortDirection = "asc" | "desc";
type ModalState =
  | { type: "role"; member: MemberRow; nextRole: TeamRole }
  | { type: "remove"; member: MemberRow }
  | null;

const roles: TeamRole[] = ["SUPER_ADMIN", "ADMIN", "MODERATOR", "USER"];
const roleLabels: Record<TeamRole, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  MODERATOR: "Moderator",
  USER: "User",
};
const roleRank: Record<TeamRole, number> = {
  SUPER_ADMIN: 0,
  ADMIN: 1,
  MODERATOR: 2,
  USER: 3,
};
const roleDescriptions: Record<TeamRole, string> = {
  SUPER_ADMIN: "Can manage all orgs and roles",
  ADMIN: "Can view org membership and settings",
  MODERATOR: "Can invite users and manage assignments",
  USER: "Can view teammates and work tickets",
};
const roleClass: Record<TeamRole, string> = {
  SUPER_ADMIN: "teams-role-super",
  ADMIN: "teams-role-admin",
  MODERATOR: "teams-role-moderator",
  USER: "teams-role-user",
};
const avatarTints = ["#F0E6D3", "#D6E8E4", "#E8E1D6", "#EEEDEA", "#F5F0E6"];

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function formatMonth(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function relativeTime(value?: string | null) {
  if (!value) return "Never";
  const diffMs = Date.now() - new Date(value).getTime();
  const minutes = Math.max(1, Math.floor(diffMs / 60_000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return `${months} months ago`;
}

function isStale(value?: string | null) {
  if (!value) return true;
  return Date.now() - new Date(value).getTime() > 30 * 24 * 60 * 60 * 1000;
}

function RolePill({ role }: { role: TeamRole }) {
  return <span className={`teams-role-pill ${roleClass[role]}`}>{roleLabels[role]}</span>;
}

function Avatar({ member, size = 32 }: { member: MemberRow; size?: number }) {
  const tint = avatarTints[member.name.length % avatarTints.length];
  return (
    <span
      className="teams-avatar"
      style={{ width: size, height: size, backgroundColor: tint }}
    >
      {member.avatarUrl ? <img src={member.avatarUrl} alt="" /> : initials(member.name)}
    </span>
  );
}

function highlight(text: string, query: string) {
  if (!query.trim()) return text;
  const index = text.toLowerCase().indexOf(query.trim().toLowerCase());
  if (index === -1) return text;
  return (
    <>
      {text.slice(0, index)}
      <mark>{text.slice(index, index + query.length)}</mark>
      {text.slice(index + query.length)}
    </>
  );
}

function orgNameFor(member: MemberRow, orgs: OrgSummary[]) {
  return orgs.find((org) => org.org.id === member.orgId)?.org.name ?? member.orgId;
}

function orgStats(rows: MemberRow[]) {
  const counts = rows.reduce(
    (acc, row) => {
      acc[row.role] += 1;
      return acc;
    },
    { SUPER_ADMIN: 0, ADMIN: 0, MODERATOR: 0, USER: 0 } as Record<TeamRole, number>,
  );
  return `${rows.length} members · ${counts.SUPER_ADMIN} SA · ${counts.ADMIN} Admins · ${counts.MODERATOR} Mods · ${counts.USER} Users`;
}

function sortRows(rows: MemberRow[], key: SortKey, direction: SortDirection) {
  const multiplier = direction === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    let result = 0;
    if (key === "member") result = a.name.localeCompare(b.name);
    if (key === "role") result = roleRank[a.role] - roleRank[b.role] || a.name.localeCompare(b.name);
    if (key === "lastActive") {
      result =
        new Date(a.lastActiveAt ?? 0).getTime() - new Date(b.lastActiveAt ?? 0).getTime();
    }
    if (key === "joined") result = new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
    return result * multiplier;
  });
}

function validRoleOptions(actor: PreviewRole, target: MemberRow) {
  if (actor === "SUPER_ADMIN") return roles.filter((role) => role !== target.role);
  if (actor === "MODERATOR" && target.role === "USER") return ["MODERATOR"] as TeamRole[];
  return [];
}

function canAct(actor: PreviewRole, target: MemberRow) {
  if (actor === "SUPER_ADMIN") return true;
  return actor === "MODERATOR" && target.role === "USER";
}

function ActionMenu({
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
    <div className="teams-menu-wrap">
      <button className="teams-icon-button" onClick={() => setOpen((value) => !value)} type="button">
        <MoreHorizontal size={16} />
      </button>
      {open ? (
        <div className="teams-menu">
          {options.length ? (
            <div className="teams-menu-group">
              <div className="teams-menu-label">Change role</div>
              {options.map((role) => (
                <button key={role} onClick={() => onRole(role)} type="button">
                  <RolePill role={role} />
                </button>
              ))}
            </div>
          ) : null}
          {actorRole === "SUPER_ADMIN" ? <button type="button">Move to org...</button> : null}
          <button onClick={onProfile} type="button">View profile</button>
          <div className="teams-menu-divider" />
          <button className="teams-danger-text" onClick={onRemove} type="button">
            Remove from org
          </button>
        </div>
      ) : null}
    </div>
  );
}

function SortHeader({
  label,
  sortKey,
  active,
  direction,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  active: SortKey;
  direction: SortDirection;
  onSort: (key: SortKey) => void;
}) {
  return (
    <button className="teams-sort-header" onClick={() => onSort(sortKey)} type="button">
      {label}
      <ChevronDown
        size={13}
        className={active === sortKey && direction === "desc" ? "teams-sort-desc" : ""}
      />
    </button>
  );
}

function MemberTable({
  rows,
  orgs,
  actorRole,
  query,
  showCheckboxes,
  sortKey,
  sortDirection,
  onSort,
  onRole,
  onRemove,
}: {
  rows: MemberRow[];
  orgs: OrgSummary[];
  actorRole: PreviewRole;
  query: string;
  showCheckboxes: boolean;
  sortKey: SortKey;
  sortDirection: SortDirection;
  onSort: (key: SortKey) => void;
  onRole: (member: MemberRow, role: TeamRole) => void;
  onRemove: (member: MemberRow) => void;
}) {
  const { selectedRowIds, toggleRowSelected, openMemberDetail } = useTeamsStore();
  const selected = new Set(selectedRowIds);

  return (
    <div className="teams-table-wrap">
      <table className="teams-table">
        <thead>
          <tr>
            {showCheckboxes ? <th className="teams-check-cell" /> : null}
            <th><SortHeader label="Member" sortKey="member" active={sortKey} direction={sortDirection} onSort={onSort} /></th>
            <th><SortHeader label="Role" sortKey="role" active={sortKey} direction={sortDirection} onSort={onSort} /></th>
            <th><SortHeader label="Last Active" sortKey="lastActive" active={sortKey} direction={sortDirection} onSort={onSort} /></th>
            <th><SortHeader label="Joined" sortKey="joined" active={sortKey} direction={sortDirection} onSort={onSort} /></th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((member) => {
            const checked = selected.has(member.id);
            return (
              <tr key={`${member.orgId}-${member.id}`} className={checked ? "teams-row-checked" : ""} tabIndex={0}>
                {showCheckboxes ? (
                  <td className="teams-check-cell">
                    <input
                      aria-label={`Select ${member.name}`}
                      checked={checked}
                      onChange={() => toggleRowSelected(member.id)}
                      type="checkbox"
                    />
                  </td>
                ) : null}
                <td className="teams-member-cell">
                  <Avatar member={member} />
                  <div>
                    <button
                      className="teams-name-link"
                      onClick={() => openMemberDetail(member.id, member.orgId)}
                      type="button"
                    >
                      {highlight(member.name, query)}
                    </button>
                    <div className="teams-muted">{highlight(member.email, query)}</div>
                  </div>
                </td>
                <td><RolePill role={member.role} /></td>
                <td>
                  <span className={isStale(member.lastActiveAt) ? "teams-warning" : ""}>
                    {isStale(member.lastActiveAt) ? <AlertCircle size={14} /> : null}
                    {relativeTime(member.lastActiveAt)}
                  </span>
                </td>
                <td>{formatDate(member.joinedAt)}</td>
                <td>
                  <ActionMenu
                    actorRole={actorRole}
                    member={member}
                    onProfile={() => openMemberDetail(member.id, member.orgId)}
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
        <div className="teams-empty">
          <Users size={20} />
          <span>No members match this view yet.</span>
          <small>{orgs.length ? "Try a different filter." : "Backend team data will appear here when available."}</small>
        </div>
      ) : null}
    </div>
  );
}

function BulkBar({
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
    <div className="teams-bulk-bar">
      <strong>{selectedIds.length} selected</strong>
      <select
        onChange={(event) =>
          bulkMutation.mutate({
            ids: selectedIds,
            orgId,
            op: "change_role",
            payload: { role: event.target.value as TeamRole, orgId },
          })
        }
        defaultValue=""
      >
        <option value="" disabled>Change role</option>
        {roles.map((role) => <option key={role} value={role}>{roleLabels[role]}</option>)}
      </select>
      <button
        className="teams-danger-ghost"
        onClick={() => bulkMutation.mutate({ ids: selectedIds, orgId, op: "remove" })}
        type="button"
      >
        Remove
      </button>
      <button className="teams-text-button" onClick={clearSelection} type="button">Clear selection</button>
    </div>
  );
}

function UserGrid({ rows }: { rows: MemberRow[] }) {
  const openMemberDetail = useTeamsStore((state) => state.openMemberDetail);
  return (
    <div className="teams-user-grid">
      {rows.map((member) => (
        <button
          className="teams-user-card"
          key={`${member.orgId}-${member.id}`}
          onClick={() => openMemberDetail(member.id, member.orgId)}
          type="button"
        >
          <Avatar member={member} size={48} />
          <strong>{member.name}</strong>
          <RolePill role={member.role} />
          <span>Last seen {relativeTime(member.lastActiveAt)}</span>
        </button>
      ))}
      {!rows.length ? <div className="teams-empty teams-grid-empty">No teammates to show yet.</div> : null}
    </div>
  );
}

function InviteModal({ actorRole, orgs }: { actorRole: PreviewRole; orgs: OrgSummary[] }) {
  const { inviteModalOpen, closeInviteModal, inviteDraft, saveInviteDraft } = useTeamsStore();
  const inviteMutation = useInviteTeamMemberMutation();
  const [email, setEmail] = useState(inviteDraft?.email ?? "");
  const [role, setRole] = useState<TeamRole>(inviteDraft?.role ?? "USER");
  const [orgId, setOrgId] = useState(inviteDraft?.orgId ?? orgs[0]?.org.id ?? "");

  useEffect(() => {
    if (inviteModalOpen) setOrgId((current) => current || orgs[0]?.org.id || "");
  }, [inviteModalOpen, orgs]);

  if (!inviteModalOpen) return null;

  const submit = () => {
    saveInviteDraft({ email, role, orgId, message: "" });
    inviteMutation.mutate({ email, role, orgId, message: "" });
  };

  return (
    <div className="teams-backdrop" onMouseDown={closeInviteModal}>
      <div className="teams-modal" onMouseDown={(event) => event.stopPropagation()}>
        <div className="teams-modal-head">
          <h2>Invite a new member</h2>
          <button className="teams-icon-button" onClick={closeInviteModal} type="button"><X size={16} /></button>
        </div>
        <label className="teams-field">
          <span>Email</span>
          <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@company.com" />
        </label>
        <div className="teams-radio-grid">
          {roles.map((option) => (
            <button
              className={option === role ? "teams-role-card teams-role-card-active" : "teams-role-card"}
              key={option}
              onClick={() => setRole(option)}
              type="button"
            >
              <div>
                <strong>{roleLabels[option]}</strong>
                <span>{roleDescriptions[option]}</span>
              </div>
              <RolePill role={option} />
            </button>
          ))}
        </div>
        {actorRole === "SUPER_ADMIN" ? (
          <label className="teams-field">
            <span>Organization</span>
            <select value={orgId} onChange={(event) => setOrgId(event.target.value)}>
              {orgs.map((org) => <option key={org.org.id} value={org.org.id}>{org.org.name}</option>)}
            </select>
          </label>
        ) : null}
        <div className="teams-modal-actions">
          <button className="teams-button-primary" disabled={!email || !orgId} onClick={submit} type="button">Send Invitation</button>
          <button className="teams-button-ghost" onClick={closeInviteModal} type="button">Cancel</button>
        </div>
      </div>
    </div>
  );
}

function ConfirmationModal({ modal, onClose }: { modal: ModalState; onClose: () => void }) {
  const changeRole = useChangeTeamMemberRoleMutation();
  const removeMember = useRemoveTeamMemberMutation();
  const [typed, setTyped] = useState("");
  if (!modal) return null;

  const member = modal.member;
  const confirm = () => {
    if (modal.type === "role") {
      changeRole.mutate({ userId: member.id, payload: { role: modal.nextRole, orgId: member.orgId } });
    } else {
      removeMember.mutate({ userId: member.id, params: { orgId: member.orgId } });
    }
    onClose();
  };

  return (
    <div className="teams-backdrop" onMouseDown={onClose}>
      <div className="teams-modal teams-confirm" onMouseDown={(event) => event.stopPropagation()}>
        {modal.type === "role" ? (
          <>
            <h2>Promote {member.name} from {roleLabels[member.role]} to {roleLabels[modal.nextRole]}?</h2>
            <p>They&apos;ll be able to manage Users and handle ticket assignments in this org.</p>
            <div className="teams-role-transition">
              <RolePill role={member.role} />
              <ArrowRight size={16} />
              <RolePill role={modal.nextRole} />
            </div>
            <div className="teams-modal-actions">
              <button className="teams-button-primary" onClick={confirm} type="button">Confirm</button>
              <button className="teams-button-ghost" onClick={onClose} type="button">Cancel</button>
            </div>
          </>
        ) : (
          <>
            <h2 className="teams-danger-title">Remove {member.name} from org?</h2>
            <p>Their open tickets will be reassigned to you.</p>
            <label className="teams-field">
              <span>Type REMOVE to confirm</span>
              <input value={typed} onChange={(event) => setTyped(event.target.value)} />
            </label>
            <div className="teams-modal-actions">
              <button className="teams-button-danger" disabled={typed !== "REMOVE"} onClick={confirm} type="button">Remove member</button>
              <button className="teams-button-ghost" onClick={onClose} type="button">Cancel</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function DetailDrawer({ orgs, actorRole }: { orgs: OrgSummary[]; actorRole: PreviewRole }) {
  const { detailOpen, selectedMemberId, selectedMemberOrgId, closeMemberDetail } = useTeamsStore();
  const detailQuery = useTeamMemberQuery(selectedMemberId, selectedMemberOrgId ?? undefined);
  const member = detailQuery.data;
  if (!detailOpen) return null;

  return (
    <div className="teams-drawer-backdrop" onMouseDown={closeMemberDetail}>
      <aside className="teams-drawer" onMouseDown={(event) => event.stopPropagation()}>
        <button className="teams-drawer-close teams-icon-button" onClick={closeMemberDetail} type="button"><X size={16} /></button>
        {member ? (
          <>
            <div className="teams-drawer-head">
              <Avatar member={member} size={64} />
              <h2>{member.name}</h2>
              <p>{member.email}</p>
              <RolePill role={member.role} />
              <span>Member since {formatMonth(member.joinedAt)}</span>
            </div>
            <section>
              <h3>Activity</h3>
              <div className="teams-stat-grid">
                <div><span>Tickets Created</span><strong>{member.stats.ticketsCreated}</strong></div>
                <div><span>Tickets Resolved</span><strong>{member.stats.ticketsAssigned}</strong></div>
                <div><span>Avg Response Time</span><strong>{member.stats.avgResolutionMs ? `${(member.stats.avgResolutionMs / 3_600_000).toFixed(1)}h` : "n/a"}</strong></div>
                <div><span>Last Active</span><strong>{relativeTime(member.lastActiveAt)}</strong></div>
              </div>
            </section>
            {actorRole === "SUPER_ADMIN" ? (
              <section>
                <h3>Organizations</h3>
                <div className="teams-org-list">
                  {member.orgMemberships.map((membership) => (
                    <div key={membership.org.id}>
                      <span>{membership.org.name}</span>
                      <RolePill role={membership.role} />
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
            <section>
              <h3>Actions</h3>
              <button className="teams-button-ghost" type="button">Change role</button>
              <button className="teams-danger-ghost" type="button">Remove from org</button>
            </section>
          </>
        ) : (
          <div className="teams-empty">Member details will appear when the backend returns this record.</div>
        )}
        <span className="teams-drawer-org-note">{selectedMemberOrgId ? orgNameFor({ orgId: selectedMemberOrgId } as MemberRow, orgs) : ""}</span>
      </aside>
    </div>
  );
}

function PendingInvitations({ invitations }: { invitations: Invitation[] }) {
  const resend = useResendTeamInvitationMutation();
  const cancel = useCancelTeamInvitationMutation();
  return (
    <div className="teams-card">
      <table className="teams-table">
        <thead>
          <tr>
            <th>Email</th>
            <th>Role</th>
            <th>Invited By</th>
            <th>Sent</th>
            <th>Expires</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {invitations.map((invite) => {
            const expired = invite.status === "expired" || new Date(invite.expiresAt).getTime() < Date.now();
            return (
              <tr key={invite.id} className={expired ? "teams-invite-expired" : ""}>
                <td>{invite.email}</td>
                <td><RolePill role={invite.role} /></td>
                <td>{invite.invitedBy.name}</td>
                <td>{formatDate(invite.sentAt)}</td>
                <td>{expired ? <span className="teams-expired">Expired</span> : formatDate(invite.expiresAt)}</td>
                <td className="teams-pending-actions">
                  <button className="teams-button-ghost" onClick={() => resend.mutate(invite.id)} type="button"><RefreshCw size={14} /> Resend</button>
                  <button className="teams-button-ghost" onClick={() => navigator.clipboard?.writeText(invite.inviteUrl)} type="button"><Link size={14} /> Copy link</button>
                  <button className="teams-danger-ghost" onClick={() => cancel.mutate(invite.id)} type="button">Cancel</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {!invitations.length ? <div className="teams-empty">No pending invitations.</div> : null}
    </div>
  );
}

export const Teams = () => {
  const [actorRole, setActorRole] = useState<PreviewRole>("SUPER_ADMIN");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [roleFilter, setRoleFilter] = useState<TeamRole | "ALL">("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("role");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [activeTab, setActiveTab] = useState<"members" | "pending">("members");
  const [modal, setModal] = useState<ModalState>(null);
  const { expandedOrgIds, expandAllOrgs, collapseAllOrgs, toggleOrgExpanded, selectedRowIds, openInviteModal } = useTeamsStore();
  const memberQuery = useTeamMembersQuery({
    role: roleFilter === "ALL" ? [] : [roleFilter],
    q: deferredSearch,
    page: 1,
    pageSize: 250,
  });
  const orgQuery = useTeamOrgsQuery();
  const invitationQuery = useTeamInvitationsQuery({ status: "pending" });
  const members = memberQuery.data?.rows ?? [];
  const orgs = orgQuery.data ?? [];
  const invitations = invitationQuery.data ?? [];

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setModal(null);
        useTeamsStore.getState().closeInviteModal();
        useTeamsStore.getState().closeMemberDetail();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!expandedOrgIds.length && orgs.length) expandAllOrgs(orgs.map((org) => org.org.id));
  }, [expandedOrgIds.length, expandAllOrgs, orgs]);

  const visibleRows = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    const filtered = members.filter((member) => {
      const roleMatch = roleFilter === "ALL" || member.role === roleFilter;
      const queryMatch =
        !q ||
        member.name.toLowerCase().includes(q) ||
        member.email.toLowerCase().includes(q);
      return roleMatch && queryMatch;
    });
    return sortRows(filtered, sortKey, sortDirection);
  }, [members, deferredSearch, roleFilter, sortDirection, sortKey]);

  const rowsByOrg = useMemo(() => {
    const grouped = new Map<string, MemberRow[]>();
    visibleRows.forEach((row) => grouped.set(row.orgId, [...(grouped.get(row.orgId) ?? []), row]));
    return grouped;
  }, [visibleRows]);

  const handleSort = (key: SortKey) => {
    if (key === sortKey) setSortDirection((direction) => (direction === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const superAdminView = actorRole === "SUPER_ADMIN";
  const moderatorView = actorRole === "MODERATOR";
  const adminView = actorRole === "ADMIN";
  const userView = actorRole === "USER";
  const canInvite = superAdminView || moderatorView;
  const allExpanded = orgs.length > 0 && expandedOrgIds.length >= orgs.length;

  return (
    <div className="teams-page">
      <style>{teamsCss}</style>
      <div className="teams-preview-bar">
        <span>Preview role</span>
        <div className="teams-segmented">
          {roles.map((role) => (
            <button
              className={actorRole === role ? "active" : ""}
              key={role}
              onClick={() => setActorRole(role)}
              type="button"
            >
              {roleLabels[role]}
            </button>
          ))}
        </div>
      </div>
      <header className="teams-header">
        <div>
          <div className="teams-title-row">
            <h1>Teams</h1>
            <span className="teams-count">{memberQuery.data?.total ?? members.length} members</span>
          </div>
          {moderatorView ? <p>{orgs[0]?.org.name ?? "Your organization"}</p> : null}
        </div>
        <div className="teams-tools">
          <label className="teams-search">
            <Search size={16} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search members..." />
          </label>
          <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as TeamRole | "ALL")}>
            <option value="ALL">All roles</option>
            {roles.map((role) => <option key={role} value={role}>{roleLabels[role]}</option>)}
          </select>
          {canInvite ? (
            <button className="teams-button-primary" onClick={() => openInviteModal()} type="button">
              <UserPlus size={16} /> Invite Member
            </button>
          ) : null}
        </div>
        {superAdminView ? (
          <button className="teams-expand-toggle" onClick={() => (allExpanded ? collapseAllOrgs() : expandAllOrgs(orgs.map((org) => org.org.id)))} type="button">
            {allExpanded ? "Collapse all" : "Expand all"}
          </button>
        ) : null}
      </header>

      <nav className="teams-tabs" aria-label="Team tabs">
        <button className={activeTab === "members" ? "active" : ""} onClick={() => setActiveTab("members")} type="button">
          Members ({members.length})
        </button>
        <button className={activeTab === "pending" ? "active" : ""} onClick={() => setActiveTab("pending")} type="button">
          Pending ({invitations.length})
        </button>
      </nav>

      {adminView && activeTab === "members" ? (
        <div className="teams-info-banner">
          <Info size={16} />
          You have view-only access to team membership. Contact a Super Admin to request changes.
        </div>
      ) : null}

      {activeTab === "pending" ? (
        <PendingInvitations invitations={invitations} />
      ) : userView ? (
        <UserGrid rows={visibleRows} />
      ) : superAdminView ? (
        <div className="teams-org-stack">
          {orgs.map((org) => {
            const rows = rowsByOrg.get(org.org.id) ?? [];
            const expanded = expandedOrgIds.includes(org.org.id);
            const selectedInOrg = rows
              .filter((row) => selectedRowIds.includes(row.id))
              .map((row) => row.id);
            return (
              <section className="teams-org-section" key={org.org.id}>
                <button className="teams-org-header" onClick={() => toggleOrgExpanded(org.org.id)} type="button">
                  {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  <strong>{org.org.name}</strong>
                  <span>{orgStats(rows)}</span>
                  <a onClick={(event) => event.stopPropagation()}>Manage org</a>
                </button>
                <div className={expanded ? "teams-collapse expanded" : "teams-collapse"}>
                  <MemberTable
                    actorRole={actorRole}
                    orgs={orgs}
                    query={deferredSearch}
                    rows={rows}
                    showCheckboxes
                    sortDirection={sortDirection}
                    sortKey={sortKey}
                    onRemove={(member) => setModal({ type: "remove", member })}
                    onRole={(member, nextRole) => setModal({ type: "role", member, nextRole })}
                    onSort={handleSort}
                  />
                  <BulkBar orgId={org.org.id} selectedIds={selectedInOrg} />
                </div>
              </section>
            );
          })}
          {!orgs.length ? <div className="teams-card"><div className="teams-empty">Organizations will appear when the backend returns team data.</div></div> : null}
        </div>
      ) : (
        <div className="teams-card">
          <MemberTable
            actorRole={actorRole}
            orgs={orgs}
            query={deferredSearch}
            rows={visibleRows}
            showCheckboxes={false}
            sortDirection={sortDirection}
            sortKey={sortKey}
            onRemove={(member) => setModal({ type: "remove", member })}
            onRole={(member, nextRole) => setModal({ type: "role", member, nextRole })}
            onSort={handleSort}
          />
        </div>
      )}

      {memberQuery.isError ? <div className="teams-error">Unable to load members yet. The UI is ready for the backend response.</div> : null}
      <InviteModal actorRole={actorRole} orgs={orgs} />
      <ConfirmationModal modal={modal} onClose={() => setModal(null)} />
      <DetailDrawer actorRole={actorRole} orgs={orgs} />
    </div>
  );
};

const teamsCss = `
.teams-page{min-height:100%;margin:-2.5rem;padding:0 24px 32px;background:#FAFAF8;color:#1A1917;font-family:"Geist Mono",ui-monospace,monospace;letter-spacing:0;font-size:13px}
.teams-page *{box-sizing:border-box}.teams-page button,.teams-page input,.teams-page select{font:inherit}.teams-page button{cursor:pointer}.teams-preview-bar{position:sticky;top:0;z-index:20;display:flex;align-items:center;justify-content:flex-end;gap:12px;padding:10px 0;border-bottom:1px solid #E8E6E1;background:rgba(250,250,248,.94);backdrop-filter:blur(10px);color:#78756E;font-size:12px}.teams-segmented{display:flex;gap:2px;padding:3px;border:1px solid #E8E6E1;border-radius:7px;background:#fff}.teams-segmented button{border:0;background:transparent;color:#78756E;border-radius:5px;padding:5px 9px}.teams-segmented button.active{background:#F5F0E6;color:#1A1917}
.teams-header{position:sticky;top:43px;z-index:10;display:grid;grid-template-columns:1fr auto;gap:12px;align-items:start;padding:24px 0 16px;background:rgba(250,250,248,.94);backdrop-filter:blur(10px)}.teams-title-row{display:flex;align-items:center;gap:10px}.teams-title-row h1{margin:0;font-size:30px;line-height:1;font-weight:700}.teams-header p{margin:8px 0 0;color:#78756E}.teams-count{border:1px solid #E8E6E1;border-radius:999px;background:#fff;padding:4px 8px;color:#78756E;font-size:12px}.teams-tools{display:flex;gap:8px;align-items:center}.teams-search{width:240px;display:flex;align-items:center;gap:8px;border:1px solid #E8E6E1;border-radius:6px;background:#fff;padding:0 10px;color:#A8A49C}.teams-search input{width:100%;border:0;outline:0;background:transparent;padding:9px 0;color:#1A1917}.teams-page select,.teams-field input,.teams-field select{border:1px solid #E8E6E1;border-radius:6px;background:#fff;color:#1A1917;padding:9px 10px;outline-color:#C4642A}.teams-button-primary,.teams-button-ghost,.teams-danger-ghost,.teams-button-danger,.teams-text-button{display:inline-flex;align-items:center;justify-content:center;gap:7px;border-radius:6px;border:1px solid transparent;padding:9px 12px;transition:background 150ms ease,box-shadow 150ms ease,transform 150ms ease}.teams-button-primary{background:#C4642A;color:#fff}.teams-button-primary:hover{background:#A8521E}.teams-button-primary:disabled,.teams-button-danger:disabled{opacity:.45;cursor:not-allowed}.teams-button-ghost{background:#fff;border-color:#E8E6E1;color:#1A1917}.teams-danger-ghost,.teams-danger-text{background:transparent;color:#B83A2A;border-color:transparent}.teams-button-danger{background:#B83A2A;color:#fff}.teams-text-button{background:transparent;color:#78756E}.teams-expand-toggle{grid-column:2;border:0;background:transparent;color:#C4642A;padding:0;text-align:right}
.teams-tabs{display:flex;gap:4px;border-bottom:1px solid #E8E6E1;margin-bottom:16px}.teams-tabs button{border:0;background:transparent;color:#78756E;padding:12px 10px;border-bottom:2px solid transparent}.teams-tabs button.active{color:#1A1917;border-bottom-color:#C4642A}.teams-info-banner{display:flex;gap:10px;align-items:center;border:1px solid #E8E6E1;border-radius:8px;background:#F5F0E6;color:#6B5B3E;padding:14px 16px;margin-bottom:16px}
.teams-card,.teams-org-section{border:1px solid #E8E6E1;border-radius:8px;background:#fff;box-shadow:0 1px 3px rgba(26,25,23,.06),0 1px 2px rgba(26,25,23,.04)}.teams-org-stack{display:grid;gap:12px}.teams-org-header{width:100%;display:grid;grid-template-columns:auto auto 1fr auto;align-items:center;gap:10px;border:0;border-bottom:1px solid #E8E6E1;background:#fff;padding:14px 16px;text-align:left}.teams-org-header span{color:#A8A49C}.teams-org-header a{color:#78756E;text-decoration:none}.teams-collapse{display:grid;grid-template-rows:0fr;transition:grid-template-rows 200ms ease-out}.teams-collapse.expanded{grid-template-rows:1fr}.teams-collapse>*{overflow:hidden}.teams-table-wrap{position:relative;overflow:auto}.teams-table{width:100%;border-collapse:separate;border-spacing:0}.teams-table th{padding:10px 12px;border-bottom:1px solid #E8E6E1;color:#78756E;font-weight:600;text-align:left;white-space:nowrap}.teams-table td{padding:12px;border-bottom:1px solid #F0EEE9;vertical-align:middle}.teams-table tr{transition:background 150ms ease}.teams-table tbody tr:hover{background:#F5F4F0}.teams-table tbody tr:last-child td{border-bottom:0}.teams-row-checked{background:rgba(196,100,42,.08)!important;box-shadow:inset 3px 0 0 #C4642A}.teams-check-cell{width:38px}.teams-check-cell input{opacity:0;transition:opacity 150ms ease}.teams-table tr:hover .teams-check-cell input,.teams-row-checked .teams-check-cell input{opacity:1}.teams-member-cell{display:flex;align-items:center;gap:10px;min-width:280px}.teams-avatar{display:inline-flex;align-items:center;justify-content:center;flex:0 0 auto;border-radius:999px;color:#1A1917;font-weight:700;font-size:12px;overflow:hidden}.teams-avatar img{width:100%;height:100%;object-fit:cover}.teams-name-link{border:0;background:transparent;padding:0;color:#1A1917;font-weight:500;text-align:left}.teams-name-link:hover{text-decoration:underline}.teams-muted{color:#78756E;font-size:12px}.teams-warning{display:inline-flex;align-items:center;gap:5px;color:#B8860B}.teams-sort-header{display:inline-flex;align-items:center;gap:4px;border:0;background:transparent;color:inherit;padding:0}.teams-sort-header svg{transition:transform 150ms ease}.teams-sort-desc{transform:rotate(180deg)}mark{background:rgba(196,100,42,.16);color:inherit;border-radius:3px;padding:0 2px}
.teams-role-pill{display:inline-flex;align-items:center;border:1px solid;border-radius:999px;padding:2px 8px;font-size:11px;line-height:1.4;white-space:nowrap}.teams-role-super{background:#F0E6D3;color:#8B6914;border-color:#E0D0AE}.teams-role-admin{background:#D6E8E4;color:#2D6355;border-color:#B8D5CE}.teams-role-moderator{background:#E8E1D6;color:#6B5B3E;border-color:#D5CBBA}.teams-role-user{background:#EEEDEA;color:#78756E;border-color:#DDDBD6}.teams-menu-wrap{position:relative;display:inline-flex}.teams-icon-button{display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;border:1px solid #E8E6E1;border-radius:6px;background:#fff;color:#78756E}.teams-menu{position:absolute;right:0;top:34px;z-index:30;min-width:190px;border:1px solid #E8E6E1;border-radius:8px;background:#fff;box-shadow:0 12px 30px rgba(26,25,23,.12);padding:6px;animation:teams-menu-in 150ms ease-out}.teams-menu button{width:100%;display:flex;align-items:center;gap:8px;border:0;border-radius:5px;background:transparent;padding:8px;color:#1A1917;text-align:left}.teams-menu button:hover{background:#F5F4F0}.teams-menu-label{padding:6px 8px;color:#A8A49C;font-size:11px}.teams-menu-divider{height:1px;background:#E8E6E1;margin:4px 0}.teams-bulk-bar{position:sticky;bottom:0;display:flex;align-items:center;gap:10px;padding:12px;border-top:1px solid #E8E6E1;background:#fff;box-shadow:0 -6px 18px rgba(26,25,23,.08);animation:teams-slide-up 180ms ease-out}
.teams-empty{display:flex;min-height:120px;flex-direction:column;align-items:center;justify-content:center;gap:6px;color:#78756E;text-align:center}.teams-empty small{color:#A8A49C}.teams-error{margin-top:14px;border:1px solid #E8E6E1;border-radius:8px;background:#fff;padding:12px;color:#B83A2A}.teams-user-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.teams-user-card{display:flex;min-height:168px;flex-direction:column;align-items:center;justify-content:center;gap:9px;border:1px solid #E8E6E1;border-radius:8px;background:#fff;padding:16px;color:#1A1917;transition:transform 150ms ease,box-shadow 150ms ease}.teams-user-card:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(26,25,23,.09)}.teams-user-card span:last-child{color:#A8A49C;font-size:12px}.teams-grid-empty{grid-column:1/-1;background:#fff;border:1px solid #E8E6E1;border-radius:8px}
.teams-backdrop,.teams-drawer-backdrop{position:fixed;inset:0;z-index:50;background:rgba(26,25,23,.22);backdrop-filter:blur(4px)}.teams-modal{position:absolute;left:50%;top:50%;width:min(480px,calc(100vw - 32px));transform:translate(-50%,-50%);border:1px solid #E8E6E1;border-radius:8px;background:#fff;padding:20px;box-shadow:0 24px 70px rgba(26,25,23,.18);animation:teams-modal-in 200ms ease-out}.teams-modal-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}.teams-modal h2{margin:0;font-size:18px}.teams-modal p{color:#78756E}.teams-field{display:grid;gap:6px;margin:12px 0}.teams-field span{color:#78756E;font-size:12px}.teams-field input,.teams-field select{width:100%}.teams-radio-grid{display:grid;gap:8px}.teams-role-card{display:flex;align-items:center;justify-content:space-between;gap:12px;border:1px solid #E8E6E1;border-radius:8px;background:#fff;padding:12px;text-align:left}.teams-role-card strong,.teams-role-card span{display:block}.teams-role-card span{margin-top:3px;color:#78756E;font-size:12px}.teams-role-card-active{border-color:#C4642A;background:rgba(196,100,42,.08)}.teams-modal-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:16px}.teams-danger-title{color:#B83A2A}.teams-role-transition{display:flex;align-items:center;gap:10px;margin:16px 0}
.teams-drawer{position:absolute;right:0;top:0;width:min(400px,100vw);height:100%;overflow:auto;background:#fff;border-left:1px solid #E8E6E1;padding:24px;box-shadow:-18px 0 40px rgba(26,25,23,.14);animation:teams-drawer-in 250ms ease-out}.teams-drawer-close{position:absolute;right:16px;top:16px}.teams-drawer-head{display:grid;justify-items:start;gap:8px;margin-bottom:24px}.teams-drawer-head h2{margin:4px 0 0}.teams-drawer-head p{margin:0;color:#78756E}.teams-drawer section{border-top:1px solid #E8E6E1;padding-top:18px;margin-top:18px}.teams-drawer h3{margin:0 0 10px;font-size:13px}.teams-stat-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.teams-stat-grid div{border:1px solid #E8E6E1;border-radius:8px;padding:12px}.teams-stat-grid span{display:block;color:#A8A49C;font-size:11px}.teams-stat-grid strong{display:block;margin-top:5px;font-size:18px}.teams-org-list{display:grid;gap:8px}.teams-org-list div{display:flex;align-items:center;justify-content:space-between;border:1px solid #E8E6E1;border-radius:8px;padding:10px}.teams-drawer-org-note{display:block;margin-top:12px;color:#A8A49C}
.teams-pending-actions{display:flex;gap:6px;flex-wrap:wrap}.teams-pending-actions button{padding:7px 9px}.teams-invite-expired td:first-child{text-decoration:line-through;color:#A8A49C}.teams-expired{display:inline-flex;border:1px solid rgba(184,58,42,.25);border-radius:4px;background:rgba(184,58,42,.08);color:#B83A2A;padding:2px 6px}
@keyframes teams-menu-in{from{opacity:0;transform:scale(.96) translateY(-4px)}to{opacity:1;transform:scale(1) translateY(0)}}@keyframes teams-slide-up{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}@keyframes teams-modal-in{from{opacity:0;transform:translate(-50%,-50%) scale(.97)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}@keyframes teams-drawer-in{from{transform:translateX(100%)}to{transform:translateX(0)}}
@media (max-width:900px){.teams-header{grid-template-columns:1fr;top:43px}.teams-tools{flex-wrap:wrap}.teams-search{width:100%}.teams-expand-toggle{grid-column:1;text-align:left}.teams-user-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media (max-width:620px){.teams-page{margin:-1.5rem;padding:0 12px 24px}.teams-preview-bar{justify-content:flex-start;overflow:auto}.teams-segmented button{white-space:nowrap}.teams-user-grid{grid-template-columns:1fr}.teams-table th,.teams-table td{padding:10px 8px}.teams-tools>*{width:100%}.teams-button-primary{width:100%}}
`;
