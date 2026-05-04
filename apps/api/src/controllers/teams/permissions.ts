import { UserRole } from "@prisma/client";
import type { Response } from "express";
import type { DbUser } from "../../lib/auth";
import { sendError } from "../../lib/controllers";

type TeamActor = Pick<DbUser, "id" | "role" | "orgId">;
type TeamTarget = {
  id: string;
  role: UserRole | DbUser["role"];
  orgId: string;
};

export const canReadAcrossOrgs = (actor: TeamActor) =>
  actor.role === UserRole.SUPER_ADMIN || actor.role === UserRole.ADMIN;

export const canManageTeams = (actor: TeamActor) =>
  actor.role === UserRole.SUPER_ADMIN || actor.role === UserRole.MODERATOR;

export const ensureSuperAdmin = (res: Response, actor: TeamActor) => {
  if (actor.role === UserRole.SUPER_ADMIN) return true;

  sendForbidden(res);
  return false;
};

export const sendForbidden = (res: Response, error = "Forbidden") =>
  sendError(res, 403, error);

export const scopedOrgId = (actor: TeamActor, requestedOrgId?: string) => {
  if (canReadAcrossOrgs(actor)) return requestedOrgId;
  return actor.orgId;
};

export const ensureOrgReadable = (
  res: Response,
  actor: TeamActor,
  requestedOrgId?: string,
) => {
  if (canReadAcrossOrgs(actor)) return true;
  if (!requestedOrgId || requestedOrgId === actor.orgId) return true;

  sendForbidden(res);
  return false;
};

export const ensureTargetReadable = (
  res: Response,
  actor: TeamActor,
  target: Pick<TeamTarget, "orgId">,
) => {
  if (canReadAcrossOrgs(actor) || target.orgId === actor.orgId) return true;

  sendForbidden(res);
  return false;
};

export const ensureTargetManageable = (
  res: Response,
  actor: TeamActor,
  target: TeamTarget,
) => {
  if (target.id === actor.id) {
    sendForbidden(res);
    return false;
  }

  if (!canManageTeams(actor)) {
    sendForbidden(res);
    return false;
  }

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
