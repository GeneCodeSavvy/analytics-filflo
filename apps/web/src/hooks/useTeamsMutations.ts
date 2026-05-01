import { useMutation, useQueryClient } from "@tanstack/react-query";
import { teamsApi } from "../api/teamsApi";
import { teamKeys } from "../lib/teamParams";
import type {
  BulkMemberOp,
  BulkMemberResult,
  Invitation,
  InvitePayload,
  MemberDetail,
  MoveMemberPayload,
  RemoveMemberParams,
  RoleChangePayload,
} from "../lib/teamParams";
import { useTeamsStore } from "../stores/useTeamsStore";

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
      useTeamsStore.getState().setSelectedRows(
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

export function useMoveTeamMemberMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    MemberDetail,
    Error,
    { userId: string; payload: MoveMemberPayload }
  >({
    mutationFn: ({ userId, payload }) => teamsApi.moveMember(userId, payload),
    onSettled: (_data, _error, { userId, payload }) => {
      invalidateTeamLists(queryClient);
      queryClient.invalidateQueries({
        queryKey: teamKeys.member(userId, payload.fromOrgId),
      });
      queryClient.invalidateQueries({
        queryKey: teamKeys.member(userId, payload.toOrgId),
      });
      invalidateTeamMemberHistory(queryClient, userId);
      queryClient.invalidateQueries({ queryKey: teamKeys.orgs() });
    },
  });
}

export function useInviteTeamMemberMutation() {
  const queryClient = useQueryClient();

  return useMutation<Invitation, Error, InvitePayload>({
    mutationFn: (payload) => teamsApi.invite(payload),
    onSuccess: () => {
      const store = useTeamsStore.getState();
      store.clearInviteDraft();
      store.closeInviteModal();
    },
    onSettled: () => {
      invalidateTeamInvitations(queryClient);
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
