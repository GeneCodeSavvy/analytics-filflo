import assert from "node:assert/strict";
import { TicketParticipantRole, UserRole } from "@prisma/client";
import {
  canAccessTicketTarget,
  canRespondToInvitationTarget,
  createNotificationAccessWhere,
} from "./permissions";

const superAdmin = {
  id: "super",
  email: "super@example.com",
  role: UserRole.SUPER_ADMIN,
  orgId: "org_a",
};
const admin = {
  id: "admin",
  email: "admin@example.com",
  role: UserRole.ADMIN,
  orgId: "org_a",
};
const moderator = {
  id: "mod",
  email: "mod@example.com",
  role: UserRole.MODERATOR,
  orgId: "org_a",
};
const user = {
  id: "user",
  email: "user@example.com",
  role: UserRole.USER,
  orgId: "org_a",
};

const target = {
  orgId: "org_b",
  participants: [
    { userId: "admin", role: TicketParticipantRole.ASSIGNEE },
    { userId: "user", role: TicketParticipantRole.REQUESTER },
  ],
};

assert.deepEqual(createNotificationAccessWhere(admin), {
  recipientId: "admin",
});

assert.deepEqual(
  createNotificationAccessWhere(admin, {
    ticketId: "ticket_a",
    orgId: "org_a",
    type: ["MESSAGE_ACTIVITY"],
  }),
  {
    recipientId: "admin",
    type: { in: ["MESSAGE_ACTIVITY"] },
    ticketId: "ticket_a",
    ticket: { orgId: "org_a" },
  },
);

assert.equal(canAccessTicketTarget(superAdmin, target), true);
assert.equal(canAccessTicketTarget(admin, target), true);
assert.equal(canAccessTicketTarget(moderator, target), false);
assert.equal(canAccessTicketTarget(user, target), true);

assert.equal(
  canRespondToInvitationTarget(user, { email: "USER@example.com" }),
  true,
);
assert.equal(
  canRespondToInvitationTarget(user, { email: "someone@example.com" }),
  false,
);
