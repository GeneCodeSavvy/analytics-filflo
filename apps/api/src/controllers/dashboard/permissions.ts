import type { DashboardFilters } from "@shared/schema/dashboard";
import { createOrgScope, type PermissionActor } from "../../lib/permissions";

export type DashboardActor = PermissionActor;

export const scopeDashboardFilters = (
  actor: DashboardActor,
  filters: DashboardFilters,
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
