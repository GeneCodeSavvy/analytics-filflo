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

import type {
  TeamMemberListParams,
  TeamInvitationListParams,
  TeamAuditParams,
  TeamRole,
} from "@shared/schema/teams";

export function normalizeTeamParams<T extends object>(params: T): T {
  const filtered = Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) =>
        value !== undefined &&
        value !== "" &&
        !(Array.isArray(value) && value.length === 0),
    ),
  );
  return filtered as T;
}

export function buildTeamListKey(params: object): Record<string, unknown> {
  const entries = Object.entries(normalizeTeamParams(params)).sort(([a], [b]) =>
    a.localeCompare(b),
  );
  const result: Record<string, unknown> = {};
  for (const [key, value] of entries) {
    result[key] = Array.isArray(value) ? [...value].sort().join(",") : value;
  }
  return result;
}

export function parseTeamMemberParams(
  params: URLSearchParams,
): TeamMemberListParams {
  const role = params.get("role");
  return {
    orgId: params.get("orgId") ?? undefined,
    role: role ? (role.split(",") as TeamRole[]) : [],
    q: params.get("q") ?? undefined,
    page: Number(params.get("page") ?? "1"),
    pageSize: Number(params.get("pageSize") ?? "25"),
  };
}

export function serializeTeamMemberParams(
  params: TeamMemberListParams,
): URLSearchParams {
  const next = new URLSearchParams();
  if (params.orgId) next.set("orgId", params.orgId);
  if (params.role?.length) next.set("role", params.role.join(","));
  if (params.q) next.set("q", params.q);
  if (params.page && params.page !== 1) next.set("page", String(params.page));
  if (params.pageSize && params.pageSize !== 25) {
    next.set("pageSize", String(params.pageSize));
  }
  return next;
}

export const teamKeys = {
  members: (params: TeamMemberListParams) =>
    ["teams", "members", buildTeamListKey(params)] as const,
  member: (userId: string, orgId?: string) =>
    ["teams", "member", userId, orgId ?? ""] as const,
  history: (userId: string, params: TeamAuditParams) =>
    ["teams", "history", userId, buildTeamListKey(params)] as const,
  invitations: (params: TeamInvitationListParams) =>
    ["teams", "invitations", buildTeamListKey(params)] as const,
  orgs: () => ["teams", "orgs"] as const,
};
