# Messages Feature — Data Layer Design

**Date:** 2026-05-01  
**Scope:** Zustand store, axios API object, TanStack Query hooks, Zod schemas  
**Source spec:** `docs/web/messagesPage.md`

---

## Decisions

| Question | Decision | Reason |
|---|---|---|
| Store scope | Thin — drafts only | Staged files → local component state (lifecycle = composer lifecycle, no cross-mount persistence needed) |
| Schema location | `packages/shared/schema/messages.ts` | Mirrors tickets pattern, shares with backend eventually |
| File/hook organization | Mirror tickets exactly (queries / mutations / WS separate) | Consistency over novelty |
| WebSocket hook | In scope | Send mutation and WS share a cache key — design together |
| `activeThreadId` | URL only (`?thread=<id>`) | Spec §14: URL is source of truth |
| `ThreadSchema.messages` | **Drop it** | Dual source of truth with `useThreadMessagesQuery`; WS only updates the paginated cache; `nextCursor` belongs on a page, not a thread |
| WS no-op on empty cache | **Buffer** — queue events until first page lands, drain with dedupe | Silently dropping messages on initial load is a real bug |
| `markThreadRead` cache patch | Filter-aware — remove row from `unread` tab cache, patch `unreadCount` elsewhere | Immediate removal from unread tab is expected UX |
| `getWebSocketUrl` | Move off `messageApi` → `useMessageWebSocket` directly | Synchronous string return breaks the HTTP contract of the API object |
| Staged files | Local component state in composer | No cross-mount persistence requirement; lifecycle = component |
| `useUploadFileMutation` | Returns data only; caller (composer) stages file ID | Decouples mutation from store |

---

## File Map

```
packages/shared/schema/messages.ts      ← Zod schemas + inferred types
apps/web/src/
  lib/messageParams.ts                  ← re-exports, URL utils, messageKeys factory
  api/messageApi.ts                     ← axios methods
  stores/useMessageStore.ts             ← drafts + stagedFileIds (persist)
  hooks/useMessageQueries.ts            ← useQuery hooks
  hooks/useMessageMutations.ts          ← useMutation hooks
  hooks/useMessageWebSocket.ts          ← WS hook → writes to React Query cache
```

`packages/shared/schema/index.ts` — add `export * from './messages.js'`

---

## 1. Zod Schemas (`packages/shared/schema/messages.ts`)

```ts
import { z } from 'zod';
import { UserRefSchema } from './user.js';

export const MessageKindSchema = z.enum(['user_message', 'system_event', 'file_attachment']);

export const SystemEventKindSchema = z.enum([
  'status_change', 'priority_change', 'assignee_added',
  'assignee_removed', 'ticket_created',
]);

export const MessageSchema = z.object({
  id: z.string(),
  threadId: z.string(),
  kind: MessageKindSchema,
  sender: UserRefSchema,
  at: z.string(),
  content: z.string().optional(),
  mentions: UserRefSchema.array().optional(),
  ticketRefs: z.string().array().optional(),
  file: z.object({
    name: z.string(),
    size: z.number(),
    mimeType: z.string(),
    url: z.string(),
    thumbnailUrl: z.string().optional(),
  }).optional(),
  eventKind: SystemEventKindSchema.optional(),
  eventDescription: z.string().optional(),
});

export const ThreadListRowSchema = z.object({
  id: z.string(),
  ticket: z.object({
    id: z.string(),
    subject: z.string(),
    status: z.string(),
    priority: z.string(),
    orgId: z.string(),
    orgName: z.string(),
  }),
  lastMessage: z.object({
    snippet: z.string(),
    senderName: z.string(),
    at: z.string(),
    isSystemEvent: z.boolean(),
  }),
  unreadCount: z.number(),
  participantsPreview: UserRefSchema.array(),
  participantCount: z.number(),
  isUnanswered: z.boolean(),
  isMuted: z.boolean(),
});

export const ThreadSchema = z.object({
  id: z.string(),
  ticket: z.object({
    id: z.string(),
    subject: z.string(),
    status: z.string(),
    priority: z.string(),
    orgId: z.string(),
    orgName: z.string(),
  }),
  participants: UserRefSchema.array(),
  // messages intentionally absent — use useThreadMessagesQuery (useInfiniteQuery)
  // nextCursor belongs on MessagesPage, not the thread resource
  permissions: z.object({
    canSend: z.boolean(),
    canAddParticipants: z.boolean(),
    canJoin: z.boolean(),
    canMute: z.boolean(),
  }),
});

export const MessageFiltersSchema = z.object({
  tab: z.enum(['all', 'unread', 'mine', 'org']).default('all'),
  orgId: z.string().optional(),
  q: z.string().optional(),
});

export const MessagePageParamsSchema = z.object({
  cursor: z.string().optional(),
  limit: z.number().int().positive().default(50),
});

export const SendMessagePayloadSchema = z.object({
  content: z.string().optional(),
  mentionIds: z.string().array().optional(),
  ticketRefs: z.string().array().optional(),
  fileIds: z.string().array().optional(),
});

export const AddParticipantPayloadSchema = z.object({
  userId: z.string(),
});

export const FileUploadResponseSchema = z.object({
  fileId: z.string(),
  url: z.string(),
  thumbnailUrl: z.string().optional(),
});

export const MessagesPageSchema = z.object({
  messages: MessageSchema.array(),
  nextCursor: z.string().optional(),
});

// Inferred types
export type MessageKind = z.infer<typeof MessageKindSchema>;
export type SystemEventKind = z.infer<typeof SystemEventKindSchema>;
export type Message = z.infer<typeof MessageSchema>;
export type ThreadListRow = z.infer<typeof ThreadListRowSchema>;
export type Thread = z.infer<typeof ThreadSchema>;
export type MessageFilters = z.infer<typeof MessageFiltersSchema>;
export type MessagePageParams = z.infer<typeof MessagePageParamsSchema>;
export type SendMessagePayload = z.infer<typeof SendMessagePayloadSchema>;
export type AddParticipantPayload = z.infer<typeof AddParticipantPayloadSchema>;
export type FileUploadResponse = z.infer<typeof FileUploadResponseSchema>;
export type MessagesPage = z.infer<typeof MessagesPageSchema>;
```

---

## 2. `lib/messageParams.ts`

Re-exports all schemas/types from `@shared/schema`. Adds:

### Query Key Factory

```ts
export const messageKeys = {
  threads: (filters: MessageFilters) =>
    ['messages', 'threads', buildThreadListKey(filters)] as const,
  thread: (id: string) =>
    ['messages', 'thread', id] as const,
  messages: (threadId: string) =>
    ['messages', 'thread', threadId, 'messages'] as const,
  participants: (threadId: string, q: string) =>
    ['messages', 'participants', threadId, q] as const,
};
```

Both mutation hooks and WS hook import `messageKeys`. Cache key drift is impossible.

### URL Utilities

```ts
// Read MessageFilters from URL search params
export function parseMessageParams(params: URLSearchParams): MessageFilters

// Serialize MessageFilters back to URLSearchParams
export function serializeMessageParams(filters: MessageFilters): URLSearchParams

// Stable sorted key object for React Query (same pattern as buildListKey in ticketParams.ts)
export function buildThreadListKey(filters: MessageFilters): Record<string, unknown>
```

---

## 3. API Object (`api/messageApi.ts`)

```ts
import { api } from '.';
import type { MessageFilters, Thread, ThreadListRow, Message,
              SendMessagePayload, MessagesPage, FileUploadResponse } from '../lib/messageParams';

export const messageApi = {
  getThreads: (filters: MessageFilters, signal?: AbortSignal): Promise<ThreadListRow[]> =>
    api.get('/threads', { params: filters, signal }),

  getThread: (threadId: string, signal?: AbortSignal): Promise<Thread> =>
    api.get(`/threads/${threadId}`, { signal }),

  getMessages: (threadId: string, cursor?: string, signal?: AbortSignal): Promise<MessagesPage> =>
    api.get(`/threads/${threadId}/messages`, { params: { cursor, limit: 50 }, signal }),

  send: (threadId: string, payload: SendMessagePayload): Promise<Message> =>
    api.post(`/threads/${threadId}/messages`, payload),

  markThreadRead: (threadId: string): Promise<void> =>
    api.post(`/threads/${threadId}/read`),

  addParticipant: (threadId: string, userId: string): Promise<void> =>
    api.post(`/threads/${threadId}/participants`, { userId }),

  joinThread: (threadId: string): Promise<void> =>
    api.post(`/threads/${threadId}/join`),

  muteThread: (threadId: string): Promise<void> =>
    api.post(`/threads/${threadId}/mute`),

  unmuteThread: (threadId: string): Promise<void> =>
    api.delete(`/threads/${threadId}/mute`),

  uploadFile: (threadId: string, file: File): Promise<FileUploadResponse> => {
    const form = new FormData();
    form.append('file', file);
    return api.post(`/threads/${threadId}/files`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // getWebSocketUrl intentionally absent — synchronous string return breaks
  // the Promise<T> contract of this object. WS URL constructed in useMessageWebSocket directly.
};
```

---

## 4. Zustand Store (`stores/useMessageStore.ts`)

Owns only localStorage-persisted state that React Query and URL cannot own.

```ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface MessageStoreState {
  drafts: Record<string, string>;  // threadId → composer content

  saveDraft: (threadId: string, content: string) => void;
  clearDraft: (threadId: string) => void;
  getDraft: (threadId: string) => string;
}
```

- `persist` key: `'message-store'`
- `partialize`: entire state (only `drafts` exists)
- `activeThreadId` — URL only (`?thread=<id>`), not in store
- `stagedFileIds` — **not here**; lives in local component state in the composer
  - Lifecycle = composer mount/unmount — `useEffect` cleanup handles it automatically
  - No cross-mount persistence requirement
  - `useUploadFileMutation` returns `{ fileId, url, thumbnailUrl? }`; the composer calls `stageFile` itself

---

## 5. Query Hooks (`hooks/useMessageQueries.ts`)

```ts
// Thread list — driven by URL filter state
useThreadListQuery(filters: MessageFilters)
  queryKey : messageKeys.threads(filters)
  staleTime: 30_000
  placeholderData: previousData

// Thread detail — permissions + ticket context bar
useThreadQuery(threadId: string | null)
  queryKey: messageKeys.thread(threadId)
  enabled : !!threadId

// Paginated messages — useInfiniteQuery, newest page at pages[0]
// (scroll-up loads older: getNextPageParam returns nextCursor for older pages)
useThreadMessagesQuery(threadId: string | null)
  queryKey        : messageKeys.messages(threadId)
  getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined
  enabled         : !!threadId
  staleTime       : 5 * 60_000  // NOT Infinity — safety net for WS disconnect gaps
                                 // WS reconnect also triggers explicit refetch of latest page

// @mention autocomplete scoped to thread participants
useParticipantSearchQuery(q: string, threadId: string)
  queryKey : messageKeys.participants(threadId, q)
  enabled  : q.length >= 2  // not 1 — single-char is server abuse; debounce input 300ms
  staleTime: 60_000
```

---

## 6. Mutation Hooks (`hooks/useMessageMutations.ts`)

### `useSendMessageMutation(threadId)`

**Page ordering contract:** `pages[0]` is the newest page. Optimistic message appends to `pages[0].messages` (front). WS messages also prepend to `pages[0]`.

- `onMutate`
  - Guard: if `pages` is empty, do NOT optimistic-append (no page to prepend to); let send complete and WS deliver
  - Append `Message { id: 'pending-<uuid>', ...fields }` to front of `pages[0].messages`
  - Use exact `pending-<uuid>` id — never search by "is pending" to avoid swap collision on concurrent sends
- `onError` — find + remove by exact `pending-<uuid>`, show toast
- `onSuccess` — find + replace `pending-<uuid>` with real `Message` from server
- `onSettled` — invalidate `messageKeys.threads(...)` (snippet update); do NOT invalidate `messageKeys.messages(...)` — WS is source of truth, invalidation would fight it

### `useMarkThreadReadMutation()`

Filter-aware patch using `setQueriesData` with partial key `['messages', 'threads']`:
- Tab is `'unread'` → **remove the row** from that cache (row should disappear immediately)
- All other tabs → **patch** `ThreadListRow.unreadCount = 0`

```ts
queryClient.setQueriesData({ queryKey: ['messages', 'threads'] }, (old, { queryKey }) => {
  const filters = parseFiltersFromKey(queryKey);
  if (filters?.tab === 'unread') return removeRow(old, threadId);
  return patchRow(old, threadId, { unreadCount: 0 });
});
```

- `onError` — rollback (restore removed/patched rows)

### `useJoinThreadMutation()`
- `onSettled` — invalidate `messageKeys.thread(threadId)`

### `useMuteThreadMutation()` / `useUnmuteThreadMutation()`
- `onSettled` — invalidate thread list row

### `useAddParticipantMutation()`
- `onSettled` — invalidate `messageKeys.thread(threadId)`

### `useUploadFileMutation(threadId)`
- Returns `{ fileId, url, thumbnailUrl? }` — **no Zustand side-effect**
- Caller (composer component) receives the result via `onSuccess` at the call site and stages it in local state
- `onError` — inline error below file preview (not toast)

---

## 7. WebSocket Hook (`hooks/useMessageWebSocket.ts`)

```ts
useMessageWebSocket(threadId: string | null): void
```

**WS URL** constructed inside this hook (not on `messageApi` — a synchronous string helper has no place on the HTTP API object):
```ts
const wsUrl = `${import.meta.env.VITE_WS_BASE_URL}/threads/${threadId}/ws`;
```

**Lifecycle:**
- Opens `new WebSocket(wsUrl)` when `threadId` truthy
- Closes + clears buffer on unmount or `threadId` change
- Reconnect: exponential backoff 1s → 2s → 4s → max 30s; resets on clean close
- **On reconnect:** call `queryClient.fetchQuery(messageKeys.messages(threadId))` to fill gap during disconnect, then drain buffer

**Event buffer — solves WS-before-first-page race:**
```ts
const eventBuffer = useRef<Message[]>([]);

// On 'new_message', if cache has no pages yet:
eventBuffer.current.push(event.message);

// When first page loads (watch query state):
function drainBuffer() {
  const pending = eventBuffer.current.splice(0);
  for (const msg of pending) {
    if (!isAlreadyInCache(msg.id)) prependToPage0(msg);
  }
}
```

**Incoming event handling:**
```
event.type === 'new_message'
  → dedupe by id first (prevents double from optimistic+WS arriving for same message)
  → prepend to pages[0].messages (newest page, front)
  → queryClient.setQueryData(messageKeys.messages(threadId), updatedPages)

event.type === 'thread_list_update'
  → queryClient.setQueriesData({ queryKey: ['messages', 'threads'] }, patchRow(event.row))
    partial key — patches ALL cached thread list variants (all/unread/mine/org tabs)
    same pattern as patchTicketInLists in useTicketMutations.ts
```

`patchRow` updates `lastMessage`, `unreadCount`, `isUnanswered` on the matching row by id.

**No return value** — side-effect hook, called inside the thread view component.

---

## Invariants

- `messageKeys` is the single source of truth for all cache keys. Mutations and WS hook both import it.
- Server data never enters Zustand. Zustand owns drafts only.
- `activeThreadId` never in Zustand — URL only.
- Staged file IDs live in local component state in the composer. Not in Zustand, not in RQ.
- `useUploadFileMutation` returns data only — no store side-effects. Caller stages result.
- `ThreadSchema` has no `messages` field — all message reads go through `useThreadMessagesQuery`.
- `pages[0]` = newest page. All prepend operations target `pages[0].messages[0]`.
- WS `new_message` handler dedupes by id before writing to cache (prevents optimistic+WS doubles).
- WS events are buffered until first page loads; drained with dedupe on first `isSuccess`.
- `staleTime: 5 * 60_000` on messages query — not Infinity — provides fallback when WS disconnects.
- WS reconnect triggers explicit refetch of latest page before draining buffer.
- `useMarkThreadReadMutation` is filter-aware: removes row from `unread` tab, patches others.
- `onSettled` in send mutation does NOT invalidate `messageKeys.messages(...)` — WS is live truth.
- Participant search: `q.length >= 2` minimum; debounce 300ms upstream.
