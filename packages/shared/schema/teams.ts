import { z } from "zod";

export const TeamRoleSchema = z.enum([
  "SUPER_ADMIN",
  "ADMIN",
  "MODERATOR",
  "USER",
]);

export const InvitationStatusSchema = z.enum([
  "pending",
  "accepted",
  "expired",
  "cancelled",
]);

export const TeamMemberListParamsSchema = z.object({
  orgId: z.string().optional(),
  role: TeamRoleSchema.array().optional(),
  q: z.string().optional(),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().default(25),
});

export const TeamAuditParamsSchema = z.object({
  orgId: z.string().optional(),
  limit: z.number().int().positive().default(50).optional(),
  cursor: z.string().optional(),
});

export const TeamInvitationListParamsSchema = z.object({
  orgId: z.string().optional(),
  status: InvitationStatusSchema.optional(),
});

const UserRefSchema = z.object({
  id: z.string(),
  name: z.string(),
});

const OrgRefSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const MemberPermissionsSchema = z.object({
  canChangeRole: z.boolean(),
  canRemove: z.boolean(),
  canMoveTo: z.boolean(),
});

export const MemberRowSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  avatarUrl: z.string().optional(),
  role: TeamRoleSchema,
  orgId: z.string(),
  joinedAt: z.string(),
  lastActiveAt: z.string().optional(),
  isInactive: z.boolean(),
  permissions: MemberPermissionsSchema,
});

export const MemberDetailSchema = MemberRowSchema.extend({
  orgMemberships: z.array(
    z.object({
      org: OrgRefSchema,
      role: TeamRoleSchema,
      joinedAt: z.string(),
    }),
  ),
  stats: z.object({
    ticketsCreated: z.number(),
    ticketsAssigned: z.number(),
    avgResolutionMs: z.number().optional(),
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
  role: TeamRoleSchema,
  orgId: z.string(),
  orgName: z.string(),
  invitedBy: UserRefSchema,
  sentAt: z.string(),
  expiresAt: z.string(),
  status: InvitationStatusSchema,
  inviteUrl: z.string(),
});

export const AuditEntrySchema = z.object({
  id: z.string(),
  at: z.string(),
  actor: UserRefSchema,
  action: z.enum([
    "role_changed",
    "removed",
    "invited",
    "invitation_cancelled",
  ]),
  targetUser: UserRefSchema,
  org: OrgRefSchema,
  fromRole: TeamRoleSchema.optional(),
  toRole: TeamRoleSchema.optional(),
  reason: z.string().optional(),
});

export const OrgSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  memberCount: z.number(),
  roleCounts: z.object({
    SUPER_ADMIN: z.number().optional(),
    ADMIN: z.number().optional(),
    MODERATOR: z.number().optional(),
    USER: z.number().optional(),
  }),
  pendingInvitationCount: z.number().optional(),
});

export const InvitePayloadSchema = z.object({
  email: z.string(),
  role: TeamRoleSchema,
  orgId: z.string(),
  message: z.string().optional(),
});

export const RoleChangePayloadSchema = z.object({
  role: TeamRoleSchema,
  orgId: z.string().optional(),
  reason: z.string().optional(),
});

export const MoveMemberPayloadSchema = z.object({
  fromOrgId: z.string().optional(),
  toOrgId: z.string(),
});

export const RemoveMemberParamsSchema = z.object({
  orgId: z.string().optional(),
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
export type MoveMemberPayload = z.infer<typeof MoveMemberPayloadSchema>;
export type RemoveMemberParams = z.infer<typeof RemoveMemberParamsSchema>;
export type BulkMemberOp = z.infer<typeof BulkMemberOpSchema>;
export type BulkMemberResult = z.infer<typeof BulkMemberResultSchema>;
