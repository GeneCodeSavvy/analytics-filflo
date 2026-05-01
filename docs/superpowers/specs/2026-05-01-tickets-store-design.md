# Tickets Page — State Layer Design

**Date:** 2026-05-01  
**Stack:** React 19, TanStack Query v5, Zustand, React Router v7, Axios

---

## 1. Layer Boundaries

```
URL (useSearchParams / React Router v7)
  viewId         → ?view=<id>
  filters        → ?status=OPEN,IN_PROGRESS&priority=HIGH&category=&assignee=&q=&stale=
  sort           → ?sort=updatedAt:desc,priority:asc   (comma-separated, multi-sort)
  page           → ?page=1
  drawerTicketId → /tickets/:ticketId  (route param)
  createModal    → ?modal=create

useTicketStore (Zustand — UI-only, no server state)
  selectedRowIds   → row selection for bulk actions
  density          → compact | comfortable
                     persisted via Zustand persist middleware with partialize
                     (only density is whitelisted — selectedRowIds never persists)
  Rule: URL owns state that should survive refresh or be shareable.
  Rule: Zustand owns state that is ephemeral and must not persist across reloads.

TanStack Query (server state — single source of truth for optimistic updates)
  useTicketListQuery      → GET /tickets
  useViewsQuery           → GET /tickets/views
  useTicketDetailQuery    → GET /tickets/:id
  useTicketActivityQuery  → GET /tickets/:id/activity
  useNewTicketsPoll       → GET /tickets/since
  useUserSearchQuery      → GET /users/search  (callers must pass debounced q)
  Mutations: see §4

ticketApi (axios — stateless HTTP layer)
  No state. Typed request/response. Accepts AbortSignal.

userApi (axios — stateless)
  search(q, orgId) → UserRef[]

lib/ticketParams.ts
  parseFilters, parseSort, mergeFilters, mergeSort, buildListKey — pure URL helpers

useTicketsPageActions  — URL setters + store actions. Importable by any component.
useTicketsPageData     — Composes all query hooks. Root page component only.
```

---

## 2. Zustand Store

Owns only ephemeral UI state. `partialize` ensures only `density` survives across reloads — `selectedRowIds` is always initialized to `[]`.

```ts
interface TicketUIState {
  selectedRowIds: string[];
  density: 'compact' | 'comfortable';

  setSelectedRows: (ids: string[]) => void;
  toggleRowSelected: (id: string) => void;
  clearSelection: () => void;
  setDensity: (d: 'compact' | 'comfortable') => void;
}

// Persist config:
persist(store, {
  name: 'ticket-ui',
  partialize: (s) => ({ density: s.density }),  // selectedRowIds intentionally excluded
})
```

**Selection auto-clear rule:** `clearSelection()` fires only when `filters` or `viewId` change — not on page change, modal open, or drawer open. Implemented in `useTicketsPageData` as:

```ts
const filtersHash = JSON.stringify(parseFilters(searchParams));
useEffect(() => { clearSelection(); }, [filtersHash, viewId]);
```

---

## 3. `ticketApi` and `userApi` — Axios Objects

Thin, stateless, fully typed. All read methods accept `AbortSignal` (TanStack Query forwards it automatically). `getSince` strips `page`/`pageSize` — the poll is filter-scoped, not page-scoped.

```ts
export const ticketApi = {
  getList:        (params: TicketListParams, signal?: AbortSignal): Promise<ListResponse>
  getById:        (id: string, signal?: AbortSignal): Promise<TicketDetail>
  getViews:       (signal?: AbortSignal): Promise<View[]>
  createView:     (data: CreateViewPayload): Promise<View>
  updateView:     (id: string, data: UpdateViewPayload): Promise<View>
  deleteView:     (id: string): Promise<void>
  create:         (data: NewTicketDraft): Promise<TicketDetail>
  update:         (id: string, patch: UpdateTicketPayload): Promise<TicketDetail>
  delete:         (id: string): Promise<void>
  updateStatus:   (id: string, status: Status): Promise<TicketDetail>
  updatePriority: (id: string, priority: Priority): Promise<TicketDetail>
  assign:         (id: string, payload: AssignPayload): Promise<TicketDetail>
  bulkUpdate:     (payload: BulkUpdatePayload): Promise<BulkResult>
  bulkDelete:     (payload: BulkDeletePayload): Promise<void>
  // page/pageSize stripped — poll is filter-scoped, not page-scoped
  getSince:       (since: string, params: TicketFilterParams, signal?: AbortSignal): Promise<{ count: number }>
  getActivity:    (id: string, signal?: AbortSignal): Promise<ActivityEntry[]>
}

export const userApi = {
  search: (q: string, orgId?: string, signal?: AbortSignal): Promise<UserRef[]>
}
```

Type aliases:
```ts
// Full list params (includes pagination)
type TicketListParams = TicketFilters & { sort: string; page: number; pageSize: number; groupBy?: string }

// Filter-only params (no page/pageSize — used for poll)
type TicketFilterParams = TicketFilters & { sort: string; groupBy?: string }
```

**`AssignPayload` shape** (pinned explicitly):
```ts
interface AssignPayload {
  add: string[];     // user IDs to add
  remove: string[];  // user IDs to remove
}
```

**`BulkResult` partial failure contract:**
```ts
interface BulkResult {
  succeeded: string[];  // ticket IDs
  failed: { id: string; reason: string }[];
}
// On partial failure: roll back only failed IDs; toast per-failure summary.
```

---

## 4. TanStack Query Hooks

### Query Key Normalization

All list and poll keys go through `buildListKey` to prevent key thrash from field-order variance:

```ts
// lib/ticketParams.ts
function buildListKey(params: TicketListParams | TicketFilterParams): Record<string, unknown> {
  // Sort keys alphabetically, drop undefined/empty-array fields, normalize arrays to sorted strings
  return Object.fromEntries(
    Object.entries(params)
      .filter(([, v]) => v !== undefined && !(Array.isArray(v) && v.length === 0))
      .sort(([a], [b]) => a.localeCompare(b))
  );
}
```

### Query Hooks

```ts
// Primary list — 25s staleTime prevents re-fetch 2s after poll on window focus
useTicketListQuery(params: TicketListParams)
  queryKey:                    ['tickets', 'list', buildListKey(params)]
  queryFn:                     ({ signal }) => ticketApi.getList(params, signal)
  staleTime:                   25_000
  refetchInterval:             30_000
  refetchIntervalInBackground: false
  placeholderData:             keepPreviousData
  retry:                       1

// Views — long stale + gcTime prevents loading flash on tab return
useViewsQuery()
  queryKey:  ['tickets', 'views']
  queryFn:   ({ signal }) => ticketApi.getViews(signal)
  staleTime: 5 * 60 * 1000
  gcTime:    30 * 60 * 1000

// Detail drawer — only fetches when id present
// On 404 error: consumer calls closeDrawer() + toast (see §6)
useTicketDetailQuery(ticketId: string | null)
  queryKey: ['tickets', 'detail', ticketId]
  queryFn:  ({ signal }) => ticketApi.getById(ticketId!, signal)
  enabled:  !!ticketId
  retry:    (failureCount, error) => error.status !== 404 && failureCount < 2

// Activity tab inside drawer
useTicketActivityQuery(ticketId: string | null)
  queryKey: ['tickets', 'activity', ticketId]
  queryFn:  ({ signal }) => ticketApi.getActivity(ticketId!, signal)
  enabled:  !!ticketId

// Poll — cursor via ref (NOT in key). Key uses filter-only params (no page/pageSize).
// sinceRef is seeded from list.data.serverTime and reset when filter params change.
useNewTicketsPoll(filterParams: TicketFilterParams)
  queryKey:                    ['tickets', 'since', buildListKey(filterParams)]
  queryFn:                     ({ signal }) => ticketApi.getSince(sinceRef.current, filterParams, signal)
  refetchInterval:             30_000
  refetchIntervalInBackground: false
  retry:                       0
  // sinceRef reset logic (inside the hook):
  //   useEffect(() => { sinceRef.current = ''; }, [buildListKey(filterParams)])
  //   On successful list fetch: sinceRef.current = list.data.serverTime

// Assignee / invitee picker
// CALLER RESPONSIBILITY: pass a debounced q value (300ms recommended).
// Hook does not debounce internally.
useUserSearchQuery(q: string, orgId?: string)
  queryKey:  ['users', 'search', q, orgId]
  queryFn:   ({ signal }) => userApi.search(q, orgId, signal)
  enabled:   q.length >= 2
  staleTime: 60_000
```

### Mutation Hooks

**Optimistic strategy:** `queryClient.setQueryData` in `onMutate` for all mutations — single source of truth is the cache. `useOptimistic` (React 19) is **not used** — it is component-scoped and causes ghost state when the same row is visible on multiple surfaces (table + drawer) or targeted by concurrent mutations.

**Single-row mutations** patch both list and detail caches:

```ts
// Pattern for useStatusMutation, usePriorityMutation, useAssignMutation, useUpdateTicketMutation
onMutate: async ({ id, ...patch }) => {
  await queryClient.cancelQueries({ queryKey: ['tickets', 'list'] });
  await queryClient.cancelQueries({ queryKey: ['tickets', 'detail', id] });

  const prevList   = queryClient.getQueryData(['tickets', 'list', activeListKey]);
  const prevDetail = queryClient.getQueryData(['tickets', 'detail', id]);

  queryClient.setQueryData(['tickets', 'list', activeListKey], (old: ListResponse) => ({
    ...old,
    rows: old.rows.map(r => r.id === id ? { ...r, ...patch } : r),
  }));
  queryClient.setQueryData(['tickets', 'detail', id], (old: TicketDetail) =>
    old ? { ...old, ...patch } : old
  );
  return { prevList, prevDetail };
},
onError: (_err, { id }, ctx) => {
  queryClient.setQueryData(['tickets', 'list', activeListKey], ctx.prevList);
  queryClient.setQueryData(['tickets', 'detail', id], ctx.prevDetail);
},
onSettled: (_data, _err, { id }) => {
  queryClient.invalidateQueries({ queryKey: ['tickets', 'list'], refetchType: 'active' });
  queryClient.invalidateQueries({ queryKey: ['tickets', 'detail', id] });
}
```

**Bulk mutations** invalidate (not `setQueryData`) because selection may span pages:

```ts
// useBulkUpdateMutation, useBulkDeleteMutation
onMutate: async () => {
  await queryClient.cancelQueries({ queryKey: ['tickets', 'list'] });
},
onSettled: () => {
  queryClient.invalidateQueries({ queryKey: ['tickets', 'list'], refetchType: 'active' });
}
// Partial failure: toast per failed ID from BulkResult.failed
```

**Full mutation list:**
```ts
useStatusMutation()          → ticketApi.updateStatus()    // single-row pattern
usePriorityMutation()        → ticketApi.updatePriority()  // single-row pattern
useAssignMutation()          → ticketApi.assign()           // single-row pattern
useUpdateTicketMutation()    → ticketApi.update()           // single-row pattern
useBulkUpdateMutation()      → ticketApi.bulkUpdate()       // bulk pattern
useBulkDeleteMutation()      → ticketApi.bulkDelete()       // bulk pattern
useCreateTicketMutation()    → ticketApi.create()           // invalidates list on settle
useDeleteTicketMutation()    → ticketApi.delete()           // invalidates list on settle
useSaveViewMutation()        → ticketApi.createView()       // invalidates views on settle
useUpdateViewMutation()      → ticketApi.updateView()       // invalidates views on settle
useDeleteViewMutation()      → ticketApi.deleteView()       // invalidates views + cleanup (see §6)
```

---

## 5. `useTicketDraft` — Standalone Hook

No store involvement. Key: `ticket-draft`. `load()` must be called on every create modal mount.

```ts
function useTicketDraft() {
  const save  = (draft: NewTicketDraft) => localStorage.setItem('ticket-draft', JSON.stringify(draft));
  const load  = (): NewTicketDraft | null => JSON.parse(localStorage.getItem('ticket-draft') ?? 'null');
  const clear = () => localStorage.removeItem('ticket-draft');
  return { save, load, clear };
}
```

Multi-tab: last-write-wins (accepted). Reactive sync not implemented — `storage` event wiring not worth it for a create-only flow.

---

## 6. `useTicketsPageActions` and `useTicketsPageData`

The original `useTicketsPageRoot` is split into two hooks:

- **`useTicketsPageActions`** — URL setters + store actions. Cheap, importable by any child component. No query subscriptions.
- **`useTicketsPageData`** — composes query hooks + store selectors. Root `<TicketsPage>` component only. Children that need data call primitive query hooks directly.

### `useTicketsPageActions`

```ts
function useTicketsPageActions() {
  const navigate = useNavigate();
  const [, setSearchParams] = useSearchParams();

  // All setters wrapped in useCallback — stable references across renders
  const setFilters = useCallback((f: Partial<TicketFilters>) =>
    setSearchParams(p => mergeFilters(p, f)), [setSearchParams]);

  const setSort = useCallback((s: TicketSort[]) =>
    setSearchParams(p => mergeSort(p, s)), [setSearchParams]);

  const setPage = useCallback((n: number) =>
    setSearchParams(p => { p.set('page', String(n)); return p; }), [setSearchParams]);

  const setView = useCallback((id: string) =>
    setSearchParams(p => { p.set('view', id); return p; }), [setSearchParams]);

  const openModal = useCallback(() =>
    setSearchParams(p => { p.set('modal', 'create'); return p; }), [setSearchParams]);

  const closeModal = useCallback(() =>
    setSearchParams(p => { p.delete('modal'); return p; }), [setSearchParams]);

  const openDrawer  = useCallback((id: string) => navigate(`/tickets/${id}`), [navigate]);
  const closeDrawer = useCallback(() => navigate('/tickets'), [navigate]);

  // Store actions via selectors (no whole-store subscription)
  const setSelectedRows  = useTicketStore(s => s.setSelectedRows);
  const toggleRowSelected = useTicketStore(s => s.toggleRowSelected);
  const clearSelection   = useTicketStore(s => s.clearSelection);
  const setDensity       = useTicketStore(s => s.setDensity);

  return {
    setFilters, setSort, setPage, setView,
    openModal, closeModal, openDrawer, closeDrawer,
    setSelectedRows, toggleRowSelected, clearSelection, setDensity,
  };
}
```

### `useTicketsPageData`

```ts
function useTicketsPageData() {
  const { ticketId } = useParams();
  const [searchParams] = useSearchParams();
  const { closeDrawer, setView } = useTicketsPageActions();

  const filters  = parseFilters(searchParams);
  const sort     = parseSort(searchParams);      // returns TicketSort[]
  const page     = Number(searchParams.get('page') ?? 1);
  const viewId   = searchParams.get('view') ?? null;
  const modalOpen = searchParams.get('modal') === 'create';

  // Store — per-field selectors only
  const selectedRowIds = useTicketStore(s => s.selectedRowIds);
  const density        = useTicketStore(s => s.density);
  const clearSelection = useTicketStore(s => s.clearSelection);

  // Selection auto-clear: filters or viewId changed only
  const filtersHash = JSON.stringify(filters);
  useEffect(() => { clearSelection(); }, [filtersHash, viewId]);

  const listParams   = { ...filters, sort: serializeSort(sort), page, pageSize: 25 };
  const filterParams = { ...filters, sort: serializeSort(sort) };

  const list   = useTicketListQuery(listParams);
  const views  = useViewsQuery();
  const banner = useNewTicketsPoll(filterParams);
  const detail = useTicketDetailQuery(ticketId ?? null);

  // Drawer 404 handling
  useEffect(() => {
    if (detail.error?.status === 404) {
      closeDrawer();
      toast.error('Ticket not found or has been deleted.');
    }
  }, [detail.error]);

  return {
    data: {
      rows:  list.data?.rows ?? [],
      total: list.data?.total ?? 0,
      views: views.data ?? [],
      detail: detail.data ?? null,
    },
    status: {
      loading: list.isPending,
      error:   list.error,
    },
    url: { filters, sort, page, viewId, modalOpen, drawerTicketId: ticketId ?? null },
    ui:  { selectedRowIds, density, newTicketsBannerCount: banner.data?.count ?? 0 },
  };
}
```

### View Deletion Cleanup

`useDeleteViewMutation` `onSuccess` handler:

```ts
onSuccess: (_data, deletedId) => {
  queryClient.invalidateQueries({ queryKey: ['tickets', 'views'] });
  if (viewId === deletedId) {
    setView('');  // clear active view from URL
  }
}
```

---

## 7. `lib/ticketParams.ts` — URL Helpers

```ts
// Merge semantics: undefined = leave unchanged, null = delete key from URL
function mergeFilters(params: URLSearchParams, patch: Partial<TicketFilters>): URLSearchParams
function mergeSort(params: URLSearchParams, sort: TicketSort[]): URLSearchParams
function parseFilters(params: URLSearchParams): TicketFilters
function parseSort(params: URLSearchParams): TicketSort[]       // returns TicketSort[]
function serializeSort(sort: TicketSort[]): string              // → 'updatedAt:desc,priority:asc'
function buildListKey(params: TicketListParams | TicketFilterParams): Record<string, unknown>
```

**Sort serialization:** comma-separated `field:dir` pairs. Supports multi-sort from day one. `parseSort` and `serializeSort` are inverses.

**Filter URL serialization:** array fields are comma-separated (`status=OPEN,IN_PROGRESS`). `undefined` fields are omitted from URL entirely. `parseFilters` returns empty array `[]` (never `undefined`) for unset array fields.

**`buildListKey`:** sorts object keys alphabetically, drops `undefined` and empty arrays, normalizes arrays to sorted comma-separated strings. Prevents key thrash from field-order variance across render cycles.

---

## 8. Decision Log

| Decision | Rule / Rationale |
|---|---|
| URL vs Zustand | URL if shareable/survives refresh; Zustand if ephemeral-only |
| `createModalOpen` | URL (`?modal=create`) — shareable link to pre-open modal |
| `drawerTicketId` | URL route param — shareable, supports direct link |
| `density` | Zustand + persist with `partialize` — user preference, not nav state |
| `selectedRowIds` | Zustand — ephemeral; never persisted; cleared on filter/view change only |
| `newTicketsBannerCount` | Derived from `useNewTicketsPoll` — not stored anywhere |
| Optimistic strategy | `setQueryData` in `onMutate` for all mutations — no `useOptimistic` |
| Single-row optimistic | Patches both `['tickets','list',*]` and `['tickets','detail',id]` |
| Bulk optimistic | Invalidate with `refetchType: 'active'` — selection may span pages |
| Poll cursor | Ref, not query key — prevents cache bloat and cadence reset |
| Poll params | `TicketFilterParams` (no page/pageSize) — poll is filter-scoped |
| Query key normalization | `buildListKey()` — canonical sorted key prevents refetch storms |
| `staleTime` on list | `25_000` — dedupe window focus refetch when poll just ran |
| `gcTime` on views | `30 * 60 * 1000` — prevents loading flash on tab return |
| `useTicketsPageData` | Root `<TicketsPage>` only — children call primitive hooks |
| `useTicketsPageActions` | Any component may import — no query subscriptions, all `useCallback` |
| Bulk mutations | Split: `useBulkUpdateMutation` + `useBulkDeleteMutation` |
| View delete cleanup | `onSuccess`: if deleted view was active, clear `?view=` from URL |
| Drawer 404 | `detail.error?.status === 404` → `closeDrawer()` + toast |
| `useUserSearchQuery` | Callers must pass debounced `q` (300ms recommended) |
| `partialize` | Whitelist `density` only — `selectedRowIds` must never persist |
| Sort multi-sort | Serialized as `'field:dir,field:dir'` — `TicketSort[]` at all call sites |
| Partial bulk failure | `BulkResult.failed[]` — roll back failed IDs only, toast summary |
| `AssignPayload` | `{ add: string[], remove: string[] }` — explicit delta, not full replace |
