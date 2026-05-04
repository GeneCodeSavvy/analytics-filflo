import { TeamRoleSchema } from "../types/teams";
import type {
  MemberRow,
  OrgSummary,
  TeamMemberListItem,
  TeamRole,
} from "../types/teams";
import type {
  HighlightPart,
  InvitationExpiryInput,
  RoleFilter,
  SortDirection,
  SortKey,
} from "../types/teams";

export const roles = TeamRoleSchema.options;

export const roleLabels: Record<TeamRole, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  MODERATOR: "Moderator",
  USER: "User",
};

export const roleRank: Record<TeamRole, number> = {
  SUPER_ADMIN: 0,
  ADMIN: 1,
  MODERATOR: 2,
  USER: 3,
};

export const roleDescriptions: Record<TeamRole, string> = {
  SUPER_ADMIN: "Can manage all orgs and roles",
  ADMIN: "Can view org membership and settings",
  MODERATOR: "Can invite users and manage assignments",
  USER: "Can view teammates and work tickets",
};

export const roleClass: Record<TeamRole, string> = {
  SUPER_ADMIN:
    "bg-[--role-super-admin-bg] text-[--role-super-admin-fg] border-[--role-super-admin-border]",
  ADMIN: "bg-[--role-admin-bg] text-[--role-admin-fg] border-[--role-admin-border]",
  MODERATOR:
    "bg-[--role-moderator-bg] text-[--role-moderator-fg] border-[--role-moderator-border]",
  USER: "bg-[--role-user-bg] text-[--role-user-fg] border-[--role-user-border]",
};

export const avatarTints = [
  "#F0E6D3",
  "#D6E8E4",
  "#E8E1D6",
  "#EEEDEA",
  "#F5F0E6",
];

export function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

export function formatMonth(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function getHighlightedTextParts(
  text: string,
  query: string,
): HighlightPart[] {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return [{ text, highlighted: false }];
  }

  const index = text.toLowerCase().indexOf(normalizedQuery.toLowerCase());

  if (index === -1) {
    return [{ text, highlighted: false }];
  }

  return [
    { text: text.slice(0, index), highlighted: false },
    {
      text: text.slice(index, index + normalizedQuery.length),
      highlighted: true,
    },
    { text: text.slice(index + normalizedQuery.length), highlighted: false },
  ].filter((part) => part.text.length > 0);
}

export function orgNameFor(orgId: string, orgs: OrgSummary[]) {
  return orgs.find((org) => org.org.id === orgId)?.org.name ?? orgId;
}

export function orgStats(rows: MemberRow[]) {
  const counts = rows.reduce(
    (acc, row) => {
      acc[row.role] += 1;
      return acc;
    },
    { SUPER_ADMIN: 0, ADMIN: 0, MODERATOR: 0, USER: 0 } as Record<
      TeamRole,
      number
    >,
  );

  return `${rows.length} members · ${counts.SUPER_ADMIN} SA · ${counts.ADMIN} Admins · ${counts.MODERATOR} Mods · ${counts.USER} Users`;
}

export function sortRows(
  rows: TeamMemberListItem[],
  key: SortKey,
  direction: SortDirection,
) {
  const multiplier = direction === "asc" ? 1 : -1;

  return [...rows].sort((a, b) => {
    let result = 0;

    if (key === "member") result = a.name.localeCompare(b.name);
    if (key === "role") {
      result =
        roleRank[a.role] - roleRank[b.role] || a.name.localeCompare(b.name);
    }
    if (key === "joined") {
      result = new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
    }

    return result * multiplier;
  });
}

export function validRoleOptions(actor: TeamRole, target: MemberRow) {
  if (actor === "SUPER_ADMIN") {
    return roles.filter((role) => role !== target.role);
  }

  if (actor === "MODERATOR" && target.role === "USER") {
    return ["MODERATOR"] as TeamRole[];
  }

  return [];
}

export function canAct(actor: TeamRole, target: MemberRow) {
  if (actor === "SUPER_ADMIN") return true;

  return actor === "MODERATOR" && target.role === "USER";
}

export function filterTeamRows(
  members: TeamMemberListItem[],
  query: string,
  roleFilter: RoleFilter,
) {
  const normalizedQuery = query.trim().toLowerCase();

  return members.filter((member) => {
    const roleMatch = roleFilter === "ALL" || member.role === roleFilter;
    const queryMatch =
      !normalizedQuery ||
      member.name.toLowerCase().includes(normalizedQuery) ||
      member.email.toLowerCase().includes(normalizedQuery);

    return roleMatch && queryMatch;
  });
}

export function groupRowsByOrg(rows: TeamMemberListItem[]) {
  const grouped = new Map<string, TeamMemberListItem[]>();

  rows.forEach((row) => {
    grouped.set(row.org.id, [...(grouped.get(row.org.id) ?? []), row]);
  });

  return grouped;
}

export function nextSortState(
  selectedKey: SortKey,
  currentKey: SortKey,
  currentDirection: SortDirection,
) {
  if (selectedKey !== currentKey) {
    return { sortKey: selectedKey, sortDirection: "asc" as SortDirection };
  }

  return {
    sortKey: currentKey,
    sortDirection:
      currentDirection === "asc"
        ? ("desc" as SortDirection)
        : ("asc" as SortDirection),
  };
}

export function isInvitationExpired(invite: InvitationExpiryInput) {
  if (!invite.expiresAt) return false;

  return (
    invite.status === "EXPIRED" ||
    new Date(invite.expiresAt).getTime() < Date.now()
  );
}
