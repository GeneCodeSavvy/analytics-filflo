import type { Message, Thread, ThreadListRow } from "@shared/schema/messages";
import type { UserRef } from "@shared/schema/domain";

export const users = {
  requesterA: {
    id: "usr-101",
    name: "Aarav Mehta",
    email: "aarav@acme.example",
    avatarUrl: "https://i.pravatar.cc/120?img=11",
    role: "USER",
    orgId: "org-acme",
  },
  requesterB: {
    id: "usr-102",
    name: "Nina Kapoor",
    email: "nina@nova.example",
    avatarUrl: "https://i.pravatar.cc/120?img=32",
    role: "USER",
    orgId: "org-nova",
  },
  agentA: {
    id: "usr-201",
    name: "Riya Sen",
    email: "riya@filflo.example",
    avatarUrl: "https://i.pravatar.cc/120?img=45",
    role: "ADMIN",
    orgId: "org-filflo",
  },
  moderatorA: {
    id: "usr-202",
    name: "Kabir Rao",
    email: "kabir@filflo.example",
    avatarUrl: "https://i.pravatar.cc/120?img=52",
    role: "MODERATOR",
    orgId: "org-filflo",
  },
  adminA: {
    id: "usr-203",
    name: "Sarah Chen",
    email: "sarah@filflo.example",
    avatarUrl: "https://i.pravatar.cc/120?img=48",
    role: "SUPER_ADMIN",
    orgId: "org-filflo",
  },
} satisfies Record<string, UserRef>;

export const threads: Thread[] = [
  {
    id: "thr-1001",
    ticket: {
      id: "TCK-1001",
      subject: "Unable to sync vendor invoices",
      status: "IN_PROGRESS",
      priority: "HIGH",
      orgId: "org-acme",
      orgName: "Acme Finance",
    },
    participants: [users.requesterA, users.agentA, users.moderatorA],
    permissions: {
      canSend: true,
      canAddParticipants: false,
      canJoin: false,
    },
  },
  {
    id: "thr-1003",
    ticket: {
      id: "TCK-1003",
      subject: "Exported audit report has stale totals",
      status: "OPEN",
      priority: "LOW",
      orgId: "org-acme",
      orgName: "Acme Finance",
    },
    participants: [users.requesterA, users.agentA],
    permissions: {
      canSend: true,
      canAddParticipants: false,
      canJoin: false,
    },
  },
  {
    id: "thr-1004",
    ticket: {
      id: "TCK-1004",
      subject: "Webhook retry policy clarification",
      status: "RESOLVED",
      priority: "MEDIUM",
      orgId: "org-nova",
      orgName: "Nova Retail",
    },
    participants: [users.requesterB, users.moderatorA],
    permissions: {
      canSend: true,
      canAddParticipants: false,
      canJoin: false,
    },
  },
  {
    id: "thr-1002",
    ticket: {
      id: "TCK-1002",
      subject: "Approval queue shows duplicate items",
      status: "REVIEW",
      priority: "MEDIUM",
      orgId: "org-nova",
      orgName: "Nova Retail",
    },
    participants: [users.requesterB, users.moderatorA],
    permissions: {
      canSend: true,
      canAddParticipants: false,
      canJoin: false,
    },
  },
];

export const messagesByThread: Record<string, Message[]> = {
  "thr-1001": [
    {
      id: "msg-1001-2",
      threadId: "thr-1001",
      kind: "USER_MESSAGE",
      sender: users.requesterA,
      at: "2026-04-29T09:18:00.000Z",
      content:
        "Invoice sync is failing for three vendors after the connector refresh.",
      ticketRefs: ["TCK-1001"],
    },
    {
      id: "msg-1001-3",
      threadId: "thr-1001",
      kind: "FILE_ATTACHMENT",
      sender: users.agentA,
      at: "2026-04-29T10:04:00.000Z",
      content: "Attached the connector job log.",
      file: {
        id: "file-1001-3",
        name: "connector-job-log.txt",
        size: 18432,
        mimeType: "text/plain",
        url: "https://example.com/files/connector-job-log.txt",
      },
    },
  ],
  "thr-1003": [
    {
      id: "msg-1003-1",
      threadId: "thr-1003",
      kind: "USER_MESSAGE",
      sender: users.requesterA,
      at: "2026-05-01T11:15:00.000Z",
      content:
        "Can you confirm whether the stale totals are expected for reports exported before midnight?",
      ticketRefs: ["TCK-1003"],
    },
    {
      id: "msg-1003-2",
      threadId: "thr-1003",
      kind: "FILE_ATTACHMENT",
      sender: users.agentA,
      at: "2026-05-01T11:42:00.000Z",
      content: "Attached the export payload and calculation notes.",
      file: {
        id: "file-1003-2",
        name: "audit-export-sample.csv",
        size: 245760,
        mimeType: "text/csv",
        url: "https://example.com/files/audit-export-sample.csv",
      },
      ticketRefs: ["TCK-1003"],
    },
  ],
  "thr-1004": [
    {
      id: "msg-1004-1",
      threadId: "thr-1004",
      kind: "USER_MESSAGE",
      sender: users.requesterB,
      at: "2026-04-28T15:05:00.000Z",
      content: "We need confirmation that retry windows are per endpoint.",
      ticketRefs: ["TCK-1004"],
    },
  ],
  "thr-1002": [
    {
      id: "msg-1002-1",
      threadId: "thr-1002",
      kind: "USER_MESSAGE",
      sender: users.requesterB,
      at: "2026-04-30T14:35:00.000Z",
      content:
        "Managers are seeing duplicate approval cards after switching teams.",
      ticketRefs: ["TCK-1002"],
    },
  ],
};

export const threadRows: ThreadListRow[] = threads.map((thread) => {
  const threadMessages = messagesByThread[thread.id] ?? [];
  const lastMessage = threadMessages.at(-1);

  return {
    id: thread.id,
    ticket: thread.ticket,
    lastMessage: {
      snippet:
        lastMessage?.content ??
        "No messages in this thread.",
      senderName: lastMessage?.sender.name ?? "System",
      at: lastMessage?.at ?? "2026-05-02T00:00:00.000Z",
    },
    unreadCount: thread.id === "thr-1001" ? 2 : 0,
    participantsPreview: thread.participants.slice(0, 3),
    participantCount: thread.participants.length,
    isUnanswered: thread.id === "thr-1002",
  };
});
