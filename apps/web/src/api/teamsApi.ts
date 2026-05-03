import { api } from ".";
import {
  AuditEntrySchema,
  BulkMemberResultSchema,
  InvitationSchema,
  MemberDetailSchema,
  OrgSummarySchema,
  TeamMemberListResponseSchema,
} from "../lib/teamParams";
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
} from "../lib/teamParams";

export const teamsApi = {
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

  changeRole: (
    userId: string,
    payload: RoleChangePayload,
  ): Promise<MemberDetail> =>
    api
      .patch<MemberDetail>(`/teams/members/${userId}/role`, payload)
      .then((data) => MemberDetailSchema.parse(data)),

  removeMember: (userId: string, params?: RemoveMemberParams): Promise<void> =>
    api.delete(`/teams/members/${userId}`, { params }),

  bulkMembers: (payload: BulkMemberOp): Promise<BulkMemberResult> =>
    api
      .post<BulkMemberResult>("/teams/members/bulk", payload)
      .then((data) => BulkMemberResultSchema.parse(data)),

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

  invite: (payload: InvitePayload): Promise<Invitation> =>
    api
      .post<Invitation>("/teams/invitations", payload)
      .then((data) => InvitationSchema.parse(data)),

  resendInvitation: (id: string): Promise<void> =>
    api.post(`/teams/invitations/${id}/resend`),

  cancelInvitation: (id: string): Promise<void> =>
    api.delete(`/teams/invitations/${id}`),

  getOrgs: async (signal?: AbortSignal): Promise<OrgSummary[]> => {
    const data = await api.get<OrgSummary[]>("/teams/orgs", { signal });
    return OrgSummarySchema.array().parse(data);
  },
};
