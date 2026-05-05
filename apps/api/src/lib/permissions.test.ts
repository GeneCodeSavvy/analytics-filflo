import assert from "node:assert/strict";
import { UserRole } from "@prisma/client";
import {
  canReadAcrossOrgs,
  createOrgScope,
  isSuperAdmin,
  scopeOrgIds,
} from "./permissions";

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

assert.equal(canReadAcrossOrgs(superAdmin), true);
assert.equal(canReadAcrossOrgs(admin), true);
assert.equal(canReadAcrossOrgs(moderator), false);
assert.equal(isSuperAdmin(superAdmin), true);
assert.equal(isSuperAdmin(admin), false);

assert.deepEqual(scopeOrgIds(superAdmin, ["org_b", "org_c"]), [
  "org_b",
  "org_c",
]);
assert.deepEqual(scopeOrgIds(moderator, ["org_b", "org_c"]), ["org_a"]);
assert.deepEqual(scopeOrgIds(moderator), ["org_a"]);

assert.deepEqual(createOrgScope(superAdmin, ["org_b"]), {
  allowed: true,
  orgIds: ["org_b"],
});
assert.deepEqual(createOrgScope(moderator, ["org_a"]), {
  allowed: true,
  orgIds: ["org_a"],
});
assert.deepEqual(createOrgScope(moderator, ["org_b"]), {
  allowed: false,
  orgIds: ["org_a"],
});
