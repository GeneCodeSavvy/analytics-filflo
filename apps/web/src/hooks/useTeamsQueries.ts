import { useQuery } from "@tanstack/react-query";
import { teamsApi } from "../api/teamsApi";
import {
  TeamAuditParamsSchema,
  TeamInvitationListParamsSchema,
  TeamMemberListParamsSchema,
} from "../types/teams";
import { teamKeys } from "../lib/teamsApi";
import type {
  AuditEntry,
  Invitation,
  MemberDetail,
  OrgSummary,
  TeamAuditParams,
  TeamInvitationListParams,
  TeamMemberListParams,
  TeamMemberListResponse,
} from "../types/teams";

export function useTeamMembersQuery(params: TeamMemberListParams) {
  const validated = TeamMemberListParamsSchema.parse(params);

  return useQuery<TeamMemberListResponse>({
    queryKey: teamKeys.members(validated),
    queryFn: ({ signal }) => teamsApi.getMembers(validated, signal),
    staleTime: 25_000,
    placeholderData: (previousData) => previousData,
    retry: 1,
  });
}

export function useTeamMemberQuery(userId: string | null, orgId?: string) {
  return useQuery<MemberDetail>({
    queryKey: teamKeys.member(userId ?? "", orgId),
    queryFn: ({ signal }) =>
      teamsApi.getMember(userId!, orgId ? { orgId } : undefined, signal),
    enabled: !!userId,
    retry: (failureCount, error) =>
      (error as unknown as { response?: { status: number } })?.response
        ?.status !== 404 && failureCount < 2,
  });
}

export function useTeamMemberHistoryQuery(
  userId: string | null,
  params: TeamAuditParams,
) {
  const validated = TeamAuditParamsSchema.parse(params);

  return useQuery<AuditEntry[]>({
    queryKey: teamKeys.history(userId ?? "", validated),
    queryFn: ({ signal }) =>
      teamsApi.getMemberHistory(userId!, validated, signal),
    enabled: !!userId,
  });
}

export function useTeamInvitationsQuery(params: TeamInvitationListParams) {
  const validated = TeamInvitationListParamsSchema.parse(params);

  return useQuery<Invitation[]>({
    queryKey: teamKeys.invitations(validated),
    queryFn: ({ signal }) => teamsApi.getInvitations(validated, signal),
    staleTime: 30_000,
    placeholderData: (previousData) => previousData,
  });
}

export function useTeamOrgsQuery() {
  return useQuery<OrgSummary[]>({
    queryKey: teamKeys.orgs(),
    queryFn: ({ signal }) => teamsApi.getOrgs(signal),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}
