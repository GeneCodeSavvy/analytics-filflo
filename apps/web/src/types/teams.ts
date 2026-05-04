export {
  TeamRoleSchema,
  TeamMemberListParamsSchema,
  TeamAuditParamsSchema,
  TeamInvitationListParamsSchema,
  MemberPermissionsSchema,
  MemberRowSchema,
  MemberDetailSchema,
  TeamMemberListResponseSchema,
  InvitationSchema,
  AuditEntrySchema,
  OrgSummarySchema,
  InvitePayloadSchema,
  RoleChangePayloadSchema,
  RemoveMemberParamsSchema,
  BulkMemberOpSchema,
  BulkMemberResultSchema,
} from "@shared/schema/teams";

export type {
  TeamRole,
  InvitationStatus,
  TeamMemberListParams,
  TeamAuditParams,
  TeamInvitationListParams,
  MemberPermissions,
  MemberRow,
  MemberDetail,
  TeamMemberListResponse,
  Invitation,
  AuditEntry,
  OrgSummary,
  InvitePayload,
  RoleChangePayload,
  RemoveMemberParams,
  BulkMemberOp,
  BulkMemberResult,
} from "@shared/schema/teams";

import type { Invitation, MemberRow } from "@shared/schema/teams";

export type SortKey = "member" | "role" | "lastActive" | "joined";
export type SortDirection = "asc" | "desc";
export type TeamTab = "members" | "pending";
export type RoleFilter = MemberRow["role"] | "ALL";

export type ModalState =
  | { type: "role"; member: MemberRow; nextRole: MemberRow["role"] }
  | { type: "remove"; member: MemberRow }
  | null;

export type InvitationExpiryInput = Pick<Invitation, "status" | "expiresAt">;

export type HighlightPart = {
  text: string;
  highlighted: boolean;
};
