# Teams Data Layer Design

## Context

The Teams page needs four frontend data-layer pieces:

- A real `useTeamsStore.ts` Zustand store.
- A `teamsApi` object using the shared axios wrapper.
- TanStack Query hooks for Teams reads and mutations.
- Zod schemas for Teams params, payloads, and API returns.

`docs/web/teamsPage.md` is the authoritative endpoint spec for this work. `docs/web/axios.md` contains an older `/orgs/:orgId/...` Teams API shape and should not be used for Teams implementation.

Existing code conventions to follow:

- `apps/web/src/api/index.ts` exposes a typed axios wrapper whose response interceptor returns `res.data`.
- API modules should return `api.get<T>()`, `api.post<T>()`, and related calls directly, not `response.data`.
- Shared Zod schemas live in `packages/shared/schema/*.ts` and are re-exported from `packages/shared/schema/index.ts`.
- App-level lib files such as `apps/web/src/lib/ticketParams.ts` re-export shared schemas/types and add URL/key helpers.
- Zustand stores should hold local UI state; TanStack Query should own server state.

## Endpoint Decision

Use Teams namespace endpoints from `docs/web/teamsPage.md`, expressed relative to the existing API base URL:

- `GET /teams/members`
- `GET /teams/members/:userId`
- `PATCH /teams/members/:userId/role`
- `DELETE /teams/members/:userId`
- `POST /teams/members/bulk`
- `GET /teams/members/:userId/history`
- `POST /teams/members/:userId/move`
- `GET /teams/invitations`
- `POST /teams/invitations`
- `POST /teams/invitations/:id/resend`
- `DELETE /teams/invitations/:id`
- `GET /teams/orgs`

Do not include `/api` in these strings unless the rest of the app changes, because existing modules use paths such as `/tickets` and rely on `VITE_API_BASE_URL` to point at the API root.

## Architecture

Add or update these files:

- `packages/shared/schema/teams.ts`
  Defines Zod schemas and inferred types for Teams.
- `packages/shared/schema/index.ts`
  Re-exports Teams schemas and types.
- `apps/web/src/lib/teamParams.ts`
  Re-exports shared Teams schemas/types and provides URL parsing, URL serialization, and stable query-key helpers.
- `apps/web/src/api/teamsApi.ts`
  Provides typed axios calls for Teams endpoints.
- `apps/web/src/hooks/useTeamsQueries.ts`
  Provides TanStack Query read hooks.
- `apps/web/src/hooks/useTeamsMutations.ts`
  Provides TanStack Query mutation hooks and cache invalidation.
- `apps/web/src/stores/useTeamsStore.ts`
  Provides UI-only Teams state.

## Zustand Store Boundary

`useTeamsStore` should store UI state only:

- `selectedRowIds`
- `expandedOrgIds`
- `detailOpen`
- `selectedMemberId`
- `selectedMemberOrgId`
- `inviteModalOpen`
- `inviteDraft`
- `auditLogMemberId`
- `auditLogOrgId`

It should expose actions for row selection, org expansion, member detail drawer state, invite modal/draft state, and audit log drawer state.

Remove server-state concepts from the current Teams store shape:

- `orgSections`
- `selectedMemberDetail`
- `pendingInvitations`
- `auditLog`
- `loading`
- `error`
- `lazyLoadMembers`

Components should read fetched rows, invitations, details, audit entries, loading, and errors from TanStack Query hooks.

Persist only `inviteDraft` to localStorage because the Teams spec explicitly requires invite draft autosave. Do not persist fetched data. Keep `expandedOrgIds` in memory for the first implementation unless the UI later needs session-level persistence.

## Shared Schemas

`packages/shared/schema/teams.ts` should define:

- `TeamRoleSchema`: `SUPER_ADMIN | ADMIN | MODERATOR | USER`
- `InvitationStatusSchema`: `pending | accepted | expired | cancelled`
- `TeamMemberListParamsSchema`: `orgId?`, `role?`, `q?`, `page`, `pageSize`
- `TeamAuditParamsSchema`: `orgId?`, `limit?`, `cursor?`
- `TeamInvitationListParamsSchema`: `orgId?`, `status?`
- `MemberRowSchema`
- `MemberDetailSchema`
- `TeamMemberListResponseSchema`
- `InvitationSchema`
- `AuditEntrySchema`
- `OrgSummarySchema`
- `InvitePayloadSchema`
- `RoleChangePayloadSchema`
- `MoveMemberPayloadSchema`
- `BulkMemberOpSchema`
- `BulkMemberResultSchema`

Role values should remain uppercase to match the permission model. Invitation status values should remain lowercase to match the Teams page docs.

Because the task explicitly asks for schemas for API returns, parse returned API data at the API boundary with the relevant Zod schema. Do not only export schemas as unused compile-time documentation.

## API Object

`apps/web/src/api/teamsApi.ts` should export `teamsApi` with these methods:

- `getMembers(params, signal?)`
  Calls `GET /teams/members`.
- `getMember(userId, params, signal?)`
  Calls `GET /teams/members/:userId`, passing `orgId` in params when needed.
- `changeRole(userId, payload)`
  Calls `PATCH /teams/members/:userId/role`.
- `removeMember(userId, params)`
  Calls `DELETE /teams/members/:userId`, passing `orgId` in query params.
- `bulkMembers(payload)`
  Calls `POST /teams/members/bulk`.
- `getMemberHistory(userId, params, signal?)`
  Calls `GET /teams/members/:userId/history`.
- `moveMember(userId, payload)`
  Calls `POST /teams/members/:userId/move`.
- `getInvitations(params, signal?)`
  Calls `GET /teams/invitations`.
- `invite(payload)`
  Calls `POST /teams/invitations`.
- `resendInvitation(id)`
  Calls `POST /teams/invitations/:id/resend`.
- `cancelInvitation(id)`
  Calls `DELETE /teams/invitations/:id`.
- `getOrgs(signal?)`
  Calls `GET /teams/orgs`.

Each read method should accept and pass `AbortSignal` to axios, following the ticket and message hook patterns.

## Query Keys And Hooks

`apps/web/src/lib/teamParams.ts` should expose a stable key factory:

```ts
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

Read hooks:

- `useTeamMembersQuery(params)`
  Validates `TeamMemberListParamsSchema`, uses `teamKeys.members`, and keeps previous data as placeholder.
- `useTeamMemberQuery(userId, orgId)`
  Enabled only when `userId` exists.
- `useTeamMemberHistoryQuery(userId, params)`
  Enabled only when `userId` exists.
- `useTeamInvitationsQuery(params)`
  Fetches invitation rows.
- `useTeamOrgsQuery()`
  Uses a longer stale time because org rows change less often than member rows.

## Mutations And Invalidation

Mutation hooks should live in `apps/web/src/hooks/useTeamsMutations.ts`.

- Role change:
  Invalidate member lists, affected member detail, affected member history, and orgs. Optimistic row patching is acceptable if rollback is implemented.
- Remove member:
  Invalidate member lists and orgs, remove affected member detail cache, and clear removed row selections.
- Bulk members:
  Invalidate all active member lists and orgs, then clear selected rows.
- Move member:
  Invalidate member lists, affected member detail, affected history, and orgs.
- Invite:
  Invalidate invitations, clear invite draft, and close invite modal.
- Resend invitation:
  Invalidate invitations.
- Cancel invitation:
  Invalidate invitations.

Avoid optimistic updates for bulk and move unless the backend returns enough canonical data to patch every affected cache safely.

## Testing

Add focused tests where the repo's current test setup supports them:

- Shared schemas parse valid Teams fixtures and reject invalid roles/status values.
- URL parsing and serialization in `teamParams.ts` are deterministic.
- Query-key helpers produce stable sorted keys for equivalent params.
- Mutation hooks invalidate the intended Teams keys.

If no test runner is currently configured for a target package, run TypeScript or the closest existing verification command and document the gap.
