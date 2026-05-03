import { z } from "zod";

export const UserRoleSchema = z.enum([
  "SUPER_ADMIN",
  "ADMIN",
  "MODERATOR",
  "USER",
]);

export const TicketStatusSchema = z.enum([
  "OPEN",
  "IN_PROGRESS",
  "ON_HOLD",
  "REVIEW",
  "RESOLVED",
  "CLOSED",
]);

export const TicketPrioritySchema = z.enum(["HIGH", "MEDIUM", "LOW"]);

export const TicketCategorySchema = z.enum(["BUG", "FEATURE_REQUEST"]);

export const TicketParticipantRoleSchema = z.enum(["REQUESTER", "ASSIGNEE"]);

export const MessageKindSchema = z.enum(["USER_MESSAGE", "FILE_ATTACHMENT"]);

export const InvitationStatusSchema = z.enum([
  "PENDING",
  "ACCEPTED",
  "EXPIRED",
  "CANCELLED",
]);

export const ViewScopeSchema = z.enum(["BUILTIN", "USER"]);

export const AuditActionSchema = z.enum([
  "ROLE_CHANGED",
  "REMOVED",
  "INVITED",
  "INVITATION_CANCELLED",
]);

export const NotificationTypeSchema = z.enum([
  "TICKET_ASSIGNED",
  "REVIEW_REQUESTED",
  "TICKET_INVITATION",
  "TICKET_RESOLVED",
  "TICKET_CLOSED",
  "NEW_TICKET_IN_ORG",
  "MESSAGE_ACTIVITY",
]);

export const IdSchema = z.string().min(1);
export const DateTimeStringSchema = z.string();

export const OrgRefSchema = z.object({
  id: IdSchema,
  name: z.string(),
});

export const UserRefSchema = z.object({
  id: IdSchema,
  name: z.string(),
  email: z.string().optional(),
  avatarUrl: z.string().optional(),
  role: UserRoleSchema,
  orgId: IdSchema,
});

export const TicketRefSchema = z.object({
  id: IdSchema,
  subject: z.string(),
  status: TicketStatusSchema,
  priority: TicketPrioritySchema,
  category: TicketCategorySchema.optional(),
  orgId: IdSchema,
  orgName: z.string(),
});

export const FileAssetSchema = z.object({
  id: IdSchema,
  orgId: IdSchema,
  name: z.string(),
  size: z.number().int().nonnegative(),
  mimeType: z.string(),
  url: z.string(),
  thumbnailUrl: z.string().optional(),
  createdAt: DateTimeStringSchema.optional(),
});

export const PageParamsSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().default(25),
});

export const IdParamsSchema = z.object({
  id: IdSchema,
});

export const EmptyResponseSchema = z.object({
  ok: z.literal(true),
});

export const DeleteResponseSchema = z.object({
  deleted: z.boolean(),
});

export type UserRole = z.infer<typeof UserRoleSchema>;
export type TicketStatus = z.infer<typeof TicketStatusSchema>;
export type TicketPriority = z.infer<typeof TicketPrioritySchema>;
export type TicketCategory = z.infer<typeof TicketCategorySchema>;
export type TicketParticipantRole = z.infer<
  typeof TicketParticipantRoleSchema
>;
export type MessageKind = z.infer<typeof MessageKindSchema>;
export type InvitationStatus = z.infer<typeof InvitationStatusSchema>;
export type ViewScope = z.infer<typeof ViewScopeSchema>;
export type AuditAction = z.infer<typeof AuditActionSchema>;
export type NotificationType = z.infer<typeof NotificationTypeSchema>;
export type OrgRef = z.infer<typeof OrgRefSchema>;
export type UserRef = z.infer<typeof UserRefSchema>;
export type TicketRef = z.infer<typeof TicketRefSchema>;
export type FileAsset = z.infer<typeof FileAssetSchema>;
export type PageParams = z.infer<typeof PageParamsSchema>;
export type IdParams = z.infer<typeof IdParamsSchema>;
export type EmptyResponse = z.infer<typeof EmptyResponseSchema>;
export type DeleteResponse = z.infer<typeof DeleteResponseSchema>;
