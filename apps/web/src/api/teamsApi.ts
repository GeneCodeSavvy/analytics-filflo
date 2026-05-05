import { api } from ".";
import {
  AuditEntrySchema,
  BulkMemberResultSchema,
  CreateOrgPayloadSchema,
  InvitationSchema,
  MemberDetailSchema,
  OrgSummarySchema,
  TeamMemberListResponseSchema,
} from "../types/teams";
import type {
  AuditEntry,
  BulkMemberOp,
  BulkMemberResult,
  CreateOrgPayload,
  Invitation,
  InvitePayload,
  MemberDetail,
  OrgSummary,
  RemoveMemberParams,
  RoleChangePayload,
  TeamAuditParams,
  TeamInvitationListParams,
  TeamMemberListParams,
  TeamMemberListResponse,
} from "../types/teams";

/**
 * Teams API client.
 *
 * Permission model enforced by the API:
 * - SUPER_ADMIN and ADMIN can read members, invitations, audit entries, and
 *   org summaries across orgs.
 * - MODERATOR and USER reads are scoped to their own org. Passing a different
 *   orgId returns 403.
 * - SUPER_ADMIN can manage users and invitations across orgs and can create
 *   orgs.
 * - MODERATOR can manage only USER accounts/invitations in their own org.
 * - ADMIN is read-only in the teams surface unless a backend route states
 *   otherwise.
 *
 * Frontend guidance:
 * - Hide or disable controls based on role for UX, but still handle 403s from
 *   the API.
 * - Do not trust Clerk public metadata for role/org decisions unless it has
 *   been hydrated from the DB-backed auth state.
 */
export const teamsApi = {
  /** List members.
   * SUPER_ADMIN/ADMIN may request any org. MODERATOR/USER may request only
   * their own org; omit orgId for the API to scope them automatically.
   */
  getMembers: async (
    params: TeamMemberListParams,
    signal?: AbortSignal,
  ): Promise<TeamMemberListResponse> => {
    const data = await api.get<TeamMemberListResponse>("/teams/members", {
      params,
      signal,
    });
    return TeamMemberListResponseSchema.parse(data);
  },

  /** Read one member profile.
   * Cross-org readers can open any member. Org-scoped actors can open only
   * members in their own org.
   */
  getMember: async (
    userId: string,
    params?: RemoveMemberParams,
    signal?: AbortSignal,
  ): Promise<MemberDetail> => {
    const data = await api.get<MemberDetail>(`/teams/members/${userId}`, {
      params,
      signal,
    });
    return MemberDetailSchema.parse(data);
  },

  /** Change a member role.
   * SUPER_ADMIN may change anyone except themselves. MODERATOR may change only
   * other USER accounts in their own org, and only to MODERATOR per the current
   * backend rule. ADMIN/USER are forbidden.
   */
  changeRole: (
    userId: string,
    payload: RoleChangePayload,
  ): Promise<MemberDetail> =>
    api
      .patch<MemberDetail>(`/teams/members/${userId}/role`, payload)
      .then((data) => MemberDetailSchema.parse(data)),

  /** Remove a member.
   * SUPER_ADMIN may remove anyone except themselves. MODERATOR may remove only
   * other USER accounts in their own org. ADMIN/USER are forbidden.
   */
  removeMember: (userId: string, params?: RemoveMemberParams): Promise<void> =>
    api.delete(`/teams/members/${userId}`, { params }),

  /** Bulk role/remove operation.
   * Applies the same target rules as changeRole/removeMember. The API may
   * return per-id failures for missing targets; forbidden targets stop the
   * request with 403.
   */
  bulkMembers: (payload: BulkMemberOp): Promise<BulkMemberResult> =>
    api
      .post<BulkMemberResult>("/teams/members/bulk", payload)
      .then((data) => BulkMemberResultSchema.parse(data)),

  /** Read team audit entries.
   * SUPER_ADMIN/ADMIN can read across orgs. MODERATOR/USER can read only their
   * own org audit feed.
   */
  getMemberHistory: async (
    userId: string,
    params: TeamAuditParams,
    signal?: AbortSignal,
  ): Promise<AuditEntry[]> => {
    const data = await api.get<AuditEntry[]>(
      `/teams/members/${userId}/history`,
      { params, signal },
    );
    return AuditEntrySchema.array().parse(data);
  },

  /** List invitations.
   * SUPER_ADMIN/ADMIN can read invitations across orgs. MODERATOR/USER reads
   * are scoped to their own org.
   */
  getInvitations: async (
    params: TeamInvitationListParams,
    signal?: AbortSignal,
  ): Promise<Invitation[]> => {
    const data = await api.get<Invitation[]>("/teams/invitations", {
      params,
      signal,
    });
    return InvitationSchema.array().parse(data);
  },

  /** Create an invitation.
   * SUPER_ADMIN can invite any role into any org. MODERATOR can invite only
   * USER role recipients into their own org. ADMIN/USER are forbidden.
   */
  invite: (payload: InvitePayload): Promise<Invitation> =>
    api
      .post<Invitation>("/teams/invitations", payload)
      .then((data) => InvitationSchema.parse(data)),

  /** Resend an invitation.
   * Intended to follow the same permission model as invite/cancel: SUPER_ADMIN
   * across orgs, MODERATOR for USER invites in their own org.
   */
  resendInvitation: (id: string): Promise<void> =>
    api.post(`/teams/invitations/${id}/resend`),

  /** Cancel an invitation.
   * SUPER_ADMIN can cancel any invitation. MODERATOR can cancel only USER-role
   * invitations in their own org. ADMIN/USER are forbidden.
   */
  cancelInvitation: (id: string): Promise<void> =>
    api.delete(`/teams/invitations/${id}`),

  /** List org summaries.
   * SUPER_ADMIN/ADMIN receive all orgs. MODERATOR/USER receive only their own
   * org summary.
   */
  getOrgs: async (signal?: AbortSignal): Promise<OrgSummary[]> => {
    const data = await api.get<OrgSummary[]>("/teams/orgs", { signal });
    return OrgSummarySchema.array().parse(data);
  },

  /** Create an org. SUPER_ADMIN-only. */
  createOrg: (payload: CreateOrgPayload): Promise<OrgSummary> =>
    api
      .post<OrgSummary>("/teams/orgs", CreateOrgPayloadSchema.parse(payload))
      .then((data) => OrgSummarySchema.parse(data)),
};
