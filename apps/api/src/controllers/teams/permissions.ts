import { UserRole } from "@prisma/client";
import type { Response } from "express";
import type { DbUser } from "../../lib/auth";
import {
  canReadAcrossOrgs,
  ensureOrgReadable,
  ensureSuperAdmin,
  ensureTargetOrgReadable,
  ensureAllowed,
  sendForbidden,
  scopeOrgIds,
} from "../../lib/permissions";

type TeamActor = Pick<DbUser, "id" | "role" | "orgId">;
type TeamTarget = {
  id: string;
  role: UserRole | DbUser["role"];
  orgId: string;
};

export const canManageTeams = (actor: TeamActor) =>
  actor.role === UserRole.SUPER_ADMIN || actor.role === UserRole.MODERATOR;

export const scopedOrgId = (actor: TeamActor, requestedOrgId?: string) => {
  return scopeOrgIds(actor, requestedOrgId ? [requestedOrgId] : undefined)?.[0];
};

export {
  canReadAcrossOrgs,
  ensureOrgReadable,
  ensureSuperAdmin,
  sendForbidden,
};

export const ensureTargetReadable = ensureTargetOrgReadable;

export const ensureTargetManageable = (
  res: Response,
  actor: TeamActor,
  target: TeamTarget,
) => {
  if (target.id === actor.id) {
    sendForbidden(res);
    return false;
  }

  if (!ensureAllowed(res, canManageTeams(actor))) return false;

  if (actor.role === UserRole.SUPER_ADMIN) return true;

  if (
    actor.role === UserRole.MODERATOR &&
    target.orgId === actor.orgId &&
    target.id !== actor.id &&
    target.role === UserRole.USER
  ) {
    return true;
  }

  sendForbidden(res);
  return false;
};

export const ensureRoleChangeAllowed = (
  res: Response,
  actor: TeamActor,
  nextRole: UserRole | DbUser["role"],
) => {
  if (actor.role === UserRole.SUPER_ADMIN) return true;

  if (actor.role === UserRole.MODERATOR && nextRole === UserRole.MODERATOR) {
    return true;
  }

  sendForbidden(res);
  return false;
};

export const ensureInviteAllowed = (
  res: Response,
  actor: TeamActor,
  orgId: string,
  role: UserRole | DbUser["role"],
) => {
  if (!canManageTeams(actor)) {
    sendForbidden(res);
    return false;
  }

  if (actor.role === UserRole.SUPER_ADMIN) return true;

  if (
    actor.role === UserRole.MODERATOR &&
    orgId === actor.orgId &&
    role === UserRole.USER
  ) {
    return true;
  }

  sendForbidden(res);
  return false;
};
