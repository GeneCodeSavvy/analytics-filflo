import {
  NotificationType,
  Prisma,
  TicketCategory,
  TicketPriority,
  TicketStatus,
  UserRole,
  ViewScope,
} from "@prisma/client";
import type {
  ActivityEntry,
  CreateViewPayload,
  NewTicketDraft,
  TicketDetail,
  TicketFilters,
  TicketListParams,
  TicketRow,
  UpdateTicketPayload,
  UpdateViewPayload,
  View,
} from "@shared/schema/tickets";
import type { UserRef } from "@shared/schema/domain";
import type { DbClient } from "../../lib/db";
import { createTicketNotifications } from "../../lib/ticketNotifications";

const staleTicketMs = 3 * 24 * 60 * 60 * 1000;

const openStatuses: TicketStatus[] = [
  TicketStatus.OPEN,
  TicketStatus.IN_PROGRESS,
  TicketStatus.ON_HOLD,
  TicketStatus.REVIEW,
];

const validActivityTypes = new Set([
  "status_change",
  "priority_change",
  "assignee_change",
  "comment",
  "created",
  "updated",
]);

const toActivityType = (type: string): ActivityEntry["type"] => {
  const lower = type.toLowerCase();
  return validActivityTypes.has(lower)
    ? (lower as ActivityEntry["type"])
    : "updated";
};

const toActivityChanges = (
  changes: Prisma.JsonValue,
): ActivityEntry["changes"] | undefined => {
  if (!changes || typeof changes !== "object" || Array.isArray(changes)) {
    return undefined;
  }

  return changes as ActivityEntry["changes"];
};

type UserRow = {
  id: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
  role: string;
  orgId: string;
};

const toUserRef = (user: UserRow): UserRef => ({
  id: user.id,
  name: user.displayName,
  email: user.email,
  ...(user.avatarUrl ? { avatarUrl: user.avatarUrl } : {}),
  role: user.role as UserRef["role"],
  orgId: user.orgId,
});

const ticketInclude = {
  org: true,
  participants: {
    include: { user: true },
    orderBy: { createdAt: "asc" as const },
  },
  activities: {
    include: { actor: true },
    orderBy: { createdAt: "asc" as const },
  },
  thread: { select: { id: true } },
} satisfies Prisma.TicketInclude;

type TicketWithRelations = Prisma.TicketGetPayload<{
  include: typeof ticketInclude;
}>;

const toTicketDetail = (ticket: TicketWithRelations): TicketDetail => {
  const now = Date.now();
  const requesters = ticket.participants.filter((p) => p.role === "REQUESTER");
  const assignees = ticket.participants.filter((p) => p.role === "ASSIGNEE");
  const primaryRequester = requesters.find((p) => p.isPrimary) ?? requesters[0];
  const primaryAssignee = assignees.find((p) => p.isPrimary) ?? assignees[0];
  const isStale =
    openStatuses.includes(ticket.status) &&
    now - ticket.createdAt.getTime() > staleTicketMs;

  return {
    id: ticket.id,
    subject: ticket.subject,
    descriptionPreview: ticket.description.slice(0, 120),
    description: ticket.description,
    status: ticket.status,
    priority: ticket.priority,
    category: ticket.category,
    org: { id: ticket.org.id, name: ticket.org.displayName },
    requester: primaryRequester
      ? toUserRef(primaryRequester.user)
      : { id: "unknown", name: "Unknown", role: "USER", orgId: ticket.orgId },
    primaryAssignee: primaryAssignee
      ? toUserRef(primaryAssignee.user)
      : undefined,
    assigneeCount: assignees.length,
    assigneesPreview: assignees.slice(0, 3).map((p) => toUserRef(p.user)),
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
    isStale,
    unread: false, // TODO: derive from MessageReadState once auth context is available
    activity: ticket.activities.map((act) => {
      const changes = toActivityChanges(act.changes);

      return {
        id: act.id,
        type: toActivityType(act.type),
        actor: {
          id: act.actor.id,
          name: act.actor.displayName,
          ...(act.actor.avatarUrl ? { avatarUrl: act.actor.avatarUrl } : {}),
        },
        ...(changes ? { changes } : {}),
        ...(act.comment ? { comment: act.comment } : {}),
        createdAt: act.createdAt.toISOString(),
      };
    }),
    threadId: ticket.thread?.id ?? null,
  };
};

export const toTicketRow = (ticket: TicketWithRelations): TicketRow => {
  const detail = toTicketDetail(ticket);
  return {
    id: detail.id,
    subject: detail.subject,
    descriptionPreview: detail.descriptionPreview,
    status: detail.status,
    priority: detail.priority,
    category: detail.category,
    org: detail.org,
    requester: detail.requester,
    primaryAssignee: detail.primaryAssignee,
    assigneeCount: detail.assigneeCount,
    assigneesPreview: detail.assigneesPreview,
    createdAt: detail.createdAt,
    updatedAt: detail.updatedAt,
    isStale: detail.isStale,
    unread: detail.unread,
  };
};

const buildTicketWhere = (filters: TicketFilters): Prisma.TicketWhereInput => {
  const staleDate = new Date(Date.now() - staleTicketMs);

  return {
    ...(filters.status?.length
      ? { status: { in: filters.status as TicketStatus[] } }
      : {}),
    ...(filters.priority?.length
      ? { priority: { in: filters.priority as TicketPriority[] } }
      : {}),
    ...(filters.category?.length
      ? { category: { in: filters.category as TicketCategory[] } }
      : {}),
    ...(filters.orgIds?.length ? { orgId: { in: filters.orgIds } } : {}),
    ...(filters.assigneeIds?.length
      ? {
          participants: {
            some: { role: "ASSIGNEE", userId: { in: filters.assigneeIds } },
          },
        }
      : {}),
    ...(filters.requesterIds?.length
      ? {
          participants: {
            some: { role: "REQUESTER", userId: { in: filters.requesterIds } },
          },
        }
      : {}),
    ...(filters.createdFrom || filters.createdTo
      ? {
          createdAt: {
            ...(filters.createdFrom
              ? { gte: new Date(filters.createdFrom) }
              : {}),
            ...(filters.createdTo ? { lte: new Date(filters.createdTo) } : {}),
          },
        }
      : {}),
    ...(filters.q
      ? {
          OR: [
            { subject: { contains: filters.q, mode: "insensitive" } },
            { description: { contains: filters.q, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(filters.stale === true
      ? { createdAt: { lt: staleDate }, status: { in: openStatuses } }
      : {}),
  };
};

const buildOrderBy = (sort: string): Prisma.TicketOrderByWithRelationInput => {
  const [field, dir = "desc"] = sort.split(":");
  const direction: "asc" | "desc" = dir === "asc" ? "asc" : "desc";

  switch (field) {
    case "createdAt":
      return { createdAt: direction };
    case "priority":
      return { priority: direction };
    case "status":
      return { status: direction };
    case "subject":
      return { subject: direction };
    default:
      return { updatedAt: direction };
  }
};

export const getTicketList = async (
  db: DbClient,
  params: TicketListParams,
): Promise<{ rows: TicketRow[]; total: number }> => {
  const where = buildTicketWhere(params);
  const orderBy = buildOrderBy(params.sort);

  const [tickets, total] = await Promise.all([
    db.ticket.findMany({
      where,
      include: ticketInclude,
      orderBy,
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
    }),
    db.ticket.count({ where }),
  ]);

  return { rows: tickets.map(toTicketRow), total };
};

export const getTicketDetail = async (
  db: DbClient,
  id: string,
): Promise<TicketDetail | null> => {
  const ticket = await db.ticket.findUnique({
    where: { id },
    include: ticketInclude,
  });

  return ticket ? toTicketDetail(ticket) : null;
};

export const getTicketOrg = async (
  db: DbClient,
  id: string,
): Promise<{ orgId: string } | null> => {
  return db.ticket.findUnique({
    where: { id },
    select: { orgId: true },
  });
};

export const searchTicketList = async (
  db: DbClient,
  filters: TicketFilters & { limit?: number },
): Promise<TicketRow[]> => {
  const tickets = await db.ticket.findMany({
    where: buildTicketWhere(filters),
    include: ticketInclude,
    orderBy: { updatedAt: "desc" },
    take: filters.limit ?? 20,
  });

  return tickets.map(toTicketRow);
};

export const createTicketInDb = async (
  db: DbClient,
  draft: NewTicketDraft,
  actorId: string,
): Promise<TicketDetail> => {
  const actor = await db.user.findUnique({ where: { id: actorId } });

  const ticket = await db.ticket.create({
    data: {
      subject: draft.subject,
      description: draft.description,
      priority: (draft.priority ?? "MEDIUM") as TicketPriority,
      category: draft.category as TicketCategory | undefined,
      orgId: actor?.orgId ?? (await db.org.findFirst().then((o) => o!.id)),
      participants: {
        create: [
          { userId: actorId, role: "REQUESTER", isPrimary: true },
          ...draft.assigneeIds.map((userId, i) => ({
            userId,
            role: "ASSIGNEE" as const,
            isPrimary: i === 0,
            addedById: actorId,
          })),
        ],
      },
      activities: {
        create: {
          actorId,
          type: "created",
        },
      },
    },
    include: ticketInclude,
  });

  await createTicketNotifications(db, {
    type: NotificationType.NEW_TICKET_IN_ORG,
    actorId,
    ticketId: ticket.id,
    body: ticket.description.slice(0, 180),
  });

  if (draft.assigneeIds.length > 0) {
    await createTicketNotifications(db, {
      type: NotificationType.TICKET_ASSIGNED,
      actorId,
      ticketId: ticket.id,
      explicitRecipientIds: draft.assigneeIds,
      body: `${ticket.subject} was assigned to you.`,
    });
  }

  return toTicketDetail(ticket);
};

export const updateTicketInDb = async (
  db: DbClient,
  id: string,
  payload: UpdateTicketPayload,
  actorId: string,
): Promise<TicketDetail | null> => {
  const existing = await db.ticket.findUnique({ where: { id } });
  if (!existing) return null;

  const ticket = await db.ticket.update({
    where: { id },
    data: {
      ...(payload.subject ? { subject: payload.subject } : {}),
      ...(payload.description ? { description: payload.description } : {}),
      ...(payload.category
        ? { category: payload.category as TicketCategory }
        : {}),
      ...(payload.status ? { status: payload.status as TicketStatus } : {}),
      ...(payload.priority
        ? { priority: payload.priority as TicketPriority }
        : {}),
      activities: {
        create: {
          actorId,
          type: "updated",
          changes: buildChanges(existing, payload),
        },
      },
    },
    include: ticketInclude,
  });

  if (payload.status && payload.status !== existing.status) {
    const notificationType =
      payload.status === TicketStatus.REVIEW
        ? NotificationType.REVIEW_REQUESTED
        : payload.status === TicketStatus.RESOLVED
          ? NotificationType.TICKET_RESOLVED
          : payload.status === TicketStatus.CLOSED
            ? NotificationType.TICKET_CLOSED
            : null;

    if (notificationType) {
      await createTicketNotifications(db, {
        type: notificationType,
        actorId,
        ticketId: id,
        body: `Status changed from ${existing.status} to ${payload.status}.`,
      });
    }
  }

  return toTicketDetail(ticket);
};

const buildChanges = (
  existing: { status: TicketStatus; priority: TicketPriority },
  payload: UpdateTicketPayload,
): Record<string, { from: string; to: string }> => {
  const changes: Record<string, { from: string; to: string }> = {};

  if (payload.status && payload.status !== existing.status) {
    changes.status = { from: existing.status, to: payload.status };
  }

  if (payload.priority && payload.priority !== existing.priority) {
    changes.priority = { from: existing.priority, to: payload.priority };
  }

  return changes;
};

export const deleteTicketInDb = async (
  db: DbClient,
  id: string,
): Promise<boolean> => {
  const existing = await db.ticket.findUnique({ where: { id } });
  if (!existing) return false;

  await db.ticket.delete({ where: { id } });
  return true;
};

export const assignTicketInDb = async (
  db: DbClient,
  id: string,
  add: string[],
  remove: string[],
  actorId: string,
): Promise<TicketDetail | null> => {
  const existing = await db.ticket.findUnique({ where: { id } });
  if (!existing) return null;

  const currentAssignees = await db.ticketParticipant.findMany({
    where: { ticketId: id, role: "ASSIGNEE" },
  });
  const newAssigneeIds = add.filter(
    (uid) =>
      !currentAssignees.some((participant) => participant.userId === uid),
  );

  await db.$transaction([
    ...(remove.length
      ? [
          db.ticketParticipant.deleteMany({
            where: { ticketId: id, role: "ASSIGNEE", userId: { in: remove } },
          }),
        ]
      : []),
    ...newAssigneeIds.map((userId, i) =>
      db.ticketParticipant.create({
        data: {
          ticketId: id,
          userId,
          role: "ASSIGNEE",
          isPrimary: i === 0 && currentAssignees.length === 0,
          addedById: actorId,
        },
      }),
    ),
    db.ticketActivity.create({
      data: {
        ticketId: id,
        actorId,
        type: "assignee_change",
      },
    }),
  ]);

  if (newAssigneeIds.length > 0) {
    await createTicketNotifications(db, {
      type: NotificationType.TICKET_ASSIGNED,
      actorId,
      ticketId: id,
      explicitRecipientIds: newAssigneeIds,
      includeAssignmentWatchers: true,
      body: "You were assigned to this ticket.",
    });
  }

  const ticket = await db.ticket.findUnique({
    where: { id },
    include: ticketInclude,
  });

  return ticket ? toTicketDetail(ticket) : null;
};

export const updateTicketStatusInDb = async (
  db: DbClient,
  id: string,
  status: TicketStatus,
  actorId: string,
): Promise<TicketDetail | null> => {
  const existing = await db.ticket.findUnique({ where: { id } });
  if (!existing) return null;

  const ticket = await db.ticket.update({
    where: { id },
    data: {
      status,
      ...(status === TicketStatus.RESOLVED ? { resolvedAt: new Date() } : {}),
      ...(status === TicketStatus.CLOSED ? { closedAt: new Date() } : {}),
      activities: {
        create: {
          actorId,
          type: "status_change",
          changes: { status: { from: existing.status, to: status } },
        },
      },
    },
    include: ticketInclude,
  });

  if (status !== existing.status) {
    const notificationType =
      status === TicketStatus.REVIEW
        ? NotificationType.REVIEW_REQUESTED
        : status === TicketStatus.RESOLVED
          ? NotificationType.TICKET_RESOLVED
          : status === TicketStatus.CLOSED
            ? NotificationType.TICKET_CLOSED
            : null;

    if (notificationType) {
      await createTicketNotifications(db, {
        type: notificationType,
        actorId,
        ticketId: id,
        body: `Status changed from ${existing.status} to ${status}.`,
      });
    }
  }

  return toTicketDetail(ticket);
};

export const updateTicketPriorityInDb = async (
  db: DbClient,
  id: string,
  priority: TicketPriority,
  actorId: string,
): Promise<TicketDetail | null> => {
  const existing = await db.ticket.findUnique({ where: { id } });
  if (!existing) return null;

  const ticket = await db.ticket.update({
    where: { id },
    data: {
      priority,
      activities: {
        create: {
          actorId,
          type: "priority_change",
          changes: { priority: { from: existing.priority, to: priority } },
        },
      },
    },
    include: ticketInclude,
  });

  return toTicketDetail(ticket);
};

export const bulkTicketsInDb = async (
  db: DbClient,
  ids: string[],
  action: string,
  actorId: string,
  opts: {
    status?: TicketStatus;
    priority?: TicketPriority;
    assigneeIds?: string[];
    readableOrgIds?: string[];
  },
): Promise<{
  succeeded: string[];
  failed: { id: string; reason: string }[];
}> => {
  const succeeded: string[] = [];
  const failed: { id: string; reason: string }[] = [];

  for (const id of ids) {
    const existing = await db.ticket.findUnique({ where: { id } });

    if (!existing) {
      failed.push({ id, reason: "Ticket not found" });
      continue;
    }

    if (opts.readableOrgIds && !opts.readableOrgIds.includes(existing.orgId)) {
      failed.push({ id, reason: "Forbidden" });
      continue;
    }

    if (action === "status" && opts.status) {
      await db.ticket.update({
        where: { id },
        data: {
          status: opts.status,
          ...(opts.status === TicketStatus.RESOLVED
            ? { resolvedAt: new Date() }
            : {}),
          ...(opts.status === TicketStatus.CLOSED
            ? { closedAt: new Date() }
            : {}),
          activities: {
            create: {
              actorId,
              type: "status_change",
              changes: { status: { from: existing.status, to: opts.status } },
            },
          },
        },
      });

      if (opts.status !== existing.status) {
        const notificationType =
          opts.status === TicketStatus.REVIEW
            ? NotificationType.REVIEW_REQUESTED
            : opts.status === TicketStatus.RESOLVED
              ? NotificationType.TICKET_RESOLVED
              : opts.status === TicketStatus.CLOSED
                ? NotificationType.TICKET_CLOSED
                : null;

        if (notificationType) {
          await createTicketNotifications(db, {
            type: notificationType,
            actorId,
            ticketId: id,
            body: `Status changed from ${existing.status} to ${opts.status}.`,
          });
        }
      }
    } else if (action === "priority" && opts.priority) {
      await db.ticket.update({
        where: { id },
        data: {
          priority: opts.priority,
          activities: {
            create: {
              actorId,
              type: "priority_change",
              changes: {
                priority: { from: existing.priority, to: opts.priority },
              },
            },
          },
        },
      });
    } else if (action === "close") {
      await db.ticket.update({
        where: { id },
        data: {
          status: TicketStatus.CLOSED,
          closedAt: new Date(),
          activities: {
            create: {
              actorId,
              type: "status_change",
              changes: {
                status: { from: existing.status, to: TicketStatus.CLOSED },
              },
            },
          },
        },
      });

      if (existing.status !== TicketStatus.CLOSED) {
        await createTicketNotifications(db, {
          type: NotificationType.TICKET_CLOSED,
          actorId,
          ticketId: id,
          body: `Status changed from ${existing.status} to ${TicketStatus.CLOSED}.`,
        });
      }
    } else if (action === "assign" && opts.assigneeIds?.length) {
      const currentAssignees = await db.ticketParticipant.findMany({
        where: { ticketId: id, role: "ASSIGNEE" },
        select: { userId: true },
      });
      const currentAssigneeIds = new Set(
        currentAssignees.map((participant) => participant.userId),
      );
      const newAssigneeIds = opts.assigneeIds.filter(
        (userId) => !currentAssigneeIds.has(userId),
      );

      await db.ticketParticipant.deleteMany({
        where: { ticketId: id, role: "ASSIGNEE" },
      });
      await db.ticketParticipant.createMany({
        data: opts.assigneeIds.map((userId, i) => ({
          ticketId: id,
          userId,
          role: "ASSIGNEE" as const,
          isPrimary: i === 0,
          addedById: actorId,
        })),
      });
      await db.ticketActivity.create({
        data: { ticketId: id, actorId, type: "assignee_change" },
      });

      if (newAssigneeIds.length > 0) {
        await createTicketNotifications(db, {
          type: NotificationType.TICKET_ASSIGNED,
          actorId,
          ticketId: id,
          explicitRecipientIds: newAssigneeIds,
          includeAssignmentWatchers: true,
          body: "You were assigned to this ticket.",
        });
      }
    }

    succeeded.push(id);
  }

  return { succeeded, failed };
};

const toView = (v: {
  id: string;
  name: string;
  scope: ViewScope;
  ownerId: string | null;
  role: string | null;
  filters: Prisma.JsonValue;
  sort: Prisma.JsonValue;
  groupBy: string | null;
  columns: string[];
}): View => ({
  id: v.id,
  name: v.name,
  scope: v.scope,
  ...(v.ownerId ? { ownerId: v.ownerId } : {}),
  ...(v.role ? { role: v.role as View["role"] } : {}),
  filters: (v.filters ?? {}) as View["filters"],
  sort: (v.sort ?? []) as View["sort"],
  ...(v.groupBy ? { groupBy: v.groupBy as View["groupBy"] } : {}),
  ...(v.columns.length ? { columns: v.columns } : {}),
});

export const getViewsFromDb = async (
  db: DbClient,
  actor: { id: string; role: string },
): Promise<View[]> => {
  const views = await db.ticketView.findMany({
    where: {
      OR: [
        { scope: ViewScope.BUILTIN },
        { ownerId: actor.id },
        { role: actor.role as UserRole },
      ],
    },
    orderBy: { createdAt: "asc" },
  });

  return views.map(toView);
};

export const createViewInDb = async (
  db: DbClient,
  payload: CreateViewPayload,
  ownerId: string,
): Promise<View> => {
  const view = await db.ticketView.create({
    data: {
      name: payload.name,
      scope: "USER",
      ownerId,
      filters: payload.filters as Prisma.InputJsonValue,
      sort: payload.sort as Prisma.InputJsonValue,
      ...(payload.groupBy ? { groupBy: payload.groupBy } : {}),
      columns: payload.columns ?? [],
    },
  });

  return toView(view);
};

export const updateViewInDb = async (
  db: DbClient,
  id: string,
  payload: UpdateViewPayload,
  ownerId: string,
): Promise<View | null> => {
  const existing = await db.ticketView.findFirst({ where: { id, ownerId } });
  if (!existing) return null;

  const view = await db.ticketView.update({
    where: { id },
    data: {
      ...(payload.name ? { name: payload.name } : {}),
      ...(payload.filters
        ? { filters: payload.filters as Prisma.InputJsonValue }
        : {}),
      ...(payload.sort ? { sort: payload.sort as Prisma.InputJsonValue } : {}),
      ...(payload.groupBy !== undefined
        ? { groupBy: payload.groupBy ?? null }
        : {}),
      ...(payload.columns !== undefined
        ? { columns: payload.columns ?? [] }
        : {}),
    },
  });

  return toView(view);
};

export const deleteViewInDb = async (
  db: DbClient,
  id: string,
  ownerId: string,
): Promise<boolean> => {
  const existing = await db.ticketView.findFirst({ where: { id, ownerId } });
  if (!existing) return false;

  await db.ticketView.delete({ where: { id } });
  return true;
};
