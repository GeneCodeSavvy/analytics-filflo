import { z } from "zod";
import {
  InvitationStatusSchema,
  NotificationTypeSchema,
  TicketRefSchema,
  UserRefSchema,
} from "./domain";

export const NotificationStateSchema = z.enum(["inbox", "read", "done"]);
export const NotificationTierSchema = z.enum([
  "action_required",
  "status_update",
  "fyi",
]);

const LatestEventSchema = z.object({
  description: z.string(),
  actor: UserRefSchema,
  at: z.string(),
});

const NotificationTicketSchema = TicketRefSchema.pick({
  id: true,
  subject: true,
  orgId: true,
  orgName: true,
});

const BaseNotificationRowSchema = z.object({
  id: z.string(),
  type: NotificationTypeSchema,
  tier: NotificationTierSchema,
  state: NotificationStateSchema,
  ticket: NotificationTicketSchema.optional(),
  latestEvent: LatestEventSchema,
  eventCount: z.number().int().nonnegative(),
  readAt: z.string().optional(),
});

export const NotificationRowSchema = BaseNotificationRowSchema.extend({
  invitationId: z.string().optional(),
  invitationStatus: InvitationStatusSchema.optional(),
});

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
]);

export const InvitationResponsePayloadSchema = z.object({
  response: z.enum(["ACCEPTED", "CANCELLED"]),
});

export type NotificationState = z.infer<typeof NotificationStateSchema>;
export type NotificationTier = z.infer<typeof NotificationTierSchema>;
export type NotificationType = z.infer<typeof NotificationTypeSchema>;
export type NotificationRow = z.infer<typeof NotificationRowSchema>;
export type NotificationListResponse = z.infer<
  typeof NotificationListResponseSchema
>;
export type NotificationCountResponse = z.infer<
  typeof NotificationCountResponseSchema
>;
export type NotificationEvent = z.infer<typeof NotificationEventSchema>;
export type NotificationThread = z.infer<typeof NotificationThreadSchema>;
export type NotificationFilters = z.infer<typeof NotificationFiltersSchema>;
export type NotificationListParams = z.infer<
  typeof NotificationListParamsSchema
>;
export type BulkNotificationPayload = z.infer<
  typeof BulkNotificationPayloadSchema
>;
export type InvitationResponsePayload = z.infer<
  typeof InvitationResponsePayloadSchema
>;
