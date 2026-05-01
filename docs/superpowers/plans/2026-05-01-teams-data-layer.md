# Teams Data Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Teams frontend data layer: shared Zod schemas, API object, query/mutation hooks, and a UI-only Zustand store.

**Architecture:** Shared schemas define the contract, `apps/web/src/lib/teamParams.ts` re-exports them and owns URL/query-key helpers, `teamsApi` performs typed axios calls and parses API returns, TanStack Query owns fetched server state, and `useTeamsStore` owns only local UI state. Teams endpoints use `/teams/...` paths relative to `VITE_API_BASE_URL`.

**Tech Stack:** TypeScript, Zod, Axios, TanStack Query v5, Zustand, pnpm/turbo.

---

## File Map

- Create `packages/shared/schema/teams.ts`
  Teams roles, params, return schemas, payload schemas, inferred types.
- Modify `packages/shared/schema/index.ts`
  Re-export Teams schemas/types.
- Create `apps/web/src/lib/teamParams.ts`
  Re-export Teams schemas/types and provide URL parsing, serialization, normalized params, and query keys.
- Create `apps/web/src/api/teamsApi.ts`
  Teams axios methods using the existing unwrapped `api` client and Zod return parsing.
- Create `apps/web/src/hooks/useTeamsQueries.ts`
  Read hooks for members, member details, member history, invitations, and orgs.
- Create `apps/web/src/hooks/useTeamsMutations.ts`
  Mutation hooks for role change, removal, bulk operations, move, invite, resend, and cancel.
- Modify `apps/web/src/stores/useTeamsStore.ts`
  Replace interface-only server-state shape with a real UI-only Zustand store.

## Task 1: Shared Teams Schemas

**Files:**
- Create: `packages/shared/schema/teams.ts`
- Modify: `packages/shared/schema/index.ts`

- [ ] **Step 1: Add failing import smoke check**

Run:

```bash
pnpm --filter @shared check-types
```

Expected before implementation: PASS or unrelated current errors. This is the baseline. After adding an import in the next step, missing exports would fail until schemas exist.

- [ ] **Step 2: Create `packages/shared/schema/teams.ts`**

Add:

```ts
import { z } from "zod";

export const TeamRoleSchema = z.enum([
  "SUPER_ADMIN",
  "ADMIN",
  "MODERATOR",
  "USER",
]);

export const InvitationStatusSchema = z.enum([
  "pending",
  "accepted",
  "expired",
  "cancelled",
]);

export const TeamMemberListParamsSchema = z.object({
  orgId: z.string().optional(),
  role: TeamRoleSchema.array().optional(),
  q: z.string().optional(),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().default(25),
});

export const TeamAuditParamsSchema = z.object({
  orgId: z.string().optional(),
  limit: z.number().int().positive().default(50).optional(),
  cursor: z.string().optional(),
});

export const TeamInvitationListParamsSchema = z.object({
  orgId: z.string().optional(),
  status: InvitationStatusSchema.optional(),
});

const UserRefSchema = z.object({
  id: z.string(),
  name: z.string(),
});

const OrgRefSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const MemberPermissionsSchema = z.object({
  canChangeRole: z.boolean(),
  canRemove: z.boolean(),
  canMoveTo: z.boolean(),
});

export const MemberRowSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  avatarUrl: z.string().optional(),
  role: TeamRoleSchema,
  orgId: z.string(),
  joinedAt: z.string(),
  lastActiveAt: z.string().optional(),
  isInactive: z.boolean(),
  permissions: MemberPermissionsSchema,
});

export const MemberDetailSchema = MemberRowSchema.extend({
  orgMemberships: z.array(
    z.object({
      org: OrgRefSchema,
      role: TeamRoleSchema,
      joinedAt: z.string(),
    }),
  ),
  stats: z.object({
    ticketsCreated: z.number(),
    ticketsAssigned: z.number(),
    avgResolutionMs: z.number().optional(),
  }),
});

export const TeamMemberListResponseSchema = z.object({
  rows: MemberRowSchema.array(),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
  serverTime: z.string().optional(),
});

export const InvitationSchema = z.object({
  id: z.string(),
  email: z.string(),
  role: TeamRoleSchema,
  orgId: z.string(),
  orgName: z.string(),
  invitedBy: UserRefSchema,
  sentAt: z.string(),
  expiresAt: z.string(),
  status: InvitationStatusSchema,
  inviteUrl: z.string(),
});

export const AuditEntrySchema = z.object({
  id: z.string(),
  at: z.string(),
  actor: UserRefSchema,
  action: z.enum([
    "role_changed",
    "removed",
    "invited",
    "invitation_cancelled",
  ]),
  targetUser: UserRefSchema,
  org: OrgRefSchema,
  fromRole: TeamRoleSchema.optional(),
  toRole: TeamRoleSchema.optional(),
  reason: z.string().optional(),
});

export const OrgSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  memberCount: z.number(),
  roleCounts: z.record(TeamRoleSchema, z.number()).partial(),
  pendingInvitationCount: z.number().optional(),
});

export const InvitePayloadSchema = z.object({
  email: z.string(),
  role: TeamRoleSchema,
  orgId: z.string(),
  message: z.string().optional(),
});

export const RoleChangePayloadSchema = z.object({
  role: TeamRoleSchema,
  orgId: z.string().optional(),
  reason: z.string().optional(),
});

export const MoveMemberPayloadSchema = z.object({
  fromOrgId: z.string().optional(),
  toOrgId: z.string(),
});

export const RemoveMemberParamsSchema = z.object({
  orgId: z.string().optional(),
});

export const BulkMemberOpSchema = z.object({
  ids: z.string().array(),
  orgId: z.string().optional(),
  op: z.enum(["change_role", "remove"]),
  payload: RoleChangePayloadSchema.optional(),
});

export const BulkMemberResultSchema = z.object({
  succeeded: z.string().array(),
  failed: z.array(z.object({ id: z.string(), reason: z.string() })),
});

export type TeamRole = z.infer<typeof TeamRoleSchema>;
export type InvitationStatus = z.infer<typeof InvitationStatusSchema>;
export type TeamMemberListParams = z.infer<typeof TeamMemberListParamsSchema>;
export type TeamAuditParams = z.infer<typeof TeamAuditParamsSchema>;
export type TeamInvitationListParams = z.infer<
  typeof TeamInvitationListParamsSchema
>;
export type MemberPermissions = z.infer<typeof MemberPermissionsSchema>;
export type MemberRow = z.infer<typeof MemberRowSchema>;
export type MemberDetail = z.infer<typeof MemberDetailSchema>;
export type TeamMemberListResponse = z.infer<
  typeof TeamMemberListResponseSchema
>;
export type Invitation = z.infer<typeof InvitationSchema>;
export type AuditEntry = z.infer<typeof AuditEntrySchema>;
export type OrgSummary = z.infer<typeof OrgSummarySchema>;
export type InvitePayload = z.infer<typeof InvitePayloadSchema>;
export type RoleChangePayload = z.infer<typeof RoleChangePayloadSchema>;
export type MoveMemberPayload = z.infer<typeof MoveMemberPayloadSchema>;
export type RemoveMemberParams = z.infer<typeof RemoveMemberParamsSchema>;
export type BulkMemberOp = z.infer<typeof BulkMemberOpSchema>;
export type BulkMemberResult = z.infer<typeof BulkMemberResultSchema>;
```

- [ ] **Step 3: Re-export Teams schemas**

Modify `packages/shared/schema/index.ts`:

```ts
export * from "./tickets.js";
export * from "./user.js";
export * from "./messages.js";
export * from "./teams.js";
```

- [ ] **Step 4: Verify shared package**

Run:

```bash
pnpm --filter @shared check-types
```

Expected: PASS.

- [ ] **Step 5: Commit schemas**

```bash
git add packages/shared/schema/teams.ts packages/shared/schema/index.ts
git commit -m "feat: add teams shared schemas"
```

## Task 2: Team Params And Query Keys

**Files:**
- Create: `apps/web/src/lib/teamParams.ts`

- [ ] **Step 1: Create `teamParams.ts`**

Add:

```ts
export {
  TeamRoleSchema,
  InvitationStatusSchema,
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
  MoveMemberPayloadSchema,
  RemoveMemberParamsSchema,
  BulkMemberOpSchema,
  BulkMemberResultSchema,
} from "@shared/schema";

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
  MoveMemberPayload,
  RemoveMemberParams,
  BulkMemberOp,
  BulkMemberResult,
} from "@shared/schema";

import type {
  TeamMemberListParams,
  TeamInvitationListParams,
  TeamAuditParams,
  TeamRole,
} from "@shared/schema";

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
```

- [ ] **Step 2: Verify web imports**

Run:

```bash
pnpm --filter web build
```

Expected: PASS or only unrelated pre-existing errors. If import resolution fails for `@shared/schema`, fix the export path before continuing.

- [ ] **Step 3: Commit params helper**

```bash
git add apps/web/src/lib/teamParams.ts
git commit -m "feat: add teams params helpers"
```

## Task 3: Teams API Object

**Files:**
- Create: `apps/web/src/api/teamsApi.ts`

- [ ] **Step 1: Create `teamsApi.ts`**

Add:

```ts
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
  MoveMemberPayload,
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

  moveMember: (
    userId: string,
    payload: MoveMemberPayload,
  ): Promise<MemberDetail> =>
    api
      .post<MemberDetail>(`/teams/members/${userId}/move`, payload)
      .then((data) => MemberDetailSchema.parse(data)),

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
```

- [ ] **Step 2: Verify API types**

Run:

```bash
pnpm --filter web build
```

Expected: PASS or only unrelated pre-existing errors.

- [ ] **Step 3: Commit API object**

```bash
git add apps/web/src/api/teamsApi.ts
git commit -m "feat: add teams api client"
```

## Task 4: Teams Query Hooks

**Files:**
- Create: `apps/web/src/hooks/useTeamsQueries.ts`

- [ ] **Step 1: Create query hooks**

Add:

```ts
import { useQuery } from "@tanstack/react-query";
import { teamsApi } from "../api/teamsApi";
import {
  TeamAuditParamsSchema,
  TeamInvitationListParamsSchema,
  TeamMemberListParamsSchema,
  teamKeys,
} from "../lib/teamParams";
import type {
  AuditEntry,
  Invitation,
  MemberDetail,
  OrgSummary,
  TeamAuditParams,
  TeamInvitationListParams,
  TeamMemberListParams,
  TeamMemberListResponse,
} from "../lib/teamParams";

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
    queryFn: ({ signal }) => teamsApi.getMemberHistory(userId!, validated, signal),
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
```

- [ ] **Step 2: Verify query hooks**

Run:

```bash
pnpm --filter web build
```

Expected: PASS or only unrelated pre-existing errors.

- [ ] **Step 3: Commit query hooks**

```bash
git add apps/web/src/hooks/useTeamsQueries.ts
git commit -m "feat: add teams query hooks"
```

## Task 5: Teams UI Store

**Files:**
- Modify: `apps/web/src/stores/useTeamsStore.ts`

- [ ] **Step 1: Replace interface-only file with UI store**

Replace the file with:

```ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { TeamRole } from "../lib/teamParams";

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
```

- [ ] **Step 2: Verify store**

Run:

```bash
pnpm --filter web build
```

Expected: PASS or only unrelated pre-existing errors.

- [ ] **Step 3: Commit store**

```bash
git add apps/web/src/stores/useTeamsStore.ts
git commit -m "feat: add teams ui store"
```

## Task 6: Teams Mutation Hooks

**Files:**
- Create: `apps/web/src/hooks/useTeamsMutations.ts`

- [ ] **Step 1: Create mutation hooks**

Add:

```ts
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

export function useChangeTeamMemberRoleMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    MemberDetail,
    Error,
    { userId: string; payload: RoleChangePayload }
  >({
    mutationFn: ({ userId, payload }) => teamsApi.changeRole(userId, payload),
    onSettled: (_data, _error, { userId, payload }) => {
      invalidateTeamLists(queryClient);
      queryClient.invalidateQueries({
        queryKey: teamKeys.member(userId, payload.orgId),
      });
      queryClient.invalidateQueries({
        queryKey: ["teams", "history", userId],
      });
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
    onSuccess: (_data, { userId, params }) => {
      useTeamsStore.getState().setSelectedRows(
        useTeamsStore
          .getState()
          .selectedRowIds.filter((rowId) => rowId !== userId),
      );
      queryClient.removeQueries({
        queryKey: teamKeys.member(userId, params?.orgId),
      });
    },
    onSettled: (_data, _error, { userId }) => {
      invalidateTeamLists(queryClient);
      queryClient.invalidateQueries({ queryKey: ["teams", "history", userId] });
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
    onSettled: () => {
      invalidateTeamLists(queryClient);
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
      queryClient.invalidateQueries({ queryKey: ["teams", "history", userId] });
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
    },
  });
}
```

- [ ] **Step 2: Verify mutation hooks**

Run:

```bash
pnpm --filter web build
```

Expected: PASS or only unrelated pre-existing errors.

- [ ] **Step 3: Commit mutation hooks**

```bash
git add apps/web/src/hooks/useTeamsMutations.ts
git commit -m "feat: add teams mutation hooks"
```

## Task 7: Final Verification

**Files:**
- Verify all changed files.

- [ ] **Step 1: Run shared typecheck**

Run:

```bash
pnpm --filter @shared check-types
```

Expected: PASS.

- [ ] **Step 2: Run web build**

Run:

```bash
pnpm --filter web build
```

Expected: PASS.

- [ ] **Step 3: Inspect git diff**

Run:

```bash
git status --short
git diff --stat
```

Expected: only the files from this plan are modified or newly committed, plus any unrelated pre-existing user changes that were already present before implementation.

- [ ] **Step 4: Final commit if any verification-only fixes were needed**

If verification required small fixes after the previous task commits:

```bash
git add packages/shared/schema/teams.ts packages/shared/schema/index.ts apps/web/src/lib/teamParams.ts apps/web/src/api/teamsApi.ts apps/web/src/hooks/useTeamsQueries.ts apps/web/src/hooks/useTeamsMutations.ts apps/web/src/stores/useTeamsStore.ts
git commit -m "fix: verify teams data layer"
```

Expected: commit created only if there were uncommitted implementation fixes.
