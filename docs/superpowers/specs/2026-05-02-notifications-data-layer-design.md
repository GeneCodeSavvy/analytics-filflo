# Notifications Data Layer — Design Spec

**Date:** 2026-05-02

---

## Scope

Four discrete deliverables:
1. `packages/shared/schema/notifications.ts` — Zod schemas + inferred types
2. `apps/web/src/api/notificationApi.ts` — Axios API object
3. `apps/web/src/stores/useNotificationStore.ts` — Zustand UI-only store
4. `apps/web/src/hooks/useNotificationQueries.ts` + `useNotificationMutations.ts` — TanStack Query hooks

---

## Architecture Decisions

### Store scope (Zustand = UI only)
Existing stores (`useTicketStore`, `useMessageStore`) hold zero server state. Pattern is strictly enforced: selection IDs, expansion state, persisted preferences only. Server data (rows, loading, error, count) lives in React Query. The existing `useNotificationStore.ts` spec was wrong — it included `notifications`, `loading`, `error`, `bellBadgeCount`. All dropped.

### Selection/expansion data structure: `Record<string, true>`
Not `string[]` (O(n) lookup per row = O(n²) per render). Not `Set` (non-serializable, breaks `persist` middleware). `Record<string, true>` is O(1), natively JSON-serializable, idiomatic Zustand.

### Filters: URL = source of truth, zero in store
Query key derives from URL params directly. No Zustand filter state. Two sources = drift bugs.

### Selection cleared on tab change
Selection from Inbox tab is meaningless/dangerous for bulk ops on Done tab. Page component calls `clearSelection()` on tab change.

### single-op methods + `bulk` coexist — different cardinality
`markRead(id)` / `markDone(id)` / `markUnread(id)` for inline row actions (simple call sites). `bulk(payload)` for multi-select and ticket-scope operations. Not duplication — different UX surfaces.

### Optimistic strategy: mutate `state` field, never remove row
Rollback is trivial: restore previous state field. Removing requires remembering index/page/neighbors — bug-prone. Component layer (AnimatePresence) handles visual exit by filtering out rows whose `state` doesn't match current tab.

### Stale-time / poll alignment
List `staleTime: 25s`. Count poll `refetchInterval: 30s`. `onSuccess` of count poll: if returned count > current cache count, invalidate `['notifications', 'list']` to prevent badge/list desync.

### Discriminated unions on Zod schemas
- `NotificationRowSchema`: `z.discriminatedUnion('type', [...])` — invitation fields (`invitationId`, `invitationStatus`) only present when `type === 'ticket_invitation'`
- `BulkNotificationPayloadSchema`: `z.discriminatedUnion('op', [...])` — `snoozedUntil` required only when `op === 'snooze'`
- `BulkNotificationPayloadSchema` `scope` field: `'ids'` (explicit list) or `'ticket'` (ticket-scoped)

### `respondToInvitation`: `ticketId` dropped
`invitationId` is unique. `ticketId` was leaking the server's URL routing into the client shape. Server owns routing.

---

## Data Shapes

### NotificationRow (discriminated)
```ts
type NotificationRow =
  | BaseNotificationRow & { type: 'ticket_invitation'; invitationId: string; invitationStatus: 'pending' | 'accepted' | 'rejected' | 'expired' }
  | BaseNotificationRow & { type: Exclude<NotificationType, 'ticket_invitation'> }
```

### BulkNotificationPayload (discriminated)
```ts
type BulkNotificationPayload =
  | { scope: 'ids'; ids: string[]; op: 'read' | 'done' | 'unread' }
  | { scope: 'ids'; ids: string[]; op: 'snooze'; snoozedUntil: string }
  | { scope: 'ticket'; ticketId: string; op: 'read' | 'done' | 'unread' }
```

---

## Query Keys
```
['notifications', 'list', { tab, type?, ticketId?, orgId?, page, pageSize }]
['notifications', 'count']
['notifications', 'thread', notificationId]
['notifications', 'settings']
```

---

## Out of Scope
- WebSocket real-time (v1 = poll only)
- Email delivery (settings toggle scaffolded, sending not wired)
- UI components (this spec covers data layer only)
