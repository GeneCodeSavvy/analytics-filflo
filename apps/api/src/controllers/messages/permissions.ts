import { Prisma, TicketParticipantRole, UserRole } from "@prisma/client";
import type { Response } from "express";
import type { MessageFilters } from "@shared/schema/messages";
import {
  canReadAcrossOrgs,
  ensureAllowed,
  type PermissionActor,
} from "../../lib/permissions";

export type MessageActor = PermissionActor;

export type ThreadAccessTarget = {
  orgId: string;
  participants: Array<{
    userId: string;
    role: TicketParticipantRole;
  }>;
};

const isAssigned = (actor: MessageActor, target: ThreadAccessTarget) =>
  target.participants.some(
    (participant) =>
      participant.userId === actor.id &&
      participant.role === TicketParticipantRole.ASSIGNEE,
  );

const isParticipant = (actor: MessageActor, target: ThreadAccessTarget) =>
  target.participants.some((participant) => participant.userId === actor.id);

export const canReadThreadTarget = (
  actor: MessageActor,
  target: ThreadAccessTarget,
) => {
  if (actor.role === UserRole.SUPER_ADMIN) return true;
  if (actor.role === UserRole.MODERATOR) return target.orgId === actor.orgId;
  if (actor.role === UserRole.ADMIN) return isAssigned(actor, target);
  return isParticipant(actor, target);
};

export const canSendToThreadTarget = canReadThreadTarget;

export const ensureThreadReadable = (
  res: Response,
  actor: MessageActor,
  target: ThreadAccessTarget,
) => ensureAllowed(res, canReadThreadTarget(actor, target));

export const ensureThreadWritable = (
  res: Response,
  actor: MessageActor,
  target: ThreadAccessTarget,
) => ensureAllowed(res, canSendToThreadTarget(actor, target));

export const scopeMessageFilters = (
  actor: MessageActor,
  filters: MessageFilters,
) => {
  if (canReadAcrossOrgs(actor)) {
    return { allowed: true, filters };
  }

  if (filters.orgId && filters.orgId !== actor.orgId) {
    return {
      allowed: false,
      filters: { ...filters, orgId: actor.orgId },
    };
  }

  if (actor.role === UserRole.MODERATOR || filters.tab === "org") {
    return {
      allowed: true,
      filters: { ...filters, orgId: actor.orgId },
    };
  }

  return { allowed: true, filters };
};

export const createThreadAccessWhere = (
  actor: MessageActor,
): Prisma.ThreadWhereInput => {
  if (actor.role === UserRole.SUPER_ADMIN) return {};

  if (actor.role === UserRole.MODERATOR) {
    return { ticket: { orgId: actor.orgId } };
  }

  if (actor.role === UserRole.ADMIN) {
    return {
      ticket: {
        participants: {
          some: { userId: actor.id, role: TicketParticipantRole.ASSIGNEE },
        },
      },
    };
  }

  return {
    ticket: {
      participants: {
        some: { userId: actor.id },
      },
    },
  };
};
