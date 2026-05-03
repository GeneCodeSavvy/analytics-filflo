import { Prisma, UserRole } from "@prisma/client";
import type {
  NotificationCountResponse,
  NotificationEvent,
  NotificationListResponse,
  NotificationListParams,
  NotificationRow,
  NotificationThread,
  NotificationType,
} from "@shared/schema/notifications";
import type { TicketRef, UserRef } from "@shared/schema/domain";
import type { DbClient } from "../../lib/db";
import { buildNotificationWhere } from "./utils";

const currentUserRoles: UserRole[] = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.MODERATOR,
];

const doneTypes = new Set<NotificationType>([
  "TICKET_RESOLVED",
  "TICKET_CLOSED",
]);

const notificationInclude = {
  actor: true,
  recipient: true,
  ticket: {
    include: {
      org: true,
    },
  },
  thread: {
    include: {
      ticket: {
        include: {
          org: true,
        },
      },
    },
  },
  message: {
    include: {
      sender: true,
      thread: {
        include: {
          ticket: {
            include: {
              org: true,
            },
          },
        },
      },
      ticketRefs: {
        include: {
          ticket: {
            include: {
              org: true,
            },
          },
        },
      },
    },
  },
} satisfies Prisma.NotificationInclude;

type NotificationRecord = Prisma.NotificationGetPayload<{
  include: typeof notificationInclude;
}>;

const toUserRef = (user: {
  id: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
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

const resolveActor = (notification: NotificationRecord) =>
  notification.actor ?? notification.recipient;

const resolveTicket = (notification: NotificationRecord): TicketRef | undefined => {
  const ticket =
    notification.ticket ??
    notification.thread?.ticket ??
    notification.message?.thread.ticket ??
    notification.message?.ticketRefs[0]?.ticket;

  if (!ticket) {
    return undefined;
  }

  return {
    id: ticket.id,
    subject: ticket.subject,
    status: ticket.status,
    priority: ticket.priority,
    ...(ticket.category ? { category: ticket.category } : {}),
    orgId: ticket.orgId,
    orgName: ticket.org.displayName,
  };
};

const getNotificationScopeKey = (notification: NotificationRecord) =>
  notification.threadId ?? notification.messageId ?? notification.ticketId ?? notification.id;

const getNotificationGroupKey = (notification: NotificationRecord) =>
  `${getNotificationScopeKey(notification)}:${notification.type}`;

const getNotificationState = (notification: NotificationRecord) => {
  if (doneTypes.has(notification.type)) {
    return "done" as const;
  }

  return notification.readAt ? ("read" as const) : ("inbox" as const);
};

const toNotificationEvent = (notification: NotificationRecord): NotificationEvent => ({
  id: notification.id,
  type: notification.type,
  description: notification.body ?? notification.title,
  actor: toUserRef(resolveActor(notification)),
  at: notification.createdAt.toISOString(),
});

const toNotificationRow = (
  notification: NotificationRecord,
  eventCount: number,
): NotificationRow => {
  const ticket = resolveTicket(notification);

  return {
    id: notification.id,
    type: notification.type,
    tier:
      notification.type === "TICKET_INVITATION" ||
      notification.type === "TICKET_ASSIGNED" ||
      notification.type === "REVIEW_REQUESTED"
        ? "action_required"
        : notification.type === "TICKET_RESOLVED" ||
            notification.type === "TICKET_CLOSED" ||
            notification.type === "NEW_TICKET_IN_ORG"
          ? "status_update"
          : "fyi",
    state: getNotificationState(notification),
    ...(ticket ? { ticket } : {}),
    latestEvent: {
      description: notification.body ?? notification.title,
      actor: toUserRef(resolveActor(notification)),
      at: notification.createdAt.toISOString(),
    },
    eventCount,
    ...(notification.readAt ? { readAt: notification.readAt.toISOString() } : {}),
  };
};

const getCurrentUser = async (db: DbClient) => {
  return db.user.findFirst({
    where: { role: { in: currentUserRoles } },
    orderBy: { createdAt: "asc" },
  });
};

const getNotificationsForCurrentUser = async (db: DbClient) => {
  const currentUser = await getCurrentUser(db);

  if (!currentUser) {
    return { currentUser: null, notifications: [] as NotificationRecord[] };
  }

  const notifications = await db.notification.findMany({
    where: buildNotificationWhere(currentUser.id),
    include: notificationInclude,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });

  return { currentUser, notifications };
};

const groupNotifications = (notifications: NotificationRecord[]) => {
  const groups = new Map<string, NotificationRecord[]>();

  for (const notification of notifications) {
    const key = getNotificationGroupKey(notification);
    const existing = groups.get(key);

    if (existing) {
      existing.push(notification);
    } else {
      groups.set(key, [notification]);
    }
  }

  return [...groups.values()].map((group) =>
    group.sort(
      (left, right) =>
        right.createdAt.getTime() - left.createdAt.getTime() ||
        right.id.localeCompare(left.id),
    ),
  );
};

const getInvitationForNotification = async (
  db: DbClient,
  notification: NotificationRecord,
) => {
  const ticket = resolveTicket(notification);
  const recipient = notification.recipient;

  if (!ticket || notification.type !== "TICKET_INVITATION") {
    return null;
  }

  return db.invitation.findFirst({
    where: {
      orgId: ticket.orgId,
      email: recipient.email,
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
    },
  });
};

export const getNotificationList = async (
  db: DbClient,
  filters: NotificationListParams,
): Promise<NotificationListResponse> => {
  const { currentUser, notifications } = await getNotificationsForCurrentUser(db);

  if (!currentUser) {
    return {
      rows: [],
      total: 0,
      page: 1,
      pageSize: 25,
    };
  }

  const grouped = groupNotifications(notifications);
  const rows = await Promise.all(
    grouped.map(async (group) => {
      const head = group[0];

      if (!head) {
        return null;
      }

      const row = toNotificationRow(head, group.length);
      const invitation = await getInvitationForNotification(db, head);

      return invitation
        ? {
            ...row,
            invitationId: invitation.id,
            invitationStatus: invitation.status,
          }
        : row;
    }),
  );

  const filteredRows = rows.filter((row): row is NotificationRow => row !== null).filter((row) => {
      const matchesTab =
        filters.tab === "all" || row.state === filters.tab;
      const matchesTypes =
        filters.type === undefined ||
        filters.type.length === 0 ||
        filters.type.includes(row.type);
      const matchesTicket =
        filters.ticketId === undefined || row.ticket?.id === filters.ticketId;
      const matchesOrg =
        filters.orgId === undefined || row.ticket?.orgId === filters.orgId;

      return matchesTab && matchesTypes && matchesTicket && matchesOrg;
    });

  const start = (filters.page - 1) * filters.pageSize;
  const pageRows = filteredRows.slice(start, start + filters.pageSize);

  return {
    rows: pageRows,
    total: filteredRows.length,
    page: filters.page,
    pageSize: filters.pageSize,
  };
};

export const getNotificationCount = async (
  db: DbClient,
): Promise<NotificationCountResponse> => {
  const { notifications } = await getNotificationsForCurrentUser(db);
  const grouped = groupNotifications(notifications);

  return {
    inbox: grouped.filter((group) => {
      const head = group[0];
      return head ? getNotificationState(head) === "inbox" : false;
    }).length,
  };
};

export const getNotificationThread = async (
  db: DbClient,
  id: string,
): Promise<NotificationThread | null> => {
  const { notifications } = await getNotificationsForCurrentUser(db);
  const current = notifications.find((notification) => notification.id === id);

  if (!current) {
    return null;
  }

  const groupKey = getNotificationGroupKey(current);
  const events = notifications
    .filter((notification) => getNotificationGroupKey(notification) === groupKey)
    .sort(
      (left, right) =>
        left.createdAt.getTime() - right.createdAt.getTime() ||
        left.id.localeCompare(right.id),
    )
    .map(toNotificationEvent);

  return {
    notificationGroupId: id,
    events,
  };
};

export const getNotificationById = async (db: DbClient, id: string) => {
  const { notifications } = await getNotificationsForCurrentUser(db);
  return notifications.find((notification) => notification.id === id) ?? null;
};

export const updateNotificationState = async (
  db: DbClient,
  id: string,
  state: "inbox" | "read" | "done",
) => {
  const notification = await getNotificationById(db, id);

  if (!notification) {
    return false;
  }

  await db.notification.update({
    where: { id },
    data: {
      readAt: state === "inbox" ? null : notification.readAt ?? new Date(),
    },
  });

  return true;
};

export const snoozeNotification = async (
  db: DbClient,
  id: string,
) => {
  const notification = await getNotificationById(db, id);

  if (!notification) {
    return false;
  }

  await db.notification.update({
    where: { id },
    data: {
      readAt: notification.readAt ?? new Date(),
    },
  });

  return true;
};

export const bulkNotifications = async (
  db: DbClient,
  payload: {
    op: "read" | "done" | "unread";
    scope: "ids" | "ticket";
    ids?: string[];
    ticketId?: string;
  },
) => {
  const targetIds =
    payload.scope === "ids"
      ? payload.ids ?? []
      : (
          await db.notification.findMany({
            where: {
              ticketId: payload.ticketId,
            },
            select: { id: true },
          })
        ).map((notification) => notification.id);

  if (targetIds.length === 0) {
    return true;
  }

  if (payload.op === "unread") {
    await db.notification.updateMany({
      where: { id: { in: targetIds } },
      data: { readAt: null },
    });
    return true;
  }

  await db.notification.updateMany({
    where: { id: { in: targetIds } },
    data: { readAt: new Date() },
  });

  return true;
};

export const respondToInvitation = async (
  db: DbClient,
  invitationId: string,
  response: "ACCEPTED" | "CANCELLED",
) => {
  const invitation = await db.invitation.findUnique({
    where: { id: invitationId },
    select: { id: true },
  });

  if (!invitation) {
    return false;
  }

  await db.invitation.update({
    where: { id: invitationId },
    data: {
      status: response,
      acceptedAt: response === "ACCEPTED" ? new Date() : null,
    },
  });

  return true;
};

export const muteTicket = async (db: DbClient, ticketId: string) => {
  const ticket = await db.ticket.findUnique({
    where: { id: ticketId },
    select: { id: true },
  });

  return !!ticket;
};

export const unmuteTicket = async (db: DbClient, ticketId: string) => {
  const ticket = await db.ticket.findUnique({
    where: { id: ticketId },
    select: { id: true },
  });

  return !!ticket;
};
