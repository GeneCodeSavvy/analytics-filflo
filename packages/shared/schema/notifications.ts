import { z } from "zod";

export const NotificationStateSchema = z.enum(["inbox", "read", "done"]);
export const NotificationTierSchema = z.enum([
  "action_required",
  "status_update",
  "fyi",
]);
export const NotificationTypeSchema = z.enum([
  "ticket_assigned",
  "review_requested",
  "ticket_invitation",
  "mention",
  "ticket_resolved",
  "ticket_closed",
  "new_ticket_in_org",
  "message_activity",
]);

const UserRefSchema = z.object({
  id: z.string(),
  name: z.string(),
  avatarUrl: z.string().optional(),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "MODERATOR", "USER"]),
  orgId: z.string(),
});

const LatestEventSchema = z.object({
  description: z.string(),
  actor: UserRefSchema,
  at: z.string(),
});

const BaseNotificationRowSchema = z.object({
  id: z.string(),
  tier: NotificationTierSchema,
  state: NotificationStateSchema,
  ticket: z.object({
    id: z.string(),
    subject: z.string(),
    orgId: z.string(),
    orgName: z.string(),
  }),
  latestEvent: LatestEventSchema,
  eventCount: z.number().int().nonnegative(),
  snoozedUntil: z.string().optional(),
});

export const NotificationRowSchema = z.discriminatedUnion("type", [
  BaseNotificationRowSchema.extend({
    type: z.literal("ticket_invitation"),
    invitationId: z.string(),
    invitationStatus: z.enum(["pending", "accepted", "rejected", "expired"]),
  }),
  BaseNotificationRowSchema.extend({
    type: z.literal("ticket_assigned"),
  }),
  BaseNotificationRowSchema.extend({
    type: z.literal("review_requested"),
  }),
  BaseNotificationRowSchema.extend({
    type: z.literal("ticket_resolved"),
  }),
  BaseNotificationRowSchema.extend({
    type: z.literal("ticket_closed"),
  }),
  BaseNotificationRowSchema.extend({
    type: z.literal("new_ticket_in_org"),
  }),
  BaseNotificationRowSchema.extend({
    type: z.literal("message_activity"),
  }),
]);

export const NotificationListResponseSchema = z.object({
  rows: NotificationRowSchema.array(),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
});

export const NotificationCountResponseSchema = z.object({
  inbox: z.number().int().nonnegative(),
});

export const NotificationEventSchema = z.object({
  id: z.string(),
  type: NotificationTypeSchema,
  description: z.string(),
  actor: UserRefSchema,
  at: z.string(),
});

export const NotificationThreadSchema = z.object({
  notificationGroupId: z.string(),
  events: NotificationEventSchema.array(),
});

export const NotificationFiltersSchema = z.object({
  tab: z.enum(["inbox", "read", "done", "all"]).default("inbox"),
  type: NotificationTypeSchema.array().optional(),
  ticketId: z.string().optional(),
  orgId: z.string().optional(),
});

export const NotificationListParamsSchema = NotificationFiltersSchema.extend({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().default(25),
});

export const SnoozePayloadSchema = z.object({
  snoozedUntil: z.string().datetime(),
});

export const BulkNotificationPayloadSchema = z.discriminatedUnion("op", [
  z.object({
    op: z.literal("read"),
    scope: z.enum(["ids", "ticket"]),
    ids: z.string().array().min(1).max(500).optional(),
    ticketId: z.string().optional(),
  }),
  z.object({
    op: z.literal("done"),
    scope: z.enum(["ids", "ticket"]),
    ids: z.string().array().min(1).max(500).optional(),
    ticketId: z.string().optional(),
  }),
  z.object({
    op: z.literal("unread"),
    scope: z.enum(["ids", "ticket"]),
    ids: z.string().array().min(1).max(500).optional(),
    ticketId: z.string().optional(),
  }),
  z.object({
    op: z.literal("snooze"),
    scope: z.literal("ids"),
    ids: z.string().array().min(1).max(500),
    snoozedUntil: z.string().datetime(),
  }),
]);

export const InvitationResponsePayloadSchema = z.object({
  response: z.enum(["accepted", "rejected"]),
});

export type NotificationState = z.infer<typeof NotificationStateSchema>;
export type NotificationTier = z.infer<typeof NotificationTierSchema>;
export type NotificationType = z.infer<typeof NotificationTypeSchema>;
export type NotificationRow = z.infer<typeof NotificationRowSchema>;
export type NotificationListResponse = z.infer<typeof NotificationListResponseSchema>;
export type NotificationCountResponse = z.infer<typeof NotificationCountResponseSchema>;
export type NotificationEvent = z.infer<typeof NotificationEventSchema>;
export type NotificationThread = z.infer<typeof NotificationThreadSchema>;
export type NotificationFilters = z.infer<typeof NotificationFiltersSchema>;
export type NotificationListParams = z.infer<typeof NotificationListParamsSchema>;
export type SnoozePayload = z.infer<typeof SnoozePayloadSchema>;
export type BulkNotificationPayload = z.infer<typeof BulkNotificationPayloadSchema>;
export type InvitationResponsePayload = z.infer<typeof InvitationResponsePayloadSchema>;
