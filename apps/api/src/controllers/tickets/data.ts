import type { TicketDetail, View } from "@shared/schema/tickets";

export const people = {
  requesterA: {
    id: "usr-101",
    name: "Aarav Mehta",
    avatarUrl: "https://i.pravatar.cc/120?img=11",
    role: "Requester",
    orgId: "org-acme",
  },
  requesterB: {
    id: "usr-102",
    name: "Nina Kapoor",
    avatarUrl: "https://i.pravatar.cc/120?img=32",
    role: "Requester",
    orgId: "org-nova",
  },
  agentA: {
    id: "usr-201",
    name: "Riya Sen",
    avatarUrl: "https://i.pravatar.cc/120?img=45",
    role: "Support Agent",
    orgId: "org-filflo",
  },
  agentB: {
    id: "usr-202",
    name: "Kabir Rao",
    avatarUrl: "https://i.pravatar.cc/120?img=52",
    role: "Moderator",
    orgId: "org-filflo",
  },
};

export const ticketDetails: TicketDetail[] = [
  {
    id: "TCK-1001",
    subject: "Unable to sync vendor invoices",
    descriptionPreview:
      "Invoice sync jobs are failing for three vendors after the latest connector refresh.",
    description:
      "Invoice sync jobs are failing for three vendors after the latest connector refresh. The user can manually upload CSV files, but automated reconciliation is blocked for the finance team.",
    status: "IN_PROGRESS",
    priority: "HIGH",
    category: "Integrations",
    org: { id: "org-acme", name: "Acme Finance" },
    requester: people.requesterA,
    primaryAssignee: people.agentA,
    assigneeCount: 2,
    assigneesPreview: [people.agentA, people.agentB],
    createdAt: "2026-04-29T09:15:00.000Z",
    updatedAt: "2026-05-02T05:20:00.000Z",
    isStale: false,
    unread: true,
    activity: [
      {
        id: "act-1001-1",
        type: "created",
        actor: people.requesterA,
        comment: "Ticket opened from the finance workspace.",
        createdAt: "2026-04-29T09:15:00.000Z",
      },
      {
        id: "act-1001-2",
        type: "assignee_change",
        actor: people.agentB,
        changes: { assignee: { from: "Unassigned", to: "Riya Sen" } },
        createdAt: "2026-04-29T10:02:00.000Z",
      },
    ],
  },
  {
    id: "TCK-1002",
    subject: "Approval queue shows duplicate items",
    descriptionPreview:
      "Managers are seeing duplicate approval cards after switching teams.",
    description:
      "Managers are seeing duplicate approval cards after switching teams. Refreshing clears the issue temporarily, but duplicates return after the next notification poll.",
    status: "REVIEW",
    priority: "MEDIUM",
    category: "Workflow",
    org: { id: "org-nova", name: "Nova Retail" },
    requester: people.requesterB,
    primaryAssignee: people.agentB,
    assigneeCount: 1,
    assigneesPreview: [people.agentB],
    createdAt: "2026-04-30T14:35:00.000Z",
    updatedAt: "2026-05-01T17:10:00.000Z",
    isStale: false,
    unread: false,
    activity: [
      {
        id: "act-1002-1",
        type: "created",
        actor: people.requesterB,
        comment: "Duplicates appear after team context changes.",
        createdAt: "2026-04-30T14:35:00.000Z",
      },
      {
        id: "act-1002-2",
        type: "status_change",
        actor: people.agentB,
        changes: { status: { from: "IN_PROGRESS", to: "REVIEW" } },
        createdAt: "2026-05-01T17:10:00.000Z",
      },
    ],
  },
  {
    id: "TCK-1003",
    subject: "Exported audit report missing comments",
    descriptionPreview:
      "CSV export includes status changes but omits reviewer comments.",
    description:
      "CSV export includes status changes but omits reviewer comments. Compliance needs the full audit trail for the month-end review packet.",
    status: "OPEN",
    priority: "LOW",
    category: "Reports",
    org: { id: "org-acme", name: "Acme Finance" },
    requester: people.requesterA,
    assigneeCount: 0,
    assigneesPreview: [],
    createdAt: "2026-05-01T07:45:00.000Z",
    updatedAt: "2026-05-01T08:12:00.000Z",
    isStale: true,
    unread: true,
    activity: [
      {
        id: "act-1003-1",
        type: "created",
        actor: people.requesterA,
        comment: "Report export requested from audit settings.",
        createdAt: "2026-05-01T07:45:00.000Z",
      },
    ],
  },
];

export const views: View[] = [
  {
    id: "view-open",
    name: "Open tickets",
    scope: "builtin",
    role: "all",
    filters: { status: ["OPEN", "IN_PROGRESS", "ON_HOLD", "REVIEW"] },
    sort: [{ field: "updatedAt", dir: "desc" }],
    columns: ["subject", "status", "priority", "assignee", "updatedAt"],
  },
  {
    id: "view-my-high-priority",
    name: "My high priority",
    scope: "user",
    ownerId: "usr-201",
    filters: { priority: ["HIGH"], assigneeIds: ["usr-201"] },
    sort: [{ field: "createdAt", dir: "desc" }],
    groupBy: "status",
  },
];
