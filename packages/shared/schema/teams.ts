import { z } from "zod";
import {
  AuditActionSchema,
  InvitationStatusSchema,
  OrgRefSchema,
  PageParamsSchema,
  UserRefSchema,
  UserRoleSchema,
} from "./domain";

export const TeamRoleSchema = UserRoleSchema;

export const TeamMemberListParamsSchema = PageParamsSchema.extend({
  orgId: z.string().optional(),
  role: UserRoleSchema.array().optional(),
  q: z.string().optional(),
});

export const TeamAuditParamsSchema = z.object({
  orgId: z.string().optional(),
  limit: z.number().int().positive().default(50),
  cursor: z.string().optional(),
});

export const TeamInvitationListParamsSchema = z.object({
  orgId: z.string().optional(),
  status: InvitationStatusSchema.optional(),
});

export const MemberRowSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  avatarUrl: z.string().optional(),
  role: UserRoleSchema,
  joinedAt: z.string(),
  lastActiveAt: z.string().nullable().optional(),
  isInactive: z.boolean(),
});

export const MemberDetailSchema = MemberRowSchema.extend({
  org: OrgRefSchema,
  stats: z.object({
    ticketsRequested: z.number(),
    ticketsAssigned: z.number(),
    avgResolutionMs: z.number().nullable().optional(),
  }),
});

export const TeamMemberListResponseSchema = z.object({
  rows: MemberRowSchema.array(),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
  serverTime: z.string().optional(),
});

export const InvitationSchema = z.object({
  id: z.string(),
  email: z.string(),
  role: UserRoleSchema,
  orgId: z.string(),
  orgName: z.string(),
  invitedBy: UserRefSchema.pick({ id: true, name: true }),
  sentAt: z.string(),
  expiresAt: z.string(),
  status: InvitationStatusSchema,
  inviteUrl: z.string(),
});

export const AuditEntrySchema = z.object({
  id: z.string(),
  at: z.string(),
  actor: UserRefSchema.pick({ id: true, name: true }),
  action: AuditActionSchema,
  targetUser: UserRefSchema.pick({ id: true, name: true }).optional(),
  targetEmail: z.string().optional(),
  org: OrgRefSchema,
  fromRole: UserRoleSchema.optional(),
  toRole: UserRoleSchema.optional(),
  reason: z.string().optional(),
});

export const OrgSummarySchema = z.object({
  org: OrgRefSchema,
  memberCount: z.number(),
  adminCount: z.number(),
  openTickets: z.number(),
  staleTickets: z.number(),
  lastActivityAt: z.string().optional(),
});

export const InvitePayloadSchema = z.object({
  email: z.string(),
  role: UserRoleSchema,
  orgId: z.string(),
  message: z.string().optional(),
});

export const RoleChangePayloadSchema = z.object({
  role: UserRoleSchema,
  reason: z.string().optional(),
});

export const RemoveMemberParamsSchema = z.object({
  orgId: z.string().optional(),
});

export const TeamMemberParamsSchema = z.object({
  id: z.string().min(1),
});

export const TeamInvitationParamsSchema = z.object({
  id: z.string().min(1),
});

export const BulkMemberOpSchema = z.object({
  ids: z.string().array(),
  orgId: z.string().optional(),
  op: z.enum(["change_role", "remove"]),
  payload: RoleChangePayloadSchema.optional(),
});

export const BulkMemberResultSchema = z.object({
  succeeded: z.string().array(),
  failed: z.array(z.object({ id: z.string(), reason: z.string() })),
});

export type TeamRole = z.infer<typeof TeamRoleSchema>;
export type InvitationStatus = z.infer<typeof InvitationStatusSchema>;
export type TeamMemberListParams = z.infer<typeof TeamMemberListParamsSchema>;
export type TeamAuditParams = z.infer<typeof TeamAuditParamsSchema>;
export type TeamInvitationListParams = z.infer<
  typeof TeamInvitationListParamsSchema
>;
export type MemberPermissions = z.infer<typeof MemberPermissionsSchema>;
export type MemberRow = z.infer<typeof MemberRowSchema>;
export type MemberDetail = z.infer<typeof MemberDetailSchema>;
export type TeamMemberListResponse = z.infer<
  typeof TeamMemberListResponseSchema
>;
export type Invitation = z.infer<typeof InvitationSchema>;
export type AuditEntry = z.infer<typeof AuditEntrySchema>;
export type OrgSummary = z.infer<typeof OrgSummarySchema>;
export type InvitePayload = z.infer<typeof InvitePayloadSchema>;
export type RoleChangePayload = z.infer<typeof RoleChangePayloadSchema>;
export type RemoveMemberParams = z.infer<typeof RemoveMemberParamsSchema>;
export type TeamMemberParams = z.infer<typeof TeamMemberParamsSchema>;
export type TeamInvitationParams = z.infer<typeof TeamInvitationParamsSchema>;
export type BulkMemberOp = z.infer<typeof BulkMemberOpSchema>;
export type BulkMemberResult = z.infer<typeof BulkMemberResultSchema>;
