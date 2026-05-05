import assert from "node:assert/strict";
import { UserRole } from "@prisma/client";
import { scopeDashboardFilters } from "./permissions";

const baseFilters = {
  range: "30d" as const,
};

const superAdmin = {
  id: "user_super",
  role: UserRole.SUPER_ADMIN,
  orgId: "org_a",
};

const admin = {
  id: "user_admin",
  role: UserRole.ADMIN,
  orgId: "org_a",
};

const moderator = {
  id: "user_mod",
  role: UserRole.MODERATOR,
  orgId: "org_a",
};

assert.deepEqual(
  scopeDashboardFilters(superAdmin, {
    ...baseFilters,
    orgIds: ["org_b", "org_c"],
  }),
  {
    allowed: true,
    filters: { ...baseFilters, orgIds: ["org_b", "org_c"] },
  },
);

assert.deepEqual(
  scopeDashboardFilters(admin, {
    ...baseFilters,
    orgIds: ["org_b"],
  }),
  {
    allowed: true,
    filters: { ...baseFilters, orgIds: ["org_b"] },
  },
);

assert.deepEqual(scopeDashboardFilters(moderator, baseFilters), {
  allowed: true,
  filters: { ...baseFilters, orgIds: ["org_a"] },
});

assert.deepEqual(
  scopeDashboardFilters(moderator, {
    ...baseFilters,
    orgIds: ["org_b"],
  }),
  {
    allowed: false,
    filters: { ...baseFilters, orgIds: ["org_a"] },
  },
);
