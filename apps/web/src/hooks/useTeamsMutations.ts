import { useMutation, useQueryClient } from "@tanstack/react-query";
import { teamsApi } from "../api/teamsApi";
import { teamKeys } from "../lib/teamsApi";
import type {
  BulkMemberOp,
  BulkMemberResult,
  CreateOrgPayload,
  Invitation,
  InvitePayload,
  MemberDetail,
  OrgSummary,
  RemoveMemberParams,
  RoleChangePayload,
} from "../types/teams";
import { useTeamsStore } from "../stores/useTeamsStore";
import { useAuthState } from "../stores/useAuthStore";
import { TeamInvitationListParamsSchema } from "../types/teams";

function invalidateTeamLists(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({
    queryKey: ["teams", "members"],
    refetchType: "active",
  });
}

function invalidateTeamInvitations(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  queryClient.invalidateQueries({
    queryKey: ["teams", "invitations"],
    refetchType: "active",
  });
}

function invalidateTeamMemberDetail(
  queryClient: ReturnType<typeof useQueryClient>,
  userId: string,
) {
  queryClient.invalidateQueries({
    queryKey: ["teams", "member", userId],
  });
}

function removeTeamMemberDetail(
  queryClient: ReturnType<typeof useQueryClient>,
  userId: string,
) {
  queryClient.removeQueries({
    queryKey: ["teams", "member", userId],
  });
}

function invalidateTeamMemberHistory(
  queryClient: ReturnType<typeof useQueryClient>,
  userId: string,
) {
  queryClient.invalidateQueries({
    queryKey: ["teams", "history", userId],
  });
}

export function useChangeTeamMemberRoleMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    MemberDetail,
    Error,
    { userId: string; payload: RoleChangePayload }
  >({
    mutationFn: ({ userId, payload }) => teamsApi.changeRole(userId, payload),
    onSettled: (_data, _error, { userId }) => {
      invalidateTeamLists(queryClient);
      invalidateTeamMemberDetail(queryClient, userId);
      invalidateTeamMemberHistory(queryClient, userId);
      queryClient.invalidateQueries({ queryKey: teamKeys.orgs() });
    },
  });
}

export function useRemoveTeamMemberMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    void,
    Error,
    { userId: string; params?: RemoveMemberParams }
  >({
    mutationFn: ({ userId, params }) => teamsApi.removeMember(userId, params),
    onSuccess: (_data, { userId }) => {
      useTeamsStore
        .getState()
        .setSelectedRows(
          useTeamsStore
            .getState()
            .selectedRowIds.filter((rowId) => rowId !== userId),
        );
      removeTeamMemberDetail(queryClient, userId);
    },
    onSettled: (_data, _error, { userId }) => {
      invalidateTeamLists(queryClient);
      invalidateTeamMemberHistory(queryClient, userId);
      queryClient.invalidateQueries({ queryKey: teamKeys.orgs() });
    },
  });
}

export function useBulkTeamMembersMutation() {
  const queryClient = useQueryClient();

  return useMutation<BulkMemberResult, Error, BulkMemberOp>({
    mutationFn: (payload) => teamsApi.bulkMembers(payload),
    onSuccess: () => {
      useTeamsStore.getState().clearSelection();
    },
    onSettled: (_data, _error, payload) => {
      invalidateTeamLists(queryClient);
      payload.ids.forEach((id) => {
        if (payload.op === "remove") {
          removeTeamMemberDetail(queryClient, id);
        } else {
          invalidateTeamMemberDetail(queryClient, id);
        }
        invalidateTeamMemberHistory(queryClient, id);
      });
      queryClient.invalidateQueries({ queryKey: teamKeys.orgs() });
    },
  });
}

export function useInviteTeamMemberMutation() {
  const queryClient = useQueryClient();

  return useMutation<Invitation, Error, InvitePayload>({
    mutationFn: (payload) => teamsApi.invite(payload),
    onMutate: async (payload) => {
      const pendingKey = teamKeys.invitations(
        TeamInvitationListParamsSchema.parse({ status: "PENDING" }),
      );
      await queryClient.cancelQueries({ queryKey: pendingKey });
      const previous = queryClient.getQueryData<Invitation[]>(pendingKey);

      const actor = useAuthState.getState().user;
      const optimistic: Invitation = {
        id: `optimistic-${Date.now()}`,
        email: payload.email,
        role: payload.role,
        orgId: payload.orgId,
        orgName: "",
        invitedBy: { id: actor?.id ?? "", name: actor?.displayName ?? "" },
        sentAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: "PENDING",
        inviteUrl: "",
      };

      queryClient.setQueryData<Invitation[]>(pendingKey, (old) => [
        optimistic,
        ...(old ?? []),
      ]);

      return { previous, pendingKey };
    },
    onError: (_error, _payload, context) => {
      const ctx = context as { previous: Invitation[] | undefined; pendingKey: readonly unknown[] } | undefined;
      if (ctx?.previous !== undefined) {
        queryClient.setQueryData(ctx.pendingKey, ctx.previous);
      }
    },
    onSettled: () => {
      invalidateTeamInvitations(queryClient);
      queryClient.invalidateQueries({ queryKey: teamKeys.orgs() });
    },
  });
}

export function useCreateOrgMutation() {
  const queryClient = useQueryClient();

  return useMutation<OrgSummary, Error, CreateOrgPayload>({
    mutationFn: (payload) => teamsApi.createOrg(payload),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: teamKeys.orgs() });
    },
  });
}

export function useResendTeamInvitationMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => teamsApi.resendInvitation(id),
    onSettled: () => {
      invalidateTeamInvitations(queryClient);
    },
  });
}

export function useCancelTeamInvitationMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => teamsApi.cancelInvitation(id),
    onSettled: () => {
      invalidateTeamInvitations(queryClient);
      queryClient.invalidateQueries({ queryKey: teamKeys.orgs() });
    },
  });
}
