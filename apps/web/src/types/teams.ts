export {
  TeamRoleSchema,
  TeamMemberListParamsSchema,
  TeamAuditParamsSchema,
  TeamInvitationListParamsSchema,
  MemberRowSchema,
  MemberDetailSchema,
  TeamMemberListItemSchema,
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
  MemberRow,
  MemberDetail,
  TeamMemberListItem,
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

import type {
  Invitation,
  MemberRow,
  TeamMemberListItem,
} from "@shared/schema/teams";

export type SortKey = "member" | "role" | "joined";
export type SortDirection = "asc" | "desc";
export type TeamTab = "members" | "pending";
export type RoleFilter = MemberRow["role"] | "ALL";

export type ModalState =
  | { type: "role"; member: TeamMemberListItem; nextRole: MemberRow["role"] }
  | { type: "remove"; member: TeamMemberListItem }
  | null;

export type InvitationExpiryInput = Pick<Invitation, "status" | "expiresAt">;

export type HighlightPart = {
  text: string;
  highlighted: boolean;
};
