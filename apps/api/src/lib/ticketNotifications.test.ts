import assert from "node:assert/strict";
import {
  NotificationType,
  TicketParticipantRole,
  TicketStatus,
  UserRole,
} from "@prisma/client";
import {
  buildTicketNotificationRecords,
  getResponsibleTicketUserIds,
} from "./ticketNotifications";

const users = [
  { id: "super", role: UserRole.SUPER_ADMIN, orgId: "org_a" },
  { id: "admin_assigned", role: UserRole.ADMIN, orgId: "org_a" },
  { id: "admin_unassigned", role: UserRole.ADMIN, orgId: "org_a" },
  { id: "moderator_same_org", role: UserRole.MODERATOR, orgId: "org_a" },
  { id: "moderator_other_org", role: UserRole.MODERATOR, orgId: "org_b" },
  { id: "requester", role: UserRole.USER, orgId: "org_a" },
  { id: "added_user", role: UserRole.USER, orgId: "org_b" },
];

const ticket = {
  id: "ticket_1",
  subject: "Broken billing sync",
  orgId: "org_a",
  status: TicketStatus.OPEN,
  participants: [
    { userId: "requester", role: TicketParticipantRole.REQUESTER },
    { userId: "admin_assigned", role: TicketParticipantRole.ASSIGNEE },
    { userId: "admin_unassigned", role: TicketParticipantRole.REQUESTER },
    { userId: "added_user", role: TicketParticipantRole.ASSIGNEE },
  ],
};

assert.deepEqual(
  getResponsibleTicketUserIds({
    users,
    ticket,
    actorId: "requester",
  }),
  ["super", "admin_assigned", "moderator_same_org", "added_user"],
);

assert.deepEqual(
  buildTicketNotificationRecords({
    type: NotificationType.NEW_TICKET_IN_ORG,
    actorId: "requester",
    users,
    ticket,
  }).map((record) => ({
    recipientId: record.recipientId,
    type: record.type,
    ticketId: record.ticketId,
    title: record.title,
  })),
  [
    {
      recipientId: "super",
      type: NotificationType.NEW_TICKET_IN_ORG,
      ticketId: "ticket_1",
      title: "New ticket: Broken billing sync",
    },
    {
      recipientId: "admin_assigned",
      type: NotificationType.NEW_TICKET_IN_ORG,
      ticketId: "ticket_1",
      title: "New ticket: Broken billing sync",
    },
    {
      recipientId: "moderator_same_org",
      type: NotificationType.NEW_TICKET_IN_ORG,
      ticketId: "ticket_1",
      title: "New ticket: Broken billing sync",
    },
    {
      recipientId: "added_user",
      type: NotificationType.NEW_TICKET_IN_ORG,
      ticketId: "ticket_1",
      title: "New ticket: Broken billing sync",
    },
  ],
);

// actor excluded; admin_unassigned is ADMIN but not an assignee so ineligible
assert.deepEqual(
  buildTicketNotificationRecords({
    type: NotificationType.TICKET_ASSIGNED,
    actorId: "super",
    users,
    ticket,
    explicitRecipientIds: ["admin_assigned", "admin_unassigned", "super"],
  }).map((record) => record.recipientId),
  ["admin_assigned"],
);

// cross-org user not in eligible set — must be excluded even when explicitly listed
const crossOrgUser = { id: "outsider", role: UserRole.USER, orgId: "org_c" };
assert.deepEqual(
  buildTicketNotificationRecords({
    type: NotificationType.TICKET_ASSIGNED,
    actorId: "super",
    users: [...users, crossOrgUser],
    ticket,
    explicitRecipientIds: ["admin_assigned", "outsider"],
  }).map((record) => record.recipientId),
  ["admin_assigned"],
);
