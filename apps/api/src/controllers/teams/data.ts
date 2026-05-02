import type {
  AuditEntry,
  Invitation,
  MemberDetail,
  OrgSummary,
} from "@shared/schema/teams";

const filfloAdmin = {
  id: "usr-900",
  name: "Meera Iyer",
};

export const members: MemberDetail[] = [
  {
    id: "usr-201",
    name: "Riya Sen",
    email: "riya@filflo.example",
    avatarUrl: "https://i.pravatar.cc/120?img=45",
    role: "ADMIN",
    orgId: "org-filflo",
    joinedAt: "2025-11-18T10:15:00.000Z",
    lastActiveAt: "2026-05-02T08:45:00.000Z",
    isInactive: false,
    permissions: {
      canChangeRole: true,
      canRemove: false,
      canMoveTo: true,
    },
    orgMemberships: [
      {
        org: { id: "org-filflo", name: "Filflo Support" },
        role: "ADMIN",
        joinedAt: "2025-11-18T10:15:00.000Z",
      },
    ],
    stats: {
      ticketsCreated: 18,
      ticketsAssigned: 142,
      avgResolutionMs: 16200000,
    },
  },
  {
    id: "usr-202",
    name: "Kabir Rao",
    email: "kabir@filflo.example",
    avatarUrl: "https://i.pravatar.cc/120?img=52",
    role: "MODERATOR",
    orgId: "org-filflo",
    joinedAt: "2026-01-08T09:00:00.000Z",
    lastActiveAt: "2026-05-01T17:25:00.000Z",
    isInactive: false,
    permissions: {
      canChangeRole: true,
      canRemove: true,
      canMoveTo: true,
    },
    orgMemberships: [
      {
        org: { id: "org-filflo", name: "Filflo Support" },
        role: "MODERATOR",
        joinedAt: "2026-01-08T09:00:00.000Z",
      },
      {
        org: { id: "org-acme", name: "Acme Finance" },
        role: "MODERATOR",
        joinedAt: "2026-02-20T12:30:00.000Z",
      },
    ],
    stats: {
      ticketsCreated: 7,
      ticketsAssigned: 86,
      avgResolutionMs: 21100000,
    },
  },
  {
    id: "usr-301",
    name: "Anika Shah",
    email: "anika@acme.example",
    avatarUrl: "https://i.pravatar.cc/120?img=21",
    role: "USER",
    orgId: "org-acme",
    joinedAt: "2026-03-04T14:20:00.000Z",
    lastActiveAt: "2026-04-28T11:05:00.000Z",
    isInactive: false,
    permissions: {
      canChangeRole: true,
      canRemove: true,
      canMoveTo: true,
    },
    orgMemberships: [
      {
        org: { id: "org-acme", name: "Acme Finance" },
        role: "USER",
        joinedAt: "2026-03-04T14:20:00.000Z",
      },
    ],
    stats: {
      ticketsCreated: 23,
      ticketsAssigned: 0,
      avgResolutionMs: null,
    },
  },
  {
    id: "usr-302",
    name: "Dev Malhotra",
    email: "dev@nova.example",
    role: "USER",
    orgId: "org-nova",
    joinedAt: "2026-02-12T08:40:00.000Z",
    lastActiveAt: null,
    isInactive: true,
    permissions: {
      canChangeRole: true,
      canRemove: true,
      canMoveTo: true,
    },
    orgMemberships: [
      {
        org: { id: "org-nova", name: "Nova Retail" },
        role: "USER",
        joinedAt: "2026-02-12T08:40:00.000Z",
      },
    ],
    stats: {
      ticketsCreated: 5,
      ticketsAssigned: 0,
      avgResolutionMs: null,
    },
  },
];

export const invitations: Invitation[] = [
  {
    id: "inv-1001",
    email: "samira@acme.example",
    role: "USER",
    orgId: "org-acme",
    orgName: "Acme Finance",
    invitedBy: filfloAdmin,
    sentAt: "2026-05-01T09:15:00.000Z",
    expiresAt: "2026-05-08T09:15:00.000Z",
    status: "pending",
    inviteUrl: "https://app.filflo.example/invitations/inv-1001",
  },
  {
    id: "inv-1002",
    email: "opslead@nova.example",
    role: "MODERATOR",
    orgId: "org-nova",
    orgName: "Nova Retail",
    invitedBy: filfloAdmin,
    sentAt: "2026-04-29T16:20:00.000Z",
    expiresAt: "2026-05-06T16:20:00.000Z",
    status: "accepted",
    inviteUrl: "https://app.filflo.example/invitations/inv-1002",
  },
];

export const auditEntries: AuditEntry[] = [
  {
    id: "aud-1001",
    at: "2026-05-01T09:15:00.000Z",
    actor: filfloAdmin,
    action: "invited",
    targetUser: { id: "invitee-samira", name: "samira@acme.example" },
    org: { id: "org-acme", name: "Acme Finance" },
    toRole: "USER",
    reason: "Finance operations rollout",
  },
  {
    id: "aud-1002",
    at: "2026-04-30T13:30:00.000Z",
    actor: filfloAdmin,
    action: "role_changed",
    targetUser: { id: "usr-202", name: "Kabir Rao" },
    org: { id: "org-filflo", name: "Filflo Support" },
    fromRole: "USER",
    toRole: "MODERATOR",
    reason: "Expanded queue ownership",
  },
  {
    id: "aud-1003",
    at: "2026-04-28T10:05:00.000Z",
    actor: filfloAdmin,
    action: "removed",
    targetUser: { id: "usr-399", name: "Former Contractor" },
    org: { id: "org-nova", name: "Nova Retail" },
    fromRole: "USER",
  },
];

export const orgSummaries: OrgSummary[] = [
  {
    org: { id: "org-filflo", name: "Filflo Support" },
    memberCount: 12,
    adminCount: 2,
    openTickets: 31,
    staleTickets: 4,
    lastActivityAt: "2026-05-02T08:45:00.000Z",
  },
  {
    org: { id: "org-acme", name: "Acme Finance" },
    memberCount: 8,
    adminCount: 1,
    openTickets: 14,
    staleTickets: 2,
    lastActivityAt: "2026-05-01T15:10:00.000Z",
  },
  {
    org: { id: "org-nova", name: "Nova Retail" },
    memberCount: 6,
    adminCount: 1,
    openTickets: 9,
    staleTickets: 1,
    lastActivityAt: "2026-04-30T18:40:00.000Z",
  },
];
