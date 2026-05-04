import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { TeamRole } from "../types/teams";

interface InviteDraft {
  email: string;
  role: TeamRole;
  orgId: string;
  message: string;
}

interface TeamsUIState {
  selectedRowIds: string[];
  expandedOrgIds: string[];
  detailOpen: boolean;
  selectedMemberId: string | null;
  selectedMemberOrgId: string | null;
  inviteModalOpen: boolean;
  inviteDraft: InviteDraft | null;
  auditLogMemberId: string | null;
  auditLogOrgId: string | null;

  setSelectedRows: (ids: string[]) => void;
  toggleRowSelected: (id: string) => void;
  clearSelection: () => void;
  setOrgExpanded: (orgId: string, expanded: boolean) => void;
  toggleOrgExpanded: (orgId: string) => void;
  expandAllOrgs: (orgIds: string[]) => void;
  collapseAllOrgs: () => void;
  openMemberDetail: (userId: string, orgId?: string) => void;
  closeMemberDetail: () => void;
  openInviteModal: (draft?: InviteDraft) => void;
  closeInviteModal: () => void;
  saveInviteDraft: (draft: InviteDraft | null) => void;
  clearInviteDraft: () => void;
  openAuditLog: (userId: string, orgId?: string) => void;
  closeAuditLog: () => void;
}

export const useTeamsStore = create<TeamsUIState>()(
  persist(
    (set) => ({
      selectedRowIds: [],
      expandedOrgIds: [],
      detailOpen: false,
      selectedMemberId: null,
      selectedMemberOrgId: null,
      inviteModalOpen: false,
      inviteDraft: null,
      auditLogMemberId: null,
      auditLogOrgId: null,

      setSelectedRows: (ids) => set({ selectedRowIds: ids }),

      toggleRowSelected: (id) =>
        set((state) => {
          const selected = state.selectedRowIds.includes(id);
          return {
            selectedRowIds: selected
              ? state.selectedRowIds.filter((rowId) => rowId !== id)
              : [...state.selectedRowIds, id],
          };
        }),

      clearSelection: () => set({ selectedRowIds: [] }),

      setOrgExpanded: (orgId, expanded) =>
        set((state) => ({
          expandedOrgIds: expanded
            ? Array.from(new Set([...state.expandedOrgIds, orgId]))
            : state.expandedOrgIds.filter((id) => id !== orgId),
        })),

      toggleOrgExpanded: (orgId) =>
        set((state) => {
          const expanded = state.expandedOrgIds.includes(orgId);
          return {
            expandedOrgIds: expanded
              ? state.expandedOrgIds.filter((id) => id !== orgId)
              : [...state.expandedOrgIds, orgId],
          };
        }),

      expandAllOrgs: (orgIds) =>
        set({ expandedOrgIds: Array.from(new Set(orgIds)) }),

      collapseAllOrgs: () => set({ expandedOrgIds: [] }),

      openMemberDetail: (userId, orgId) =>
        set({
          detailOpen: true,
          selectedMemberId: userId,
          selectedMemberOrgId: orgId ?? null,
        }),

      closeMemberDetail: () =>
        set({
          detailOpen: false,
          selectedMemberId: null,
          selectedMemberOrgId: null,
        }),

      openInviteModal: (draft) =>
        set((state) => ({
          inviteModalOpen: true,
          inviteDraft: draft ?? state.inviteDraft,
        })),

      closeInviteModal: () => set({ inviteModalOpen: false }),

      saveInviteDraft: (draft) => set({ inviteDraft: draft }),

      clearInviteDraft: () => set({ inviteDraft: null }),

      openAuditLog: (userId, orgId) =>
        set({
          auditLogMemberId: userId,
          auditLogOrgId: orgId ?? null,
        }),

      closeAuditLog: () =>
        set({
          auditLogMemberId: null,
          auditLogOrgId: null,
        }),
    }),
    {
      name: "teams-store",
      partialize: (state) => ({ inviteDraft: state.inviteDraft }),
    },
  ),
);
