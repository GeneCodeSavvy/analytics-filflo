import type { Response } from "express";
import {
  createOrgScope,
  ensureAllowed,
  ensureSuperAdmin,
  ensureTargetOrgReadable,
  type PermissionActor,
} from "../../lib/permissions";
import type { TicketFilters } from "@shared/schema/tickets";

export type TicketActor = PermissionActor;

export const scopeTicketFilters = (
  actor: TicketActor,
  filters: TicketFilters,
) => {
  const scope = createOrgScope(actor, filters.orgIds);

  return {
    allowed: scope.allowed,
    filters: {
      ...filters,
      orgIds: scope.orgIds,
    },
  };
};

export const scopeTicketParams = <Params extends TicketFilters>(
  actor: TicketActor,
  params: Params,
) => {
  const scoped = scopeTicketFilters(actor, params);

  return {
    allowed: scoped.allowed,
    params: {
      ...params,
      orgIds: scoped.filters.orgIds,
    },
  };
};

export const ensureTicketOrgReadable = (
  res: Response,
  actor: TicketActor,
  ticket: { orgId: string },
) => ensureTargetOrgReadable(res, actor, ticket);

export const ensureTicketAssignable = (res: Response, actor: TicketActor) =>
  ensureSuperAdmin(res, actor);

export const ensureBulkTicketActionAllowed = (
  res: Response,
  actor: TicketActor,
  action: string,
) => ensureAllowed(res, action !== "assign" || actor.role === "SUPER_ADMIN");
