import { api } from ".";
import {
  AuditEntrySchema,
  BulkMemberResultSchema,
  InvitationSchema,
  MemberDetailSchema,
  OrgSummarySchema,
  TeamMemberListResponseSchema,
} from "../types/teams";
import type {
  AuditEntry,
  BulkMemberOp,
  BulkMemberResult,
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

export const teamsApi = {
  /**  Allowed for all, returns the members of an organization
   *  SuperAdmin - allowed request for members of any organization
   *  Admin - allowed request for members of any organization
   *  Moderators - allowed request for members of only their organization
   *  Users - allowed request for members of only their organization
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

  /**  Allowed for all, returns the members of an organization
   *  SuperAdmin - allowed request for members of any organization
   *  Admin - allowed request for members of any organization
   *  Moderators - allowed request for members of only their organization
   *  Users - allowed request for members of only their organization
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

  /** Only Allowed for Moderators, and SuperAdmins
   *  SuperAdmins - promote and demote anyone in any organization
   *  Moderators - promote and demote others in their organization
   */
  changeRole: (
    userId: string,
    payload: RoleChangePayload,
  ): Promise<MemberDetail> =>
    api
      .patch<MemberDetail>(`/teams/members/${userId}/role`, payload)
      .then((data) => MemberDetailSchema.parse(data)),

  /** Only Allowed for Moderators, and SuperAdmins
   *  SuperAdmins - remove anyone in any organization
   *  Moderators - remove others in their organization
   */
  removeMember: (userId: string, params?: RemoveMemberParams): Promise<void> =>
    api.delete(`/teams/members/${userId}`, { params }),

  /** Only Allowed for Moderators, and SuperAdmins
   *  SuperAdmins - promote, demote, or remove anyone in any organization
   *  Moderators - promote, demote, or remove others in their organization
   */
  bulkMembers: (payload: BulkMemberOp): Promise<BulkMemberResult> =>
    api
      .post<BulkMemberResult>("/teams/members/bulk", payload)
      .then((data) => BulkMemberResultSchema.parse(data)),

  /**  Allowed for all, returns the members of an organization
   *  SuperAdmin - allowed request for members of any organization
   *  Admin - allowed request for members of any organization
   *  Moderators - allowed request for members of only their organization
   *  Users - allowed request for members of only their organization
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

  /**  Allowed for all, returns the members of an organization
   *  SuperAdmin - allowed request for members of any organization
   *  Admin - allowed request for members of any organization
   *  Moderators - allowed request for members of only their organization
   *  Users - allowed request for members of only their organization
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

  /** Only Allowed for Moderators, and SuperAdmins
   *  SuperAdmins - invite anyone in any organization
   *  Moderators - invite others in their organization
   */
  invite: (payload: InvitePayload): Promise<Invitation> =>
    api
      .post<Invitation>("/teams/invitations", payload)
      .then((data) => InvitationSchema.parse(data)),

  /** Only Allowed for Moderators, and SuperAdmins
   *  SuperAdmins - invite anyone in any organization
   *  Moderators - invite others in their organization
   */
  resendInvitation: (id: string): Promise<void> =>
    api.post(`/teams/invitations/${id}/resend`),

  /** Only Allowed for Moderators, and SuperAdmins
   *  SuperAdmins - cancel invite anyone in any organization
   *  Moderators - cancel invite others in their organization
   */
  cancelInvitation: (id: string): Promise<void> =>
    api.delete(`/teams/invitations/${id}`),

  /** Only Allowed for Admins and SuperAdming
   */
  getOrgs: async (signal?: AbortSignal): Promise<OrgSummary[]> => {
    const data = await api.get<OrgSummary[]>("/teams/orgs", { signal });
    return OrgSummarySchema.array().parse(data);
  },
};
