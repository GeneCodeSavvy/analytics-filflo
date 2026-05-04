# Teams isActive Feature Plan

## Goal

Show an `Active` pill beside a user name on the Teams page when that user has at least one open API WebSocket connection. Replace the teams-facing `lastActiveAt` field with `isActive`.

## Recommended Approach

Use backend WebSocket presence as the source of truth, expose `isActive: boolean` in the teams API response, and render an `Active` pill in the Teams UI. This keeps the frontend typesafe and avoids guessing presence from timestamps.

## Assumption

`isActive` means the user has at least one currently open API WebSocket connection, not specifically that they are viewing the Teams page.

## Implementation Plan

### 1. Add Presence Tracking on API

Modify `apps/api/src/lib/ws.ts`.

Create an in-memory presence registry:

```ts
const activeConnectionsByUserId = new Map<string, number>();
```

Expose helpers:

```ts
export function markUserConnected(userId: string): void;
export function markUserDisconnected(userId: string): void;
export function isUserActive(userId: string): boolean;
```

On WebSocket connection, increment the user's connection count. On socket close, decrement the count and remove the user when it reaches `0`.

### 2. Identify the WebSocket User

Current WebSocket path is `/threads/:threadId/ws`, and it does not currently authenticate or know the user.

Preferred implementation:

- Pass the Clerk session token from the web client when opening the WebSocket.
- Validate the token on the API side.
- Resolve the DB user from the Clerk user id.
- Track presence by DB `user.id`.

Narrow first-pass option:

- Pass the current DB `user.id` in the WebSocket query string.
- Only use this if it is validated server-side; do not trust an arbitrary client-provided user id.

### 3. Change Shared Teams Schema

Modify `packages/shared/schema/teams.ts`.

Replace the teams-facing member timestamp field:

```ts
lastActiveAt: z.string().nullable().optional()
```

with:

```ts
isActive: z.boolean()
```

Apply this to the list row schema and member detail schema if the detail drawer should also show live status.

Keep any DB `lastActiveAt` column internally if still useful, but do not expose it as the teams UI field.

### 4. Update Teams Data Mapping

Modify `apps/api/src/controllers/teams/data.ts`.

In `getMembers` and `getMemberById`, return:

```ts
isActive: isUserActive(user.id)
```

Remove `lastActiveAt` from the teams DTO returned by these functions.

### 5. Update Frontend Teams Types and Helpers

Modify:

- `apps/web/src/types/teams.ts`
- `apps/web/src/lib/teamsComponent.ts`

Remove teams UI usage of:

- `lastActiveAt`
- `relativeTime`
- `isStale`
- `"lastActive"` sort key

Either rename the sort key to `"active"` or remove that sort option from the table.

### 6. Update Teams UI

Modify:

- `apps/web/src/components/teams/MemberTable.tsx`
- `apps/web/src/components/teams/UserGrid.tsx`
- `apps/web/src/components/teams/DetailDrawer.tsx`

Render a small `Active` pill beside the member name when:

```ts
member.isActive
```

Replace the `Last Active` table column with `Status` or `Active`.

For inactive users, use either:

- no pill, for a quieter dense table
- muted `Inactive` text, if the status column needs explicit content

Recommended UI: show `Active` pill only for active users and keep inactive rows visually quiet.

### 7. Frontend Refresh Behavior

The Teams page does not currently subscribe to presence-specific WebSocket events.

Minimal implementation:

- Add a short `refetchInterval` to `useTeamMembersQuery`, such as `15_000`.
- This keeps active status reasonably fresh without adding a new real-time protocol.

Better follow-up:

- Add presence WebSocket events.
- Patch TanStack Query rows live when users connect or disconnect.

### 8. Verification

Run:

```bash
pnpm build
pnpm check-types
```

Manual smoke test:

1. Open the app as user A.
2. Confirm user A shows `Active` in Teams.
3. Open a second tab for user A and confirm the active state remains true.
4. Close one tab and confirm user A remains active.
5. Close all tabs/sockets for user A.
6. Confirm user A becomes inactive after refetch or reconnect cycle.

## Recommended First Slice

Implement the backend-truth version first:

1. Authenticated WebSocket presence registry.
2. `isActive` in shared teams schema.
3. Teams API mapping from presence registry.
4. Teams UI active pill.
5. Query refetch interval for freshness.

Live push updates can be added later if the polling interval is not responsive enough.
