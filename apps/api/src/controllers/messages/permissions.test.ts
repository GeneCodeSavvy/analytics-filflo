import assert from "node:assert/strict";
import { TicketParticipantRole, UserRole } from "@prisma/client";
import {
  canReadThreadTarget,
  createThreadAccessWhere,
  scopeMessageFilters,
} from "./permissions";

const superAdmin = { id: "super", role: UserRole.SUPER_ADMIN, orgId: "org_a" };
const admin = { id: "admin", role: UserRole.ADMIN, orgId: "org_a" };
const moderator = { id: "mod", role: UserRole.MODERATOR, orgId: "org_a" };
const user = { id: "user", role: UserRole.USER, orgId: "org_a" };

const target = {
  orgId: "org_b",
  participants: [
    { userId: "admin", role: TicketParticipantRole.ASSIGNEE },
    { userId: "user", role: TicketParticipantRole.REQUESTER },
  ],
};

assert.equal(canReadThreadTarget(superAdmin, target), true);
assert.equal(canReadThreadTarget(admin, target), true);
assert.equal(canReadThreadTarget(moderator, target), false);
assert.equal(canReadThreadTarget(user, target), true);

assert.deepEqual(scopeMessageFilters(moderator, { tab: "org" }), {
  allowed: true,
  filters: { tab: "org", orgId: "org_a" },
});

assert.deepEqual(
  scopeMessageFilters(moderator, { tab: "org", orgId: "org_b" }),
  {
    allowed: false,
    filters: { tab: "org", orgId: "org_a" },
  },
);

assert.deepEqual(createThreadAccessWhere(admin), {
  ticket: {
    participants: {
      some: { userId: "admin", role: TicketParticipantRole.ASSIGNEE },
    },
  },
});

assert.deepEqual(createThreadAccessWhere(user), {
  ticket: {
    participants: {
      some: { userId: "user" },
    },
  },
});
