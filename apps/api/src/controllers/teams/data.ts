import { InvitationStatus, TicketStatus, UserRole } from "@prisma/client";
import type {
  AuditEntry,
  Invitation,
  MemberDetail,
  OrgSummary,
  TeamMemberListItem,
  TeamMemberListParams,
} from "@shared/schema/teams";
import type { DbClient } from "../../lib/db";

const inactiveThresholdMs = 30 * 24 * 60 * 60 * 1000;
const staleTicketMs = 3 * 24 * 60 * 60 * 1000;

const openStatuses: TicketStatus[] = [
  TicketStatus.OPEN,
  TicketStatus.IN_PROGRESS,
  TicketStatus.ON_HOLD,
  TicketStatus.REVIEW,
];

const appBaseUrl = process.env.APP_BASE_URL ?? "https://app.filflo.example";

export const getMembers = async (
  db: DbClient,
  params: TeamMemberListParams,
): Promise<{ rows: TeamMemberListItem[]; total: number }> => {
  const query = params.q?.trim().toLowerCase();
  const where = {
    ...(params.orgId ? { orgId: params.orgId } : {}),
    ...(params.role?.length ? { role: { in: params.role as UserRole[] } } : {}),
    ...(query
      ? {
          OR: [
            { displayName: { contains: query, mode: "insensitive" as const } },
            { email: { contains: query, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      include: { org: true },
      orderBy: { displayName: "asc" },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
    }),
    db.user.count({ where }),
  ]);

  const now = Date.now();

  return {
    rows: users.map((user) => ({
      id: user.id,
      name: user.displayName,
      email: user.email,
      ...(user.avatarUrl ? { avatarUrl: user.avatarUrl } : {}),
      role: user.role,
      joinedAt: user.createdAt.toISOString(),
      lastActiveAt: user.lastActiveAt?.toISOString() ?? null,
      isInactive:
        !user.lastActiveAt ||
        now - user.lastActiveAt.getTime() > inactiveThresholdMs,
      org: { id: user.org.id, name: user.org.displayName },
    })),
    total,
  };
};

export const getMemberById = async (
  db: DbClient,
  id: string,
): Promise<MemberDetail | null> => {
  const user = await db.user.findUnique({
    where: { id },
    include: { org: true },
  });

  if (!user) return null;

  const [ticketsRequested, ticketsAssigned, resolvedAssigned] =
    await Promise.all([
      db.ticketParticipant.count({ where: { userId: id, role: "REQUESTER" } }),
      db.ticketParticipant.count({ where: { userId: id, role: "ASSIGNEE" } }),
      db.ticketParticipant.findMany({
        where: { userId: id, role: "ASSIGNEE" },
        include: {
          ticket: {
            select: { createdAt: true, resolvedAt: true, status: true },
          },
        },
      }),
    ]);

  const resolved = resolvedAssigned.filter(
    (p) => p.ticket.status === TicketStatus.RESOLVED && p.ticket.resolvedAt,
  );

  const avgResolutionMs =
    resolved.length > 0
      ? resolved.reduce(
          (sum, p) =>
            sum +
            (p.ticket.resolvedAt!.getTime() - p.ticket.createdAt.getTime()),
          0,
        ) / resolved.length
      : null;

  const now = Date.now();

  return {
    id: user.id,
    name: user.displayName,
    email: user.email,
    ...(user.avatarUrl ? { avatarUrl: user.avatarUrl } : {}),
    role: user.role,
    joinedAt: user.createdAt.toISOString(),
    lastActiveAt: user.lastActiveAt?.toISOString() ?? null,
    isInactive:
      !user.lastActiveAt ||
      now - user.lastActiveAt.getTime() > inactiveThresholdMs,
    org: { id: user.org.id, name: user.org.displayName },
    stats: {
      ticketsRequested,
      ticketsAssigned,
      avgResolutionMs,
    },
  };
};

export const getInvitations = async (
  db: DbClient,
  filters: { orgId?: string; status?: InvitationStatus },
): Promise<Invitation[]> => {
  const invitations = await db.invitation.findMany({
    where: {
      ...(filters.orgId ? { orgId: filters.orgId } : {}),
      ...(filters.status ? { status: filters.status } : {}),
    },
    include: { org: true, invitedBy: true },
    orderBy: { sentAt: "desc" },
  });

  return invitations.map((inv) => ({
    id: inv.id,
    email: inv.email,
    role: inv.role,
    orgId: inv.orgId,
    orgName: inv.org.displayName,
    invitedBy: { id: inv.invitedBy.id, name: inv.invitedBy.displayName },
    sentAt: inv.sentAt.toISOString(),
    expiresAt: inv.expiresAt.toISOString(),
    status: inv.status,
    inviteUrl: `${appBaseUrl}/invitations/${inv.id}`,
  }));
};

export const getAuditEntries = async (
  db: DbClient,
  params: { orgId?: string; limit: number; cursor?: string },
): Promise<AuditEntry[]> => {
  const entries = await db.teamAuditLog.findMany({
    where: {
      ...(params.orgId ? { orgId: params.orgId } : {}),
      ...(params.cursor ? { createdAt: { lt: new Date(params.cursor) } } : {}),
    },
    include: {
      actor: true,
      targetUser: true,
      org: true,
    },
    orderBy: { createdAt: "desc" },
    take: params.limit,
  });

  return entries.map((entry) => ({
    id: entry.id,
    at: entry.createdAt.toISOString(),
    actor: { id: entry.actor.id, name: entry.actor.displayName },
    action: entry.action,
    ...(entry.targetUser
      ? {
          targetUser: {
            id: entry.targetUser.id,
            name: entry.targetUser.displayName,
          },
        }
      : entry.targetEmail
        ? { targetUser: { id: entry.id, name: entry.targetEmail } }
        : {}),
    org: { id: entry.org.id, name: entry.org.displayName },
    ...(entry.fromRole ? { fromRole: entry.fromRole } : {}),
    ...(entry.toRole ? { toRole: entry.toRole } : {}),
    ...(entry.reason ? { reason: entry.reason } : {}),
  }));
};

export const getOrgSummaries = async (
  db: DbClient,
  orgId?: string,
): Promise<OrgSummary[]> => {
  const now = Date.now();
  const orgs = await db.org.findMany({
    where: {
      ...(orgId ? { id: orgId } : {}),
    },
    include: {
      users: { select: { role: true } },
      tickets: {
        where: { status: { in: openStatuses } },
        select: { status: true, createdAt: true },
      },
    },
    orderBy: { displayName: "asc" },
  });

  return Promise.all(
    orgs.map(async (org) => {
      const lastActivity = await db.ticketActivity.findFirst({
        where: { ticket: { orgId: org.id } },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      });

      return {
        org: { id: org.id, name: org.displayName },
        memberCount: org.users.length,
        adminCount: org.users.filter(
          (u) => u.role === UserRole.ADMIN || u.role === UserRole.SUPER_ADMIN,
        ).length,
        openTickets: org.tickets.length,
        staleTickets: org.tickets.filter(
          (t) => now - t.createdAt.getTime() >= staleTicketMs,
        ).length,
        ...(lastActivity
          ? { lastActivityAt: lastActivity.createdAt.toISOString() }
          : {}),
      };
    }),
  );
};
