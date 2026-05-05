import {
  NotificationType,
  TicketParticipantRole,
  TicketStatus,
  UserRole,
  type Prisma,
} from "@prisma/client";

type NotificationDb = Prisma.TransactionClient;

type ResponsibleUser = {
  id: string;
  role: UserRole;
  orgId: string;
};

type NotificationTicket = {
  id: string;
  subject: string;
  orgId: string;
  status: TicketStatus;
  participants: Array<{ userId: string; role: TicketParticipantRole }>;
};

type TicketNotificationRecord = {
  recipientId: string;
  actorId: string;
  type: NotificationType;
  ticketId: string;
  threadId?: string;
  messageId?: string;
  title: string;
  body?: string;
};

const notificationTitles: Record<
  NotificationType,
  (subject: string) => string
> = {
  [NotificationType.TICKET_ASSIGNED]: (subject) => `Assigned: ${subject}`,
  [NotificationType.REVIEW_REQUESTED]: (subject) =>
    `Review requested: ${subject}`,
  [NotificationType.TICKET_INVITATION]: (subject) => `Invitation: ${subject}`,
  [NotificationType.TICKET_RESOLVED]: (subject) => `Resolved: ${subject}`,
  [NotificationType.TICKET_CLOSED]: (subject) => `Closed: ${subject}`,
  [NotificationType.NEW_TICKET_IN_ORG]: (subject) => `New ticket: ${subject}`,
  [NotificationType.MESSAGE_ACTIVITY]: (subject) => `New message: ${subject}`,
};

const getParticipantIds = (ticket: NotificationTicket) =>
  new Set(ticket.participants.map((participant) => participant.userId));

const getAssigneeIds = (ticket: NotificationTicket) =>
  new Set(
    ticket.participants
      .filter(
        (participant) => participant.role === TicketParticipantRole.ASSIGNEE,
      )
      .map((participant) => participant.userId),
  );

const uniqueUserIds = (userIds: string[]) => [...new Set(userIds)];

export const getResponsibleTicketUserIds = ({
  users,
  ticket,
  actorId,
}: {
  users: ResponsibleUser[];
  ticket: NotificationTicket;
  actorId: string;
}) => {
  const participantIds = getParticipantIds(ticket);
  const assigneeIds = getAssigneeIds(ticket);

  return users
    .filter((user) => user.id !== actorId)
    .filter((user) => {
      if (user.role === UserRole.SUPER_ADMIN) {
        return true;
      }

      if (user.role === UserRole.MODERATOR) {
        return user.orgId === ticket.orgId;
      }

      if (user.role === UserRole.ADMIN) {
        return assigneeIds.has(user.id);
      }

      return participantIds.has(user.id);
    })
    .map((user) => user.id);
};

export const buildTicketNotificationRecords = ({
  type,
  actorId,
  users,
  ticket,
  explicitRecipientIds,
  threadId,
  messageId,
  body,
}: {
  type: NotificationType;
  actorId: string;
  users: ResponsibleUser[];
  ticket: NotificationTicket;
  explicitRecipientIds?: string[];
  threadId?: string;
  messageId?: string;
  body?: string;
}): TicketNotificationRecord[] => {
  const eligibleIds = new Set(
    getResponsibleTicketUserIds({ users, ticket, actorId }),
  );

  const recipientIds = explicitRecipientIds
    ? uniqueUserIds(explicitRecipientIds).filter(
        (id) => id !== actorId && eligibleIds.has(id),
      )
    : [...eligibleIds];

  return recipientIds.map((recipientId) => ({
    recipientId,
    actorId,
    type,
    ticketId: ticket.id,
    ...(threadId ? { threadId } : {}),
    ...(messageId ? { messageId } : {}),
    title: notificationTitles[type](ticket.subject),
    ...(body ? { body } : {}),
  }));
};

export const createTicketNotifications = async (
  db: NotificationDb,
  input: {
    type: NotificationType;
    actorId: string;
    ticketId: string;
    explicitRecipientIds?: string[];
    threadId?: string;
    messageId?: string;
    body?: string;
  },
) => {
  const ticket = await db.ticket.findUnique({
    where: { id: input.ticketId },
    select: {
      id: true,
      subject: true,
      orgId: true,
      status: true,
      participants: {
        select: { userId: true, role: true },
      },
    },
  });

  if (!ticket) {
    return 0;
  }

  const users = await db.user.findMany({
    where: {
      OR: [
        { role: UserRole.SUPER_ADMIN },
        { role: UserRole.MODERATOR, orgId: ticket.orgId },
        {
          id: {
            in:
              input.explicitRecipientIds ??
              ticket.participants.map((participant) => participant.userId),
          },
        },
      ],
    },
    select: {
      id: true,
      role: true,
      orgId: true,
    },
  });

  const records = buildTicketNotificationRecords({
    type: input.type,
    actorId: input.actorId,
    users,
    ticket,
    explicitRecipientIds: input.explicitRecipientIds,
    threadId: input.threadId,
    messageId: input.messageId,
    body: input.body,
  });

  if (records.length === 0) {
    return 0;
  }

  const created = await db.notification.createMany({
    data: records,
  });

  return created.count;
};
