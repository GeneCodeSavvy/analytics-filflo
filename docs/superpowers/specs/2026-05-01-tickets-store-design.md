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
                     (only density whitelisted — selectedRowIds never persists)
  Rule: URL owns state that should survive refresh or be shareable.
  Rule: Zustand owns state that is ephemeral and must not persist across reloads.

TanStack Query (server state — single source of truth for optimistic updates)
  useTicketListQuery      → GET /tickets  (NO refetchInterval — banner-driven only)
  useViewsQuery           → GET /tickets/views
  useTicketDetailQuery    → GET /tickets/:id
  useTicketActivityQuery  → GET /tickets/:id/activity
  useNewTicketsPoll       → GET /tickets/since  (30s interval, drives banner count)
  useUserSearchQuery      → GET /users/search  (callers must pass debounced q)
  Mutations: see §4

ticketApi (axios — stateless HTTP layer)
  No state. Typed request/response. Accepts AbortSignal.

userApi (axios — stateless)
  search(q, orgId) → UserRef[]

lib/ticketParams.ts
  parseFilters, parseSort, mergeFilters, mergeSort,
  buildListKey, serializeSort, normalizeParams — pure URL/param helpers

useTicketsPageActions  — URL setters + store actions. Importable by any component.
useTicketsPageData     — Composes query hooks. Root page component only.
```

---

## 2. Zustand Store

Owns only ephemeral UI state. `partialize` ensures only `density` survives across reloads.

```ts
interface TicketUIState {
  selectedRowIds: string[];
  density: 'compact' | 'comfortable';

  setSelectedRows: (ids: string[]) => void;
  toggleRowSelected: (id: string) => void;
  clearSelection: () => void;
  setDensity: (d: 'compact' | 'comfortable') => void;
}

persist(store, {
  name: 'ticket-ui',
  partialize: (s) => ({ density: s.density }),  // selectedRowIds intentionally excluded
})
```

**Selection auto-clear rule:** fires only when `filters` or `viewId` change (not page, modal, or drawer). Uses canonical key to prevent spurious clears from field-order variance:

```ts
const filtersHash = JSON.stringify(buildListKey(filterParams));
useEffect(() => { clearSelection(); }, [filtersHash, viewId]);
```

**Selection pruning:** `selectedRowIds` are IDs only — they survive page changes. Ghost IDs (row mutated out of filter, or deleted by another user) are tolerated by the server's bulk endpoint (returns them in `BulkResult.failed`). No client-side pruning against `list.data.rows`.

---

## 3. `ticketApi` and `userApi` — Axios Objects

Thin, stateless, fully typed. All read methods accept `AbortSignal`. `getSince` takes `TicketFilterParams` (no `page`/`pageSize`).

**URLSearchParams mutation rule:** All `setSearchParams` updaters must clone before mutating:
```ts
setSearchParams(p => {
  const next = new URLSearchParams(p);  // clone — never mutate p in place
  next.set('key', value);
  return next;
});
```
Same applies inside `mergeFilters` and `mergeSort`.

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
  getSince:       (since: string, params: TicketFilterParams, signal?: AbortSignal): Promise<{ count: number }>
  getActivity:    (id: string, signal?: AbortSignal): Promise<ActivityEntry[]>
}

export const userApi = {
  search: (q: string, orgId?: string, signal?: AbortSignal): Promise<UserRef[]>
}
```

Type aliases:
```ts
type TicketListParams   = TicketFilters & { sort: string; page: number; pageSize: number; groupBy?: string }
type TicketFilterParams = TicketFilters & { sort: string; groupBy?: string }
```

**`ListResponse` shape** (explicit — `serverTime` required by poll seeding):
```ts
interface ListResponse {
  rows: TicketRow[];
  total: number;
  page: number;
  pageSize: number;
  serverTime: string;  // ISO — used as poll cursor seed
}
```

**`AssignPayload`:**
```ts
interface AssignPayload {
  add: string[];     // user IDs to add
  remove: string[];  // user IDs to remove
}
```

**`BulkResult` partial failure:**
```ts
interface BulkResult {
  succeeded: string[];
  failed: { id: string; reason: string }[];
}
// UI: single aggregated toast "X of Y updated, Z failed" — not one toast per failure
```

**Param normalization:** Before passing to `ticketApi.getList`, strip empty arrays so the HTTP request matches what `buildListKey` would produce:
```ts
// lib/ticketParams.ts
function normalizeParams<T extends Record<string, unknown>>(params: T): T {
  return Object.fromEntries(
    Object.entries(params).filter(([, v]) =>
      v !== undefined && !(Array.isArray(v) && v.length === 0)
    )
  ) as T;
}
// Usage: ticketApi.getList(normalizeParams(params), signal)
```

---

## 4. TanStack Query Hooks

### Query Key Normalization

```ts
// lib/ticketParams.ts
function buildListKey(params: TicketListParams | TicketFilterParams): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(params)
      .filter(([, v]) => v !== undefined && !(Array.isArray(v) && v.length === 0))
      .sort(([a], [b]) => a.localeCompare(b))
  );
}
```

### Query Hooks

```ts
// Primary list — NO refetchInterval. Refetch triggered by banner click only.
// staleTime dedupe window focus refetch when poll just ran.
useTicketListQuery(params: TicketListParams)
  queryKey:        ['tickets', 'list', buildListKey(params)]
  queryFn:         ({ signal }) => ticketApi.getList(normalizeParams(params), signal)
  staleTime:       25_000
  placeholderData: keepPreviousData
  retry:           1

// Views — long stale + gcTime prevents loading flash on tab return
useViewsQuery()
  queryKey:  ['tickets', 'views']
  queryFn:   ({ signal }) => ticketApi.getViews(signal)
  staleTime: 5 * 60 * 1000
  gcTime:    30 * 60 * 1000

// Detail drawer — 404 = no retry; consumer handles close + toast
useTicketDetailQuery(ticketId: string | null)
  queryKey: ['tickets', 'detail', ticketId]
  queryFn:  ({ signal }) => ticketApi.getById(ticketId!, signal)
  enabled:  !!ticketId
  retry:    (failureCount, error) => error.status !== 404 && failureCount < 2

// Activity tab inside drawer — invalidated by status/assignee mutations
useTicketActivityQuery(ticketId: string | null)
  queryKey: ['tickets', 'activity', ticketId]
  queryFn:  ({ signal }) => ticketApi.getActivity(ticketId!, signal)
  enabled:  !!ticketId

// Poll — 30s interval drives banner count ONLY.
// Cursor via ref (not in key). Enabled only after sinceRef seeded from list.
// sinceRef reset dep uses JSON.stringify to prevent object-identity churn.
useNewTicketsPoll(filterParams: TicketFilterParams)
  queryKey:                    ['tickets', 'since', buildListKey(filterParams)]
  queryFn:                     ({ signal }) => ticketApi.getSince(sinceRef.current, filterParams, signal)
  enabled:                     !!sinceRef.current
  refetchInterval:             30_000
  refetchIntervalInBackground: false
  retry:                       0

  // Inside hook:
  // 1. Seed sinceRef from list query on first successful fetch:
  //    const listData = queryClient.getQueryData(['tickets','list', buildListKey(filterParams)]);
  //    if (listData?.serverTime && !sinceRef.current) sinceRef.current = listData.serverTime;
  // 2. Reset on filter change (stable dep):
  //    const filterKey = JSON.stringify(buildListKey(filterParams));
  //    useEffect(() => { sinceRef.current = ''; }, [filterKey]);

// Assignee / invitee picker — callers must pass debounced q (300ms)
useUserSearchQuery(q: string, orgId?: string)
  queryKey:  ['users', 'search', q, orgId]
  queryFn:   ({ signal }) => userApi.search(q, orgId, signal)
  enabled:   q.length >= 2
  staleTime: 60_000
  gcTime:    60_000   // abandoned typing entries die fast
```

### Mutation Hooks

**Optimistic strategy:** `queryClient.setQueriesData` / `queryClient.getQueriesData` for all mutations. Cache is single source of truth. `useOptimistic` not used.

**Filter/sort UI lock during mutations:** Any component rendering filter chips, sort headers, or view tabs must read `anyMutationPending` and disable interaction while true. This prevents the `prevList` snapshot becoming stale mid-mutation.

```ts
// Shared helper — consume in FilterBar, ViewTabs, SortHeaders
const anyMutationPending = useMutationState({
  filters: { status: 'pending' },
  select: (m) => m.status === 'pending',
}).some(Boolean);
```

**No abort on mutations:** Mutations are fire-and-forget. Navigation during in-flight mutation is accepted — server will complete, optimistic state reconciles on next refetch. Toast on unmounted component handled by global toast manager (not component-local).

**Single-row mutations** fan out across ALL cached list pages + patch detail cache:

```ts
// Pattern for useStatusMutation, usePriorityMutation, useAssignMutation, useUpdateTicketMutation
onMutate: async ({ id, ...patch }) => {
  await queryClient.cancelQueries({ queryKey: ['tickets', 'list'] });
  await queryClient.cancelQueries({ queryKey: ['tickets', 'detail', id] });

  // Snapshot ALL cached list pages (not just active)
  const prevPages  = queryClient.getQueriesData<ListResponse>({ queryKey: ['tickets', 'list'] });
  const prevDetail = queryClient.getQueryData<TicketDetail>(['tickets', 'detail', id]);

  // Patch across all cached pages
  queryClient.setQueriesData<ListResponse>(
    { queryKey: ['tickets', 'list'] },
    (old) => old ? { ...old, rows: old.rows.map(r => r.id === id ? { ...r, ...patch } : r) } : old
  );
  queryClient.setQueryData<TicketDetail>(
    ['tickets', 'detail', id],
    (old) => old ? { ...old, ...patch } : old
  );
  return { prevPages, prevDetail };
},
onError: (_err, { id }, ctx) => {
  ctx.prevPages.forEach(([key, data]) => queryClient.setQueryData(key, data));
  queryClient.setQueryData(['tickets', 'detail', id], ctx.prevDetail);
},
onSettled: (_data, _err, { id }) => {
  queryClient.invalidateQueries({ queryKey: ['tickets', 'list'], refetchType: 'active' });
  queryClient.invalidateQueries({ queryKey: ['tickets', 'detail', id] });
  queryClient.invalidateQueries({ queryKey: ['tickets', 'activity', id] });
}
```

**Bulk mutations** — invalidate only (selection may span pages):

```ts
onMutate: async () => {
  await queryClient.cancelQueries({ queryKey: ['tickets', 'list'] });
},
onSettled: () => {
  queryClient.invalidateQueries({ queryKey: ['tickets', 'list'], refetchType: 'active' });
},
// Partial failure toast: "X of Y updated, Z failed" — single aggregated toast from BulkResult
```

**Full mutation list:**
```ts
useStatusMutation()          → ticketApi.updateStatus()    // single-row + activity invalidate
usePriorityMutation()        → ticketApi.updatePriority()  // single-row + activity invalidate
useAssignMutation()          → ticketApi.assign()           // single-row + activity invalidate
useUpdateTicketMutation()    → ticketApi.update()           // single-row + activity invalidate
useBulkUpdateMutation()      → ticketApi.bulkUpdate()       // bulk pattern
useBulkDeleteMutation()      → ticketApi.bulkDelete()       // bulk pattern
useCreateTicketMutation()    → ticketApi.create()           // invalidates ['tickets','list',*]
useDeleteTicketMutation()    → ticketApi.delete()           // invalidates ['tickets','list',*]
useSaveViewMutation()        → ticketApi.createView()       // invalidates views + setView(newView.id)
useUpdateViewMutation()      → ticketApi.updateView()       // invalidates views
useDeleteViewMutation()      → ticketApi.deleteView()       // invalidates views + clearView if active
```

**`useSaveViewMutation` onSuccess:**
```ts
onSuccess: (newView) => {
  queryClient.invalidateQueries({ queryKey: ['tickets', 'views'] });
  setView(newView.id);  // auto-activate created view
}
```

**`useDeleteViewMutation` onSuccess:**
```ts
onSuccess: (_data, deletedId) => {
  queryClient.invalidateQueries({ queryKey: ['tickets', 'views'] });
  if (viewId === deletedId) clearView();  // see §6
}
```

---

## 5. `useTicketDraft` — Standalone Hook

No store involvement. Key: `ticket-draft`. `load()` called on every create modal mount.

```ts
const DRAFT_VERSION = 1;

function useTicketDraft() {
  const save = (draft: NewTicketDraft) =>
    localStorage.setItem('ticket-draft', JSON.stringify({ v: DRAFT_VERSION, ...draft }));

  const load = (): NewTicketDraft | null => {
    try {
      const raw = localStorage.getItem('ticket-draft');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed?.v !== DRAFT_VERSION) { localStorage.removeItem('ticket-draft'); return null; }
      const { v: _, ...draft } = parsed;
      return draft as NewTicketDraft;
    } catch {
      localStorage.removeItem('ticket-draft');  // corrupt — clear
      return null;
    }
  };

  const clear = () => localStorage.removeItem('ticket-draft');
  return { save, load, clear };
}
```

Multi-tab: last-write-wins (accepted).

---

## 6. `useTicketsPageActions` and `useTicketsPageData`

Split into two hooks:
- **`useTicketsPageActions`** — URL setters + store actions. Cheap, any component may import. No query subscriptions. All functions `useCallback`-wrapped.
- **`useTicketsPageData`** — root `<TicketsPage>` only. Children call primitive query hooks directly.

### `useTicketsPageActions`

```ts
function useTicketsPageActions() {
  const navigate = useNavigate();
  const [, setSearchParams] = useSearchParams();

  const setFilters = useCallback((f: Partial<TicketFilters>) =>
    setSearchParams(p => mergeFilters(new URLSearchParams(p), f)), [setSearchParams]);

  const setSort = useCallback((s: TicketSort[]) =>
    setSearchParams(p => mergeSort(new URLSearchParams(p), s)), [setSearchParams]);

  const setPage = useCallback((n: number) =>
    setSearchParams(p => { const next = new URLSearchParams(p); next.set('page', String(n)); return next; }),
    [setSearchParams]);

  // setView accepts null to clear the param
  const setView = useCallback((id: string | null) =>
    setSearchParams(p => {
      const next = new URLSearchParams(p);
      id ? next.set('view', id) : next.delete('view');
      return next;
    }), [setSearchParams]);

  const clearView = useCallback(() => setView(null), [setView]);

  const openModal = useCallback(() =>
    setSearchParams(p => { const next = new URLSearchParams(p); next.set('modal', 'create'); return next; }),
    [setSearchParams]);

  const closeModal = useCallback(() =>
    setSearchParams(p => { const next = new URLSearchParams(p); next.delete('modal'); return next; }),
    [setSearchParams]);

  const openDrawer  = useCallback((id: string) => navigate(`/tickets/${id}`), [navigate]);
  const closeDrawer = useCallback(() => navigate('/tickets'), [navigate]);

  const setSelectedRows   = useTicketStore(s => s.setSelectedRows);
  const toggleRowSelected = useTicketStore(s => s.toggleRowSelected);
  const clearSelection    = useTicketStore(s => s.clearSelection);
  const setDensity        = useTicketStore(s => s.setDensity);

  return {
    setFilters, setSort, setPage, setView, clearView,
    openModal, closeModal, openDrawer, closeDrawer,
    setSelectedRows, toggleRowSelected, clearSelection, setDensity,
  };
}
```

### `useTicketsPageData`

All derived values memoized — prevents new object refs from churning query keys and effect deps.

```ts
function useTicketsPageData() {
  const { ticketId } = useParams();
  const [searchParams] = useSearchParams();
  const { closeDrawer } = useTicketsPageActions();

  // Memoize all URL-derived values on raw string (stable dep)
  const rawParams = searchParams.toString();

  const filters = useMemo(() => parseFilters(searchParams), [rawParams]);
  const sort    = useMemo(() => parseSort(searchParams),    [rawParams]);
  const page    = useMemo(() => Number(searchParams.get('page') ?? 1), [rawParams]);
  const viewId  = useMemo(() => searchParams.get('view') ?? null,      [rawParams]);
  const modalOpen = useMemo(() => searchParams.get('modal') === 'create', [rawParams]);

  const listParams   = useMemo(() =>
    ({ ...filters, sort: serializeSort(sort), page, pageSize: 25 }), [filters, sort, page]);
  const filterParams = useMemo(() =>
    ({ ...filters, sort: serializeSort(sort) }), [filters, sort]);

  // Store — per-field selectors only
  const selectedRowIds = useTicketStore(s => s.selectedRowIds);
  const density        = useTicketStore(s => s.density);
  const clearSelection = useTicketStore(s => s.clearSelection);

  // Selection auto-clear: filters or viewId changed only
  const filtersHash = JSON.stringify(buildListKey(filterParams));
  useEffect(() => { clearSelection(); }, [filtersHash, viewId]);

  const list   = useTicketListQuery(listParams);
  const views  = useViewsQuery();
  const banner = useNewTicketsPoll(filterParams);
  const detail = useTicketDetailQuery(ticketId ?? null);

  // Drawer 404 — handled-ref prevents re-fire
  const handled404Ref = useRef<string | null>(null);
  useEffect(() => {
    if (detail.isError && detail.error?.status === 404 && ticketId !== handled404Ref.current) {
      handled404Ref.current = ticketId ?? null;
      closeDrawer();
      toast.error('Ticket not found or has been deleted.');
    }
    if (!ticketId) handled404Ref.current = null;
  }, [detail.isError, detail.error, ticketId]);

  return {
    data: {
      rows:   list.data?.rows ?? [],
      total:  list.data?.total ?? 0,
      views:  views.data ?? [],
      detail: detail.data ?? null,
    },
    status: { loading: list.isPending, error: list.error },
    url:    { filters, sort, page, viewId, modalOpen, drawerTicketId: ticketId ?? null },
    ui:     { selectedRowIds, density, newTicketsBannerCount: banner.data?.count ?? 0 },
  };
}
```

---

## 7. `lib/ticketParams.ts` — URL Helpers

```ts
// Clone-first — never mutate URLSearchParams in place
function mergeFilters(params: URLSearchParams, patch: Partial<TicketFilters>): URLSearchParams
function mergeSort(params: URLSearchParams, sort: TicketSort[]): URLSearchParams
function parseFilters(params: URLSearchParams): TicketFilters   // returns [] for unset arrays
function parseSort(params: URLSearchParams): TicketSort[]
function serializeSort(sort: TicketSort[]): string              // 'updatedAt:desc,priority:asc'
function buildListKey(params: TicketListParams | TicketFilterParams): Record<string, unknown>
function normalizeParams<T extends Record<string, unknown>>(params: T): T
```

**`buildListKey`:** sorts keys alphabetically, drops `undefined` and empty arrays, normalizes arrays to sorted comma-separated strings. Used for: query keys, filter hash for selection-clear dep, sinceRef reset dep.

**Sort serialization:** comma-separated `field:dir` pairs. `parseSort` ↔ `serializeSort` are strict inverses. Multi-sort supported from day one.

**Filter URL serialization:** arrays = comma-separated. Omit undefined fields entirely. `parseFilters` returns `[]` (never `undefined`) for unset array fields.

**`normalizeParams`:** strips `undefined` and empty arrays before passing to `ticketApi.getList` — aligns HTTP request with cache key shape.

---

## 8. Decision Log

| Decision | Rule / Rationale |
|---|---|
| URL vs Zustand | URL if shareable/survives refresh; Zustand if ephemeral-only |
| `createModalOpen` | URL (`?modal=create`) — shareable |
| `drawerTicketId` | URL route param — shareable, direct-link |
| `density` | Zustand + persist (partialize, density only) — preference, not nav state |
| `selectedRowIds` | Zustand — ephemeral; never persisted; cleared on filter/view change only |
| `newTicketsBannerCount` | Derived from `useNewTicketsPoll` — not stored |
| `refetchInterval` on list | Removed — list refetch is banner-driven only |
| Poll interval | `useNewTicketsPoll` drives banner count every 30s |
| Optimistic strategy | `setQueriesData` across all cached pages — no `useOptimistic` |
| Optimistic fan-out | `getQueriesData` / `setQueriesData` — patches all cached list pages, not just active |
| Activity invalidation | `onSettled` of status/priority/assign/update mutations invalidates `['tickets','activity',id]` |
| Filter UI during mutation | Disabled via `useMutationState` — prevents prevList snapshot going stale |
| Mutation abort | Not implemented — fire-and-forget; toast via global manager |
| Poll cursor | Ref (not key) — prevents cache bloat and cadence reset |
| Poll seeding | `sinceRef` seeded from `list.data.serverTime`; `enabled: !!sinceRef.current` |
| Poll enabled gate | Prevents `getSince('')` on initial mount before list resolves |
| Poll reset dep | `JSON.stringify(buildListKey(filterParams))` — stable string dep |
| Poll params | `TicketFilterParams` (no page/pageSize) — filter-scoped |
| Query key normalization | `buildListKey()` — canonical sorted key, prevents refetch storms |
| Param normalization | `normalizeParams()` before API call — aligns request with key |
| `staleTime` on list | `25_000` — dedupe window focus refetch when poll just ran |
| `gcTime` on views | `30 * 60 * 1000` — prevents loading flash |
| `gcTime` on user search | `60_000` — abandoned typing entries die fast |
| URLSearchParams mutation | Always `new URLSearchParams(p)` before mutate — never mutate in place |
| `setView` signature | `string \| null` — null deletes param; `clearView()` = `setView(null)` |
| `useTicketsPageData` memoization | `useMemo` on all URL-derived values — prevents ref churn |
| `useTicketsPageData` | Root `<TicketsPage>` only; children call primitive hooks |
| `useTicketsPageActions` | Any component — no query subscriptions, all `useCallback` |
| Bulk mutations | Split: `useBulkUpdateMutation` + `useBulkDeleteMutation` |
| Bulk failure toast | Aggregated: "X of Y updated, Z failed" — not per-failure |
| View delete cleanup | `clearView()` if deleted view was active |
| View create activation | `setView(newView.id)` in `useSaveViewMutation` `onSuccess` |
| Drawer 404 | `handled404Ref` prevents re-fire; `closeDrawer()` + toast |
| Draft schema | `version` field + try/catch + clear-on-failure in `load()` |
| Selection pruning | By-ID only; ghost IDs tolerated by server bulk endpoint |
| filtersHash dep | `JSON.stringify(buildListKey(filterParams))` — canonical |
| `AssignPayload` | `{ add: string[], remove: string[] }` — explicit delta |
| `BulkResult` | `{ succeeded, failed }` — partial failure handled by aggregated toast |
| Sort multi-sort | `TicketSort[]` everywhere; serialized as `'field:dir,field:dir'` |
| Persist versioning | Not needed now — `partialize` scope small enough to skip migration |
