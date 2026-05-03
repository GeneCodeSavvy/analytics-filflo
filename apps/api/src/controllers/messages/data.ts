import {
  MessageKind,
  Prisma,
  TicketParticipantRole,
  UserRole,
} from "@prisma/client";
import type {
  Message,
  MessageFilters,
  MessagePageParams,
  MessagesPage,
  SendMessagePayload,
  Thread,
  ThreadList,
  ThreadListRow,
} from "@shared/schema/messages";
import type { UserRef } from "@shared/schema/domain";
import type { DbClient } from "../../lib/db";
import { buildThreadWhere } from "./utils";

const currentUserRoles: UserRole[] = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.MODERATOR,
];

const threadInclude = {
  ticket: {
    include: {
      org: true,
      participants: {
        include: {
          user: true,
        },
        orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
      },
    },
  },
} satisfies Prisma.ThreadInclude;

const messageInclude = {
  sender: true,
  ticketRefs: {
    include: {
      ticket: true,
    },
  },
  files: {
    include: {
      file: true,
    },
  },
} satisfies Prisma.MessageInclude;

type ThreadWithRelations = Prisma.ThreadGetPayload<{
  include: typeof threadInclude;
}>;

type MessageWithRelations = Prisma.MessageGetPayload<{
  include: typeof messageInclude;
}>;

const toUserRef = (user: {
  id: string;
  displayName: string;
  email?: string;
  avatarUrl?: string | null;
  role: UserRole;
  orgId: string;
}): UserRef => ({
  id: user.id,
  name: user.displayName,
  email: user.email,
  ...(user.avatarUrl ? { avatarUrl: user.avatarUrl } : {}),
  role: user.role,
  orgId: user.orgId,
});

const toThread = (thread: ThreadWithRelations): Thread => ({
  id: thread.id,
  ticket: {
    id: thread.ticket.id,
    subject: thread.ticket.subject,
    status: thread.ticket.status,
    priority: thread.ticket.priority,
    category: thread.ticket.category,
    orgId: thread.ticket.orgId,
    orgName: thread.ticket.org.displayName,
  },
  participants: thread.ticket.participants.map((participant) =>
    toUserRef(participant.user),
  ),
  permissions: {
    canSend: true,
    canAddParticipants: false,
    canJoin: false,
  },
});

const toMessage = (message: MessageWithRelations): Message => {
  const firstFile = message.files[0]?.file;

  return {
    id: message.id,
    threadId: message.threadId,
    kind: message.kind,
    sender: toUserRef(message.sender),
    at: message.createdAt.toISOString(),
    ...(message.content ? { content: message.content } : {}),
    ...(message.ticketRefs.length
      ? { ticketRefs: message.ticketRefs.map((ref) => ref.ticketId) }
      : {}),
    ...(firstFile
      ? {
          file: {
            id: firstFile.id,
            name: firstFile.name,
            size: firstFile.size,
            mimeType: firstFile.mimeType,
            url: firstFile.url,
            ...(firstFile.thumbnailUrl
              ? { thumbnailUrl: firstFile.thumbnailUrl }
              : {}),
          },
        }
      : {}),
  };
};

const getCurrentUser = async (db: DbClient) => {
  return db.user.findFirst({
    where: { role: { in: currentUserRoles } },
    orderBy: { createdAt: "asc" },
  });
};

const getUnreadCount = async (
  db: DbClient,
  threadId: string,
  userId?: string,
) => {
  if (!userId) {
    return 0;
  }

  const readState = await db.messageReadState.findUnique({
    where: { threadId_userId: { threadId, userId } },
    select: { lastReadAt: true },
  });

  return db.message.count({
    where: {
      threadId,
      deletedAt: null,
      ...(readState?.lastReadAt
        ? { createdAt: { gt: readState.lastReadAt } }
        : {}),
    },
  });
};

const getThreadRow = async (
  db: DbClient,
  thread: ThreadWithRelations,
  currentUserId?: string,
): Promise<ThreadListRow> => {
  const lastMessage = await db.message.findFirst({
    where: { threadId: thread.id, deletedAt: null },
    include: { sender: true },
    orderBy: { createdAt: "desc" },
  });
  const unreadCount = await getUnreadCount(db, thread.id, currentUserId);
  const participants = thread.ticket.participants.map((participant) =>
    toUserRef(participant.user),
  );

  return {
    id: thread.id,
    ticket: {
      id: thread.ticket.id,
      subject: thread.ticket.subject,
      status: thread.ticket.status,
      priority: thread.ticket.priority,
      category: thread.ticket.category,
      orgId: thread.ticket.orgId,
      orgName: thread.ticket.org.displayName,
    },
    lastMessage: {
      snippet: lastMessage?.content ?? "No messages in this thread.",
      senderName: lastMessage?.sender.displayName ?? "System",
      at: (lastMessage?.createdAt ?? thread.createdAt).toISOString(),
    },
    unreadCount,
    participantsPreview: participants.slice(0, 3),
    participantCount: participants.length,
    isUnanswered:
      lastMessage?.sender.role === UserRole.USER &&
      thread.ticket.status !== "CLOSED" &&
      thread.ticket.status !== "RESOLVED",
  };
};

export const getThreadById = async (
  db: DbClient,
  id: string,
): Promise<Thread | null> => {
  const thread = await db.thread.findUnique({
    where: { id },
    include: threadInclude,
  });

  return thread ? toThread(thread) : null;
};

export const getThreadList = async (
  db: DbClient,
  filters: MessageFilters,
): Promise<ThreadList> => {
  const currentUser = await getCurrentUser(db);
  const threads = await db.thread.findMany({
    where: buildThreadWhere(filters, currentUser?.id),
    include: threadInclude,
    orderBy: [{ lastMessageAt: "desc" }, { updatedAt: "desc" }],
  });

  const rows = await Promise.all(
    threads.map((thread) => getThreadRow(db, thread, currentUser?.id)),
  );

  if (filters.tab !== "unread") {
    return rows;
  }

  return rows.filter((row) => row.unreadCount > 0);
};

export const getThreadParticipants = async (
  db: DbClient,
  threadId: string,
) => {
  const thread = await getThreadById(db, threadId);

  return thread?.participants ?? null;
};

export const getThreadMessages = async (
  db: DbClient,
  threadId: string,
  page: MessagePageParams,
): Promise<MessagesPage | null> => {
  const thread = await db.thread.findUnique({
    where: { id: threadId },
    select: { id: true },
  });

  if (!thread) {
    return null;
  }

  const cursorIndex =
    page.cursor === undefined ? 0 : Number.parseInt(page.cursor, 10);
  const start = Number.isFinite(cursorIndex) ? cursorIndex : 0;
  const messages = await db.message.findMany({
    where: { threadId, deletedAt: null },
    include: messageInclude,
    orderBy: { createdAt: "asc" },
    skip: start,
    take: page.limit + 1,
  });
  const hasNextPage = messages.length > page.limit;
  const pageMessages = messages.slice(0, page.limit);

  return {
    messages: pageMessages.map(toMessage),
    nextCursor: hasNextPage ? String(start + page.limit) : undefined,
  };
};

export const createThreadMessage = async (
  db: DbClient,
  threadId: string,
  payload: SendMessagePayload,
): Promise<Message | null> => {
  const [thread, currentUser] = await Promise.all([
    db.thread.findUnique({
      where: { id: threadId },
      include: { ticket: true },
    }),
    getCurrentUser(db),
  ]);

  if (!thread || !currentUser) {
    return null;
  }

  const message = await db.$transaction(async (tx) => {
    const created = await tx.message.create({
      data: {
        threadId,
        senderId: currentUser.id,
        kind: payload.fileIds?.length
          ? MessageKind.FILE_ATTACHMENT
          : MessageKind.USER_MESSAGE,
        content: payload.content,
        ticketRefs: {
          create: (payload.ticketRefs ?? [thread.ticketId]).map((ticketId) => ({
            ticketId,
          })),
        },
        files: payload.fileIds?.length
          ? {
              create: payload.fileIds.map((fileId) => ({
                fileId,
              })),
            }
          : undefined,
      },
      include: messageInclude,
    });

    await tx.thread.update({
      where: { id: threadId },
      data: {
        lastMessageId: created.id,
        lastMessageAt: created.createdAt,
      },
    });

    return created;
  });

  return toMessage(message);
};

export const markMessageRead = async (
  db: DbClient,
  threadId: string,
  messageId?: string,
) => {
  const [thread, currentUser, message] = await Promise.all([
    db.thread.findUnique({ where: { id: threadId }, select: { id: true } }),
    getCurrentUser(db),
    messageId
      ? db.message.findUnique({
          where: { id: messageId },
          select: { id: true, createdAt: true },
        })
      : null,
  ]);

  if (!thread || !currentUser) {
    return false;
  }

  const readAt = message?.createdAt ?? new Date();

  await db.messageReadState.upsert({
    where: {
      threadId_userId: {
        threadId,
        userId: currentUser.id,
      },
    },
    create: {
      threadId,
      userId: currentUser.id,
      lastReadAt: readAt,
      lastReadMessageId: message?.id,
    },
    update: {
      lastReadAt: readAt,
      lastReadMessageId: message?.id,
    },
  });

  return true;
};

export const joinThread = async (db: DbClient, threadId: string) => {
  const [thread, currentUser] = await Promise.all([
    db.thread.findUnique({
      where: { id: threadId },
      include: {
        ticket: {
          select: {
            id: true,
            participants: {
              where: { role: TicketParticipantRole.ASSIGNEE },
              select: { userId: true },
            },
          },
        },
      },
    }),
    getCurrentUser(db),
  ]);

  if (!thread || !currentUser) {
    return false;
  }

  if (
    thread.ticket.participants.some(
      (participant) => participant.userId === currentUser.id,
    )
  ) {
    return true;
  }

  await db.ticketParticipant.create({
    data: {
      ticketId: thread.ticket.id,
      userId: currentUser.id,
      role: TicketParticipantRole.ASSIGNEE,
    },
  });

  return true;
};

export const createFileUploadResponse = async (
  db: DbClient,
  threadId: string,
) => {
  const [thread, currentUser] = await Promise.all([
    db.thread.findUnique({
      where: { id: threadId },
      include: { ticket: true },
    }),
    getCurrentUser(db),
  ]);

  if (!thread || !currentUser) {
    return null;
  }

  const file = await db.fileAsset.create({
    data: {
      orgId: thread.ticket.orgId,
      uploadedById: currentUser.id,
      name: "uploaded-file",
      size: 0,
      mimeType: "application/octet-stream",
      url: `/files/${crypto.randomUUID()}`,
    },
  });

  return {
    fileId: file.id,
    url: file.url,
    thumbnailUrl: file.thumbnailUrl ?? undefined,
  };
};

export const deleteThreadFile = async (
  db: DbClient,
  threadId: string,
  fileId?: string,
) => {
  if (!fileId) {
    return false;
  }

  const thread = await db.thread.findUnique({
    where: { id: threadId },
    select: { id: true },
  });

  if (!thread) {
    return false;
  }

  await db.fileAsset.deleteMany({
    where: { id: fileId },
  });

  return true;
};
