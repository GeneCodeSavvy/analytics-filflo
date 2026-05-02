import type { Message, Thread, ThreadListRow } from "@shared/schema/messages";
import type { UserRef } from "@shared/schema/user";

export const users = {
  requesterA: {
    id: "usr-101",
    name: "Aarav Mehta",
    email: "aarav@acme.example",
    avatarUrl: "https://i.pravatar.cc/120?img=11",
    role: "Requester",
    orgId: "org-acme",
  },
  requesterB: {
    id: "usr-102",
    name: "Nina Kapoor",
    email: "nina@nova.example",
    avatarUrl: "https://i.pravatar.cc/120?img=32",
    role: "Requester",
    orgId: "org-nova",
  },
  agentA: {
    id: "usr-201",
    name: "Riya Sen",
    email: "riya@filflo.example",
    avatarUrl: "https://i.pravatar.cc/120?img=45",
    role: "Support Agent",
    orgId: "org-filflo",
  },
  moderatorA: {
    id: "usr-202",
    name: "Kabir Rao",
    email: "kabir@filflo.example",
    avatarUrl: "https://i.pravatar.cc/120?img=52",
    role: "Moderator",
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
      canAddParticipants: true,
      canJoin: false,
      canMute: true,
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
      canAddParticipants: true,
      canJoin: true,
      canMute: true,
    },
  },
];

export const messagesByThread: Record<string, Message[]> = {
  "thr-1001": [
    {
      id: "msg-1001-1",
      threadId: "thr-1001",
      kind: "system_event",
      sender: users.requesterA,
      at: "2026-04-29T09:15:00.000Z",
      eventKind: "ticket_created",
      eventDescription: "Ticket TCK-1001 was created.",
      ticketRefs: ["TCK-1001"],
    },
    {
      id: "msg-1001-2",
      threadId: "thr-1001",
      kind: "user_message",
      sender: users.requesterA,
      at: "2026-04-29T09:18:00.000Z",
      content:
        "Invoice sync is failing for three vendors after the connector refresh.",
      mentions: [users.agentA],
      ticketRefs: ["TCK-1001"],
    },
    {
      id: "msg-1001-3",
      threadId: "thr-1001",
      kind: "file_attachment",
      sender: users.agentA,
      at: "2026-04-29T10:04:00.000Z",
      content: "Attached the connector job log.",
      file: {
        name: "connector-job-log.txt",
        size: 18432,
        mimeType: "text/plain",
        url: "https://example.com/files/connector-job-log.txt",
      },
    },
  ],
  "thr-1002": [
    {
      id: "msg-1002-1",
      threadId: "thr-1002",
      kind: "user_message",
      sender: users.requesterB,
      at: "2026-04-30T14:35:00.000Z",
      content:
        "Managers are seeing duplicate approval cards after switching teams.",
      ticketRefs: ["TCK-1002"],
    },
    {
      id: "msg-1002-2",
      threadId: "thr-1002",
      kind: "system_event",
      sender: users.moderatorA,
      at: "2026-05-01T17:10:00.000Z",
      eventKind: "status_change",
      eventDescription: "Status changed from IN_PROGRESS to REVIEW.",
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
        lastMessage?.eventDescription ??
        "No messages in this thread.",
      senderName: lastMessage?.sender.name ?? "System",
      at: lastMessage?.at ?? "2026-05-02T00:00:00.000Z",
      isSystemEvent: lastMessage?.kind === "system_event",
    },
    unreadCount: thread.id === "thr-1001" ? 2 : 0,
    participantsPreview: thread.participants.slice(0, 3),
    participantCount: thread.participants.length,
    isUnanswered: thread.id === "thr-1002",
    isMuted: false,
  };
});
