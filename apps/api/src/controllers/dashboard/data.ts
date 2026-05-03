import { Prisma, TicketCategory, TicketStatus } from "@prisma/client";
import type {
  DashboardFilters,
  DashboardKpis,
  Status,
  StatusDonut,
  VolumeBar,
  VolumeTrend,
  Zone3Data,
} from "@shared/schema/dashboard";
import type { DbClient } from "../../lib/db";

const statuses: Status[] = [
  "OPEN",
  "IN_PROGRESS",
  "REVIEW",
  "ON_HOLD",
  "RESOLVED",
  "CLOSED",
];

const openStatuses: TicketStatus[] = [
  TicketStatus.OPEN,
  TicketStatus.IN_PROGRESS,
  TicketStatus.ON_HOLD,
  TicketStatus.REVIEW,
];

const dayMs = 24 * 60 * 60 * 1000;
const staleTicketMs = 3 * dayMs;
const categories = Object.values(TicketCategory);

const toIsoDate = (date: Date) => date.toISOString().slice(0, 10);

const startOfDay = (date: Date) =>
  new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );

const addDays = (date: Date, days: number) =>
  new Date(date.getTime() + days * dayMs);

type DateRange = {
  gte?: Date;
  lt?: Date;
};

const getRangeWindow = (filters: DashboardFilters): DateRange => {
  const now = new Date();

  if (filters.range === "all") {
    return {};
  }

  if (filters.range === "custom" && filters.rangeFrom && filters.rangeTo) {
    return {
      gte: startOfDay(new Date(filters.rangeFrom)),
      lt: addDays(startOfDay(new Date(filters.rangeTo)), 1),
    };
  }

  const days = filters.range === "7d" ? 7 : filters.range === "90d" ? 90 : 30;
  return {
    gte: addDays(startOfDay(now), -(days - 1)),
    lt: addDays(startOfDay(now), 1),
  };
};

const buildTicketWhere = (
  filters: DashboardFilters,
  dateField: "createdAt" | "resolvedAt" = "createdAt",
): Prisma.TicketWhereInput => {
  const range = getRangeWindow(filters);
  const category = filters.category?.filter((value): value is TicketCategory =>
    categories.includes(value as TicketCategory),
  );

  return {
    ...(Object.keys(range).length > 0 ? { [dateField]: range } : {}),
    ...(filters.orgIds?.length ? { orgId: { in: filters.orgIds } } : {}),
    ...(filters.priority?.length ? { priority: { in: filters.priority } } : {}),
    ...(category?.length ? { category: { in: category } } : {}),
  };
};

const percent = (count: number, total: number) =>
  total === 0 ? 0 : Number(((count / total) * 100).toFixed(1));

const formatDuration = (ms: number) => {
  if (ms <= 0) {
    return "0m";
  }

  const totalMinutes = Math.round(ms / (60 * 1000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
};

const countByStatus = async (
  db: DbClient,
  filters: DashboardFilters,
  status: TicketStatus,
  dateField: "createdAt" | "resolvedAt" = "createdAt",
) =>
  db.ticket.count({
    where: {
      ...buildTicketWhere(filters, dateField),
      status,
    },
  });

const getDailyCounts = async (
  db: DbClient,
  filters: DashboardFilters,
  dateField: "createdAt" | "resolvedAt",
  where: Prisma.TicketWhereInput = {},
) => {
  const range = getRangeWindow(filters);
  const start =
    "gte" in range ? range.gte : addDays(startOfDay(new Date()), -6);
  const end = "lt" in range ? range.lt : addDays(startOfDay(new Date()), 1);
  const points = new Map<string, number>();

  for (let day = start; day && end && day < end; day = addDays(day, 1)) {
    points.set(toIsoDate(day), 0);
  }

  if (dateField === "createdAt") {
    const tickets = await db.ticket.findMany({
      where: { ...buildTicketWhere(filters, dateField), ...where },
      select: { createdAt: true },
    });

    for (const ticket of tickets) {
      const key = toIsoDate(ticket.createdAt);
      points.set(key, (points.get(key) ?? 0) + 1);
    }
  } else {
    const tickets = await db.ticket.findMany({
      where: { ...buildTicketWhere(filters, dateField), ...where },
      select: { resolvedAt: true },
    });

    for (const ticket of tickets) {
      if (ticket.resolvedAt) {
        const key = toIsoDate(ticket.resolvedAt);
        points.set(key, (points.get(key) ?? 0) + 1);
      }
    }
  }

  return [...points.entries()].map(([date, value]) => ({ date, value }));
};

export const getDashboardKpis = async (
  db: DbClient,
  filters: DashboardFilters,
): Promise<DashboardKpis> => {
  const [totalTickets, pending, awaitingReview, resolved, createdSparkline] =
    await Promise.all([
      db.ticket.count({ where: buildTicketWhere(filters) }),
      db.ticket.count({
        where: { ...buildTicketWhere(filters), status: { in: openStatuses } },
      }),
      countByStatus(db, filters, TicketStatus.REVIEW),
      countByStatus(db, filters, TicketStatus.RESOLVED, "resolvedAt"),
      getDailyCounts(db, filters, "createdAt"),
    ]);

  const resolvedTickets = await db.ticket.findMany({
    where: {
      ...buildTicketWhere(filters, "resolvedAt"),
      resolvedAt: { not: null, ...getRangeWindow(filters) },
    },
    select: { createdAt: true, resolvedAt: true },
  });
  const avgResolutionMs =
    resolvedTickets.reduce(
      (total, ticket) =>
        total +
        ((ticket.resolvedAt?.getTime() ?? ticket.createdAt.getTime()) -
          ticket.createdAt.getTime()),
      0,
    ) / (resolvedTickets.length || 1);

  return {
    totalTickets: {
      label: "Total tickets",
      value: totalTickets,
      sparkline: createdSparkline,
      subline: "Across filtered queues",
    },
    pending: {
      label: "Pending",
      value: pending,
      sparkline: await getDailyCounts(db, filters, "createdAt", {
        status: { in: openStatuses },
      }),
    },
    awaitingReview: {
      label: "Awaiting review",
      value: awaitingReview,
      sparkline: await getDailyCounts(db, filters, "createdAt", {
        status: TicketStatus.REVIEW,
      }),
    },
    resolved: {
      label: "Resolved",
      value: resolved,
      sparkline: await getDailyCounts(db, filters, "resolvedAt"),
    },
    avgResolutionTime: {
      label: "Avg. resolution time",
      value: formatDuration(avgResolutionMs),
      sparkline: [],
      subline: "Resolved tickets in range",
    },
    personalVsTeamAvgResolution: {
      personal: formatDuration(avgResolutionMs),
      team: formatDuration(avgResolutionMs),
    },
  };
};

export const getDashboardStatus = async (
  db: DbClient,
  filters: DashboardFilters,
): Promise<StatusDonut> => {
  const grouped = await db.ticket.groupBy({
    by: ["status"],
    where: buildTicketWhere(filters),
    _count: { _all: true },
  });
  const counts = new Map(grouped.map((row) => [row.status, row._count._all]));
  const total = [...counts.values()].reduce((sum, count) => sum + count, 0);

  return {
    total,
    slices: statuses.map((status) => {
      const count = counts.get(status) ?? 0;
      return { status, count, percent: percent(count, total) };
    }),
  };
};

export const getDashboardVolume = async (
  db: DbClient,
  filters: DashboardFilters,
): Promise<VolumeBar> => {
  const rows = await db.org.findMany({
    where: filters.orgIds?.length ? { id: { in: filters.orgIds } } : undefined,
    select: {
      id: true,
      displayName: true,
      tickets: {
        where: buildTicketWhere(filters),
        select: { status: true },
      },
    },
    orderBy: { displayName: "asc" },
  });

  return {
    dimensionType: "org",
    rows: rows.map((org) => {
      const counts = new Map<TicketStatus, number>();
      for (const ticket of org.tickets) {
        counts.set(ticket.status, (counts.get(ticket.status) ?? 0) + 1);
      }

      return {
        dimension: org.displayName,
        dimensionId: org.id,
        total: org.tickets.length,
        segments: statuses.map((status) => ({
          status,
          count: counts.get(status) ?? 0,
        })),
      };
    }),
  };
};

export const getDashboardTrend = async (
  db: DbClient,
  filters: DashboardFilters,
): Promise<VolumeTrend> => {
  const [created, resolved] = await Promise.all([
    getDailyCounts(db, filters, "createdAt"),
    getDailyCounts(db, filters, "resolvedAt"),
  ]);
  const createdByDate = new Map(
    created.map((point) => [point.date, point.value]),
  );
  const resolvedByDate = new Map(
    resolved.map((point) => [point.date, point.value]),
  );
  const dates = [
    ...new Set([...createdByDate.keys(), ...resolvedByDate.keys()]),
  ].sort();

  return {
    points: dates.map((date) => ({
      date,
      created: createdByDate.get(date) ?? 0,
      resolved: resolvedByDate.get(date) ?? 0,
    })),
  };
};

export const getDashboardZone3 = async (
  db: DbClient,
  filters: DashboardFilters,
): Promise<Zone3Data> => {
  const now = Date.now();
  const baseWhere = buildTicketWhere(filters);
  const [agingTickets, recentActivity, myQueue, assignedUsers, orgs] =
    await Promise.all([
      db.ticket.findMany({
        where: { ...baseWhere, status: { in: openStatuses } },
        select: { id: true, subject: true, priority: true, createdAt: true },
        orderBy: { createdAt: "asc" },
        take: 5,
      }),
      db.ticketActivity.findMany({
        where: { ticket: baseWhere },
        select: {
          type: true,
          createdAt: true,
          actor: { select: { id: true, displayName: true, avatarUrl: true } },
          ticket: { select: { id: true, subject: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      db.ticket.findMany({
        where: {
          ...baseWhere,
          status: { in: openStatuses },
          participants: { some: { role: "ASSIGNEE" } },
        },
        select: {
          id: true,
          subject: true,
          priority: true,
          status: true,
          createdAt: true,
          org: { select: { displayName: true } },
        },
        orderBy: [{ createdAt: "asc" }],
        take: 5,
      }),
      db.user.findMany({
        select: {
          id: true,
          displayName: true,
          ticketParticipants: {
            where: {
              role: "ASSIGNEE",
              ticket: { ...baseWhere, status: { in: openStatuses } },
            },
            select: {
              ticket: { select: { priority: true } },
            },
          },
        },
      }),
      db.org.findMany({
        where: filters.orgIds?.length
          ? { id: { in: filters.orgIds } }
          : undefined,
        select: {
          id: true,
          displayName: true,
          tickets: {
            where: baseWhere,
            select: { status: true, createdAt: true },
          },
        },
      }),
    ]);

  return {
    agingTickets: agingTickets.map((ticket) => {
      const ageMs = now - ticket.createdAt.getTime();
      return {
        id: ticket.id,
        subject: ticket.subject,
        priority: ticket.priority,
        createdAt: ticket.createdAt.toISOString(),
        ageMs,
        isStaleHigh: ticket.priority === "HIGH" && ageMs >= staleTicketMs,
      };
    }),
    recentActivity: recentActivity.map((activity) => ({
      actor: {
        id: activity.actor.id,
        name: activity.actor.displayName,
        ...(activity.actor.avatarUrl
          ? { avatarUrl: activity.actor.avatarUrl }
          : {}),
      },
      action: activity.type.toLowerCase().replaceAll("_", " "),
      ticket: activity.ticket,
      at: activity.createdAt.toISOString(),
    })),
    myQueue: myQueue.map((ticket) => ({
      id: ticket.id,
      subject: ticket.subject,
      priority: ticket.priority,
      status: ticket.status,
      requester: { name: ticket.org.displayName },
      ageMs: now - ticket.createdAt.getTime(),
    })),
    topUsers: assignedUsers
      .map((user) => ({
        user: { id: user.id, name: user.displayName },
        openCount: user.ticketParticipants.length,
        highPriorityCount: user.ticketParticipants.filter(
          (participant) => participant.ticket.priority === "HIGH",
        ).length,
      }))
      .filter((user) => user.openCount > 0)
      .sort((left, right) => right.openCount - left.openCount)
      .slice(0, 5),
    orgHealth: orgs.map((org) => ({
      orgId: org.id,
      orgName: org.displayName,
      openCount: org.tickets.filter((ticket) =>
        openStatuses.includes(ticket.status),
      ).length,
      staleCount: org.tickets.filter(
        (ticket) =>
          openStatuses.includes(ticket.status) &&
          now - ticket.createdAt.getTime() >= staleTicketMs,
      ).length,
      resolvedInRange: org.tickets.filter(
        (ticket) => ticket.status === TicketStatus.RESOLVED,
      ).length,
    })),
  };
};
