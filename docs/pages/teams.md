# Teams Page Current Implementation Context

This document captures the current state of the Teams page across the frontend, backend, shared schemas, Prisma data model, and invite/webhook flow. It is a working context document for turning the page into a production-ready experience.

## Source Files Reviewed

- Product/design spec: `docs/web/teamsPage.md`
- Frontend page: `apps/web/src/components/Team.tsx`
- Frontend API clients: `apps/web/src/api/teamsApi.ts`, `apps/web/src/api/invitations.ts`
- Frontend data hooks/state: `apps/web/src/hooks/useTeamsQueries.ts`, `apps/web/src/hooks/useTeamsMutations.ts`, `apps/web/src/stores/useTeamsStore.ts`, `apps/web/src/lib/teamParams.ts`
- Invite acceptance UI: `apps/web/src/components/InvitationAccept.tsx`
- Backend route mounts: `apps/api/src/app.ts`
- Backend routes: `apps/api/src/routes/teams.ts`, `apps/api/src/routes/invitations.ts`, `apps/api/src/routes/webhooks.ts`
- Backend controllers: `apps/api/src/controllers/teams/members.ts`, `apps/api/src/controllers/teams/invitations.ts`, `apps/api/src/controllers/teams/data.ts`, `apps/api/src/controllers/teams/utils.ts`, `apps/api/src/controllers/invitations/verify.ts`
- Auth helpers: `apps/api/src/lib/auth.ts`
- Shared schemas: `packages/shared/schema/domain.ts`, `packages/shared/schema/teams.ts`
- Database model docs/schema: `docs/api/database_schema.md`, `apps/api/prisma/schema.prisma`

## Intended Product Shape

`docs/web/teamsPage.md` describes a role-sensitive Teams page:

- Super Admins see org-grouped membership across all orgs, can invite, change roles, remove members, view org summaries, see audit history, and perform bulk operations.
- Admins see org-grouped membership as a read-only directory.
- Moderators see their org in a single-org table, can invite Users, promote Users to Moderators, and remove Users.
- Users see a read-only card grid for their org.
- Pending invitations are first-class UI, with resend, copy link, cancel, expiry, and accepted-state movement into the members table.
- All destructive or permission-changing actions should have confirmations.
- URL state is supposed to own filters like `orgId`, `role`, and `q`.
- Server is expected to compute viewer-specific row permissions.

The spec also explicitly says org moves are out of scope for v1 in the database model, even though the earlier page spec mentions a move action for Super Admins. The current backend implements moves as unsupported.

## Current Route Topology

Backend route mounting in `apps/api/src/app.ts`:

- `/webhooks` is mounted before `express.json()` with `express.raw({ type: "application/json" })` for Svix/Clerk signature verification.
- `/invitations` is public after JSON parsing and Clerk middleware, but before `requireDbUser`.
- All routes after `requireDbUser` require an authenticated Clerk user linked to a local `User` row.
- `/teams` is authenticated.

Frontend routes in `apps/web/src/App.tsx`:

- `/teams` renders `Teams`.
- `/invitations/:token` renders `InvitationAccept`.
- `/sign-up` is where invite acceptance redirects after public token verification.

## Shared Contract

The Teams contract lives in `packages/shared/schema/teams.ts`, re-exported through `apps/web/src/lib/teamParams.ts`.

Current core types:

- `TeamRole`: uppercase `SUPER_ADMIN | ADMIN | MODERATOR | USER`.
- `InvitationStatus`: uppercase `PENDING | ACCEPTED | EXPIRED | CANCELLED`.
- `TeamMemberListParams`: `orgId?`, `role?`, `q?`, `page`, `pageSize`.
- `MemberRow`: `id`, `name`, `email`, optional `avatarUrl`, `role`, `orgId`, `joinedAt`, optional nullable `lastActiveAt`, `isInactive`, and `permissions`.
- `MemberPermissions`: currently only `canChangeRole` and `canRemove`; the spec had `canMoveTo`, but the current schema does not.
- `MemberDetail`: extends `MemberRow` with one `org` and stats: `ticketsRequested`, `ticketsAssigned`, optional nullable `avgResolutionMs`.
- `TeamMemberListResponse`: `rows`, `total`, `page`, `pageSize`, optional `serverTime`.
- `Invitation`: includes `inviteUrl`; this is used by the copy-link UI.
- `AuditEntry`: supports either a `targetUser` or target-email fallback through controller mapping.
- `OrgSummary`: org-level counts for the Super Admin org view.
- `BulkMemberOp`: `ids`, optional `orgId`, `op` of `change_role` or `remove`, optional role-change payload.

Important drift from the original page doc:

- Invitation statuses are uppercase in the actual shared schema and Prisma enum.
- Member permissions do not include `canMoveTo`.
- Member detail does not model multiple org memberships. The database currently treats a local `User` as belonging to exactly one org.

## Database Model

The Prisma model is in `apps/api/prisma/schema.prisma`.

Important Teams-related facts:

- `User` has one `orgId`, one `role`, optional `clerkUserId`, `email`, `displayName`, optional `avatarUrl`, and optional `lastActiveAt`.
- A user can belong to only one org according to `docs/api/database_schema.md`.
- `Invitation` stores `email`, `role`, `orgId`, `invitedById`, `status`, optional unique `tokenHash`, optional `message`, `sentAt`, `expiresAt`, and optional `acceptedAt`.
- `TeamAuditLog` stores `actorId`, optional `targetUserId`, optional `targetEmail`, `orgId`, `action`, `fromRole`, `toRole`, optional `reason`, and `createdAt`.
- `AuditAction` values are uppercase: `ROLE_CHANGED`, `REMOVED`, `INVITED`, `INVITATION_CANCELLED`.
- Org moves are documented as unsupported in v1.

## Frontend Data Flow

`Team.tsx` is currently a feature-complete prototype tied to real hooks, but it still has preview-only behavior.

Read path:

1. `Teams` calls `useTeamMembersQuery({ role, q, page: 1, pageSize: 250 })`.
2. `useTeamMembersQuery` validates params with `TeamMemberListParamsSchema`.
3. `teamsApi.getMembers` calls `GET /teams/members`.
4. Response is parsed with `TeamMemberListResponseSchema`.
5. The page filters and sorts again client-side, then groups visible rows by `orgId`.
6. `useTeamOrgsQuery` calls `GET /teams/orgs` and provides org names/count context.
7. `useTeamInvitationsQuery({ status: "PENDING" })` calls `GET /teams/invitations`.

Mutation path:

- Role changes call `PATCH /teams/members/:userId/role`.
- Removals call `DELETE /teams/members/:userId` with optional `orgId`.
- Bulk operations call `POST /teams/members/bulk`.
- Invites call `POST /teams/invitations`.
- Resend calls `POST /teams/invitations/:id/resend`.
- Cancel calls `DELETE /teams/invitations/:id`.

Cache behavior:

- Query keys are centralized in `teamKeys`.
- Mutations invalidate member lists, member detail/history, org summaries, and invitations where relevant.
- There are no optimistic updates yet.

Local UI state:

- `useTeamsStore` stores selected row ids, expanded org ids, member detail drawer state, invite modal state, invite draft, and audit log selection.
- Only `inviteDraft` is persisted to localStorage through Zustand `persist`.
- Despite the page spec saying URL is source of truth, current page state is local React state: actor role preview, search, role filter, sort, and active tab are not synced to the URL.

## Frontend UI Behavior

Current `Teams` component behavior:

- Has a visible "Preview role" segmented control for `SUPER_ADMIN`, `ADMIN`, `MODERATOR`, and `USER`. This is not production auth; it lets the viewer manually preview role variants.
- Always fetches all members across orgs, then shapes the display according to the preview role.
- Super Admin view is org-grouped and expandable/collapsible.
- Admin view shows a read-only banner but still uses client-side preview role, not the authenticated user's actual role.
- Moderator view uses the same member result set and does not yet scope requests to the viewer org.
- User view renders a card grid but the card still opens member detail, whereas the spec says users do not need a detail drawer.
- Pending invitations are shown as a tab rather than a section above the members table.
- Pending invitations support Resend, Copy link, and Cancel buttons in the UI.
- Member detail drawer loads `GET /teams/members/:id`; it shows profile, activity stats, org membership, and static action buttons.
- Audit log state and query hook exist, but the page does not currently render an audit log modal.
- Bulk bar exists for selected Super Admin org rows and lets the user change role or remove selected ids.

Design choices currently visible in `Team.tsx`:

- The page uses inline CSS in the component through `teamsCss`.
- The palette is warm beige/orange and role pills use muted custom classes, not the exact role colors from `docs/web/teamsPage.md`.
- Components are local functions inside `Team.tsx`, not split into reusable files.
- Tables are dense, with row hover selection and action menus.
- The page uses Lucide icons.

## Backend Data Flow

Authentication:

1. Clerk middleware populates request auth.
2. `requireDbUser` reads Clerk `userId`.
3. The API looks up `User` by `clerkUserId`.
4. If no local `User` is found, authenticated routes return 401.
5. The resolved local user is attached as `req.dbUser`.

Members:

- `GET /teams/members` parses query params and calls `getMembers(db, params)`.
- `getMembers` builds a Prisma `where` from `orgId`, `role`, and `q`.
- It fetches users ordered by display name and returns paginated `MemberRow` data.
- `isInactive` is computed as no last activity or over 30 days since `lastActiveAt`.
- Permissions are currently hardcoded: `canChangeRole: true`, `canRemove: user.role !== ADMIN`.

Member detail:

- `GET /teams/members/:id` fetches one user by id and returns `MemberDetail`.
- Ticket stats count `REQUESTER` and `ASSIGNEE` participant rows.
- Average resolution is computed from resolved tickets where the user is an assignee.

Role changes:

- `PATCH /teams/members/:id/role` validates the member id and payload, updates `User.role`, and writes `TeamAuditLog`.
- Current audit actor is incorrectly set to the target member id, not `req.dbUser.id`.
- No role ladder or viewer authorization is enforced.
- No org scoping check is enforced.

Removal:

- `DELETE /teams/members/:id` deletes the local `User` row and writes `TeamAuditLog`.
- Current audit actor is incorrectly set to the target member id, not `req.dbUser.id`.
- No permission check is enforced.
- No ticket reassignment behavior is implemented; deletion relies on Prisma cascade behavior for related rows.
- The route returns a `BulkMemberResult` shape even though `teamsApi.removeMember` types it as `Promise<void>`.

Bulk:

- `POST /teams/members/bulk` loops over ids and deletes or role-updates each known user.
- Current audit actor is incorrectly set to the target id for each row.
- No permission checks or org scoping are enforced.
- It succeeds per id and returns `{ succeeded, failed }`.

Org summaries:

- `GET /teams/orgs` returns all orgs ordered by name.
- It includes `memberCount`, `adminCount`, `openTickets`, `staleTickets`, and optional `lastActivityAt`.
- No Super Admin-only authorization is currently enforced.

Audit:

- `GET /teams/audit` exists and returns audit entries filtered by optional `orgId`, cursor, and limit.
- `teamsApi.getMemberHistory` expects `GET /teams/members/:userId/history`, but `apps/api/src/routes/teams.ts` does not define that route.
- Because of that route mismatch, the frontend history hook cannot currently work against the backend.

## Invitation Flow

Creating an invite:

1. Frontend `InviteModal` calls `useInviteTeamMemberMutation`.
2. `teamsApi.invite` posts to `POST /teams/invitations`.
3. Backend validates `InvitePayloadSchema`.
4. Backend gets actor from `req.dbUser`.
5. Backend checks the org exists.
6. Backend creates a random raw token and stores only a SHA-256 `tokenHash`.
7. Invitation expires after 7 days.
8. Backend creates the `Invitation` and writes an `INVITED` audit log.
9. Backend sends email through `sendInviteMail`.
10. Backend returns an `Invitation` DTO with an invite URL containing the raw token.

Accepting an invite:

1. User opens `/invitations/:token` in the web app.
2. `InvitationAccept` calls public `GET /invitations/:token`.
3. Backend hashes the raw token and finds an invitation by `tokenHash`.
4. Backend rejects missing, non-pending, or expired invites.
5. If no local user exists for that `email + orgId`, it creates a stub `User` with `clerkUserId: null`.
6. Invitation status is updated to `ACCEPTED`.
7. Frontend redirects to `/sign-up?email=...`.

Clerk webhook linking:

- `POST /webhooks/clerk` verifies Svix headers/signature using `CLERK_WEBHOOK_SECRET`.
- It only handles `user.created`.
- It finds local stub users by matching email where `clerkUserId` is null.
- It updates all matching stub users with the Clerk user id and display name.
- This is intended to handle multi-org invitations, but the current `User.clerkUserId` field is unique, so linking multiple stub users to the same Clerk id would conflict if more than one row exists. The docs also say users belong to only one org, so this needs a policy decision before production.

## Current Endpoint Mismatches

Frontend methods that do not match backend routes today:

- `teamsApi.getMemberHistory(userId)` calls `GET /teams/members/:userId/history`, but backend only has `GET /teams/audit`.
- `teamsApi.resendInvitation(id)` calls `POST /teams/invitations/:id/resend`, but backend has no resend route.
- The page spec says move is a POST endpoint; the backend defines `PATCH /teams/members/:id/move`, while `teamsApi` currently has no `moveMember` method at all. The controller returns 405 because moves are unsupported.

Response type mismatches:

- `removeMember` and `cancelInvitation` frontend methods are typed as `Promise<void>`, but backend returns a `BulkMemberResult`-style object.
- `getInvitations` returns `inviteUrl` using `inv.id` in `apps/api/src/controllers/teams/data.ts`, but invite creation returns a URL with the raw token. The id-based URL cannot pass public verification because verification hashes the token and compares against `tokenHash`.

## Production Gaps

Authorization and scoping:

- Backend does not enforce Super Admin/Admin/Moderator/User permissions on Teams routes.
- Backend does not scope list results by viewer role. A non-Super Admin can currently query all members if authenticated.
- Backend does not validate role transition policy.
- Frontend uses a manual preview role instead of the authenticated user's role.
- Frontend action menus are gated by preview role and local logic, not by server-computed permissions.

Audit correctness:

- Role changes, removals, and bulk operations often write the target user as the actor.
- Invitation create/cancel use `req.dbUser.id` correctly.
- There is no per-member history route even though the frontend expects one.

Invitation correctness:

- Resend UI/client exists, backend route does not.
- Listing invitations returns invalid copy-link URLs based on invitation ids.
- Invite acceptance creates or reuses a stub local user but does not send a notification to the inviter.
- Accepted invitations are not connected to any frontend notification loop.
- Expired invitations are only marked expired when the public verification route is hit, not during list fetch.
- There is no role/org permission check for who may invite whom.

Deletion and data integrity:

- Removing a member deletes the local `User`, which can cascade ticket participants, messages/read states, notifications, and related records depending on Prisma relation settings.
- The UI says open tickets will be reassigned, but backend does not reassign tickets.
- The intended product says removal is from org only, not account deletion. The current one-org `User` model makes that distinction unclear.

Frontend production readiness:

- URL state is not implemented for `orgId`, `role`, `q`, or active tab.
- The page fetches a large page of 250 users and groups client-side rather than lazy-loading org sections.
- There is no real current-user role source in the Teams page.
- The pending invitations UI is a tab, not the spec's first-class section above the relevant member view.
- The user card grid still opens the detail drawer.
- Drawer action buttons are static and not wired to mutations.
- Audit log UI is not rendered.
- No toasts/error feedback are shown for most mutations.
- Invite modal does not expose a message field in the UI despite the payload supporting it.
- Moderator invite role choices are not restricted to User in the modal.

## Data Flow Summary

Current happy path for member list:

```text
Teams component
  -> useTeamMembersQuery(params)
  -> teamsApi.getMembers(params)
  -> GET /teams/members
  -> requireDbUser
  -> parseTeamMemberListParams
  -> Prisma user.findMany/count
  -> TeamMemberListResponseSchema validation
  -> client parses response again
  -> Team.tsx filters/sorts/groups rows for display
```

Current happy path for invite creation:

```text
InviteModal
  -> useInviteTeamMemberMutation
  -> teamsApi.invite(payload)
  -> POST /teams/invitations
  -> requireDbUser
  -> InvitePayloadSchema validation
  -> Prisma org lookup
  -> raw token generated, tokenHash stored
  -> invitation + audit log created
  -> email sent with raw token URL
  -> InvitationSchema validation
  -> invitations query invalidated
```

Current happy path for invite acceptance:

```text
/invitations/:token
  -> InvitationAccept
  -> invitationsApi.verify(token)
  -> GET /invitations/:token
  -> token hashed
  -> invitation lookup by tokenHash
  -> stub User created if needed
  -> invitation marked ACCEPTED
  -> frontend redirects to /sign-up?email=...
  -> Clerk user.created webhook later links stub User by email
```

## Likely First Fix Areas

1. Decide and implement the production authorization matrix on the backend first.
2. Replace preview-role behavior with authenticated user role/org context.
3. Align route contracts: member history, resend invitation, remove/cancel response shapes, move endpoint stance.
4. Fix audit actor attribution for role changes, removals, and bulk operations.
5. Fix invitation list `inviteUrl` so copy link works with token verification.
6. Resolve the one-org user model versus webhook comment about multi-org invitations.
7. Make removal behavior match product copy: reassign, preserve, or explicitly document consequences.
8. Move Teams filter state into URL params.
9. Restrict frontend invite and action controls based on server-computed permissions, with frontend checks only as a UI convenience.

