import { UserRole } from "@prisma/client";
import type { Response } from "express";
import type { DbUser } from "./auth";
import { sendError } from "./controllers";

export type PermissionActor = Pick<DbUser, "id" | "role" | "orgId">;

export type OrgScope = {
  allowed: boolean;
  orgIds?: string[];
};

export const hasAnyRole = (
  actor: PermissionActor,
  roles: readonly UserRole[],
) => roles.includes(actor.role as UserRole);

export const isSuperAdmin = (actor: PermissionActor) =>
  actor.role === UserRole.SUPER_ADMIN;

export const canReadAcrossOrgs = (actor: PermissionActor) =>
  hasAnyRole(actor, [UserRole.SUPER_ADMIN, UserRole.ADMIN]);

export const scopeOrgIds = (
  actor: PermissionActor,
  requestedOrgIds?: string[],
): string[] | undefined => {
  if (canReadAcrossOrgs(actor)) {
    return requestedOrgIds;
  }

  return [actor.orgId];
};

export const createOrgScope = (
  actor: PermissionActor,
  requestedOrgIds?: string[],
): OrgScope => {
  const orgIds = scopeOrgIds(actor, requestedOrgIds);

  if (canReadAcrossOrgs(actor)) {
    return { allowed: true, orgIds };
  }

  const requestedAllowed =
    !requestedOrgIds?.length ||
    requestedOrgIds.every((id) => id === actor.orgId);

  return { allowed: requestedAllowed, orgIds };
};

export const canReadOrg = (actor: PermissionActor, requestedOrgId?: string) =>
  createOrgScope(actor, requestedOrgId ? [requestedOrgId] : undefined).allowed;

export const canReadTargetOrg = (
  actor: PermissionActor,
  target: Pick<PermissionActor, "orgId">,
) => canReadAcrossOrgs(actor) || target.orgId === actor.orgId;

export const sendForbidden = (res: Response, error = "Forbidden") =>
  sendError(res, 403, error);

export const ensureAllowed = (
  res: Response,
  allowed: boolean,
  error = "Forbidden",
) => {
  if (allowed) return true;

  sendForbidden(res, error);
  return false;
};

export const ensureSuperAdmin = (res: Response, actor: PermissionActor) =>
  ensureAllowed(res, isSuperAdmin(actor));

export const ensureOrgReadable = (
  res: Response,
  actor: PermissionActor,
  requestedOrgId?: string,
) => ensureAllowed(res, canReadOrg(actor, requestedOrgId));

export const ensureTargetOrgReadable = (
  res: Response,
  actor: PermissionActor,
  target: Pick<PermissionActor, "orgId">,
) => ensureAllowed(res, canReadTargetOrg(actor, target));
