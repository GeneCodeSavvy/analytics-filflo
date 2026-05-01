# Messages Feature — Data Layer Design

**Date:** 2026-05-01  
**Scope:** Zustand store, axios API object, TanStack Query hooks, Zod schemas  
**Source spec:** `docs/web/messagesPage.md`

---

## Decisions

| Question | Decision | Reason |
|---|---|---|
| Store scope | Thin (drafts + staged files only) | Matches actual codebase pattern — server data lives in React Query |
| Schema location | `packages/shared/schema/messages.ts` | Mirrors tickets pattern, shares with backend eventually |
| File/hook organization | Mirror tickets exactly (queries / mutations / WS separate) | Consistency over novelty |
| WebSocket hook | In scope | Send mutation and WS share a cache key — design together to prevent divergence |
| `activeThreadId` | URL only (`?thread=<id>`) | Spec §14: URL is source of truth |

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
  messages: MessageSchema.array(),
  nextCursor: z.string().optional(),
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

  getWebSocketUrl: (threadId: string): string =>
    `${import.meta.env.VITE_WS_BASE_URL}/threads/${threadId}/ws`,
};
```

---

## 4. Zustand Store (`stores/useMessageStore.ts`)

Owns only localStorage-persisted state that React Query and the URL cannot own.

```ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface MessageStoreState {
  drafts: Record<string, string>;           // threadId → composer content
  stagedFileIds: Record<string, string[]>;  // threadId → pre-uploaded fileIds

  saveDraft: (threadId: string, content: string) => void;
  clearDraft: (threadId: string) => void;
  getDraft: (threadId: string) => string;

  stageFile: (threadId: string, fileId: string) => void;
  unstageFile: (threadId: string, fileId: string) => void;
  clearStagedFiles: (threadId: string) => void;
}
```

- `persist` key: `'message-store'`
- `partialize`: persists `drafts` only (`stagedFileIds` is session-only — upload is gone on refresh)
- `activeThreadId` is **not** here — read from `useSearchParams` (`?thread=<id>`)

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

// Paginated messages — useInfiniteQuery
useThreadMessagesQuery(threadId: string | null)
  queryKey       : messageKeys.messages(threadId)
  getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined
  enabled        : !!threadId
  staleTime      : Infinity   // WS keeps cache fresh; no background refetch

// @mention autocomplete scoped to thread participants
useParticipantSearchQuery(q: string, threadId: string)
  queryKey : messageKeys.participants(threadId, q)
  enabled  : q.length >= 1
  staleTime: 60_000
```

---

## 6. Mutation Hooks (`hooks/useMessageMutations.ts`)

### `useSendMessageMutation(threadId)`
- `onMutate` — append optimistic `Message` with `id: 'pending-<uuid>'` to infinite query pages
- `onError` — remove optimistic message, show toast
- `onSuccess` — replace optimistic entry with real `Message` from server response
- `onSettled` — invalidate `messageKeys.threads(...)` so list snippet updates

### `useMarkThreadReadMutation()`
- `onMutate` — patch `ThreadListRow.unreadCount = 0` in thread list cache
- `onError` — rollback

### `useJoinThreadMutation()`
- `onSettled` — invalidate `messageKeys.thread(threadId)`

### `useMuteThreadMutation()` / `useUnmuteThreadMutation()`
- `onSettled` — invalidate thread list row

### `useAddParticipantMutation()`
- `onSettled` — invalidate `messageKeys.thread(threadId)`

### `useUploadFileMutation(threadId)`
- `onSuccess` — call `useMessageStore.stageFile(threadId, fileId)`
- `onError` — inline error below file preview (not toast)

---

## 7. WebSocket Hook (`hooks/useMessageWebSocket.ts`)

```ts
useMessageWebSocket(threadId: string | null): void
```

**Lifecycle:**
- Opens `new WebSocket(messageApi.getWebSocketUrl(threadId))` when `threadId` truthy
- Closes on unmount or `threadId` change
- Reconnect: exponential backoff starting 1s, doubling, max 30s. Resets on clean close.

**Incoming event handling:**
```
event.type === 'new_message'
  → queryClient.setQueryData(messageKeys.messages(threadId), appendToPages(event.message))
    if cache empty (thread never loaded messages), no-op — thread query will load on open

event.type === 'thread_list_update'
  → queryClient.setQueriesData({ queryKey: ['messages', 'threads'] }, patchRow(event.row))
    uses partial key — patches ALL cached thread list variants (all/unread/mine/org tabs)
    same pattern as patchTicketInLists in useTicketMutations.ts
```

`appendToPages` appends to the last page of the infinite query without triggering a refetch.  
`patchRow` updates `lastMessage`, `unreadCount`, `isUnanswered` on the matching row by id.

**No return value** — side-effect hook called inside the thread view component.

---

## Invariants

- `messageKeys` is the single source of truth for all cache keys. Mutations and WS hook both import it.
- Server data never enters Zustand.
- `activeThreadId` is never in Zustand — URL only.
- `stagedFileIds` is session-only (not persisted). Drafts are persisted.
- `useInfiniteQuery` `staleTime: Infinity` prevents background refetch fighting WS updates.
