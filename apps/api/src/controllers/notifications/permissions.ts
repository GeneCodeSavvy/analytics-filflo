import { Prisma, TicketParticipantRole, UserRole } from "@prisma/client";
import type { Response } from "express";
import type { NotificationFilters } from "@shared/schema/notifications";
import { ensureAllowed, type PermissionActor } from "../../lib/permissions";

export type NotificationActor = PermissionActor & { email: string };

export type TicketAccessTarget = {
  orgId: string;
  participants: Array<{
    userId: string;
    role: TicketParticipantRole;
  }>;
};

export type InvitationAccessTarget = {
  email: string;
};

export const createNotificationAccessWhere = (
  actor: Pick<NotificationActor, "id">,
  filters?: Pick<NotificationFilters, "type" | "ticketId" | "orgId">,
): Prisma.NotificationWhereInput => ({
  recipientId: actor.id,
  ...(filters?.type?.length ? { type: { in: filters.type } } : {}),
  ...(filters?.ticketId ? { ticketId: filters.ticketId } : {}),
  ...(filters?.orgId
    ? {
        ticket: {
          orgId: filters.orgId,
        },
      }
    : {}),
});

const isAssigned = (actor: NotificationActor, target: TicketAccessTarget) =>
  target.participants.some(
    (participant) =>
      participant.userId === actor.id &&
      participant.role === TicketParticipantRole.ASSIGNEE,
  );

const isParticipant = (actor: NotificationActor, target: TicketAccessTarget) =>
  target.participants.some((participant) => participant.userId === actor.id);

export const canAccessTicketTarget = (
  actor: NotificationActor,
  target: TicketAccessTarget,
) => {
  if (actor.role === UserRole.SUPER_ADMIN) return true;
  if (actor.role === UserRole.MODERATOR) return target.orgId === actor.orgId;
  if (actor.role === UserRole.ADMIN) return isAssigned(actor, target);
  return isParticipant(actor, target);
};

export const canRespondToInvitationTarget = (
  actor: NotificationActor,
  target: InvitationAccessTarget,
) => target.email.toLowerCase() === actor.email.toLowerCase();

export const ensureTicketAccessible = (
  res: Response,
  actor: NotificationActor,
  target: TicketAccessTarget,
) => ensureAllowed(res, canAccessTicketTarget(actor, target));

export const ensureInvitationRespondable = (
  res: Response,
  actor: NotificationActor,
  target: InvitationAccessTarget,
) => ensureAllowed(res, canRespondToInvitationTarget(actor, target));
