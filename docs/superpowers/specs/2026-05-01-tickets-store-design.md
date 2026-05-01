# Tickets Page — State Layer Design

**Date:** 2026-05-01  
**Stack:** React 19, TanStack Query v5, Zustand, React Router v7, Axios

---

## 1. Layer Boundaries

```
URL (useSearchParams / React Router v7)
  viewId      → ?view=<id>
  filters     → ?status=&priority=&category=&assignee=&q=&stale=
  sort        → ?sort=updatedAt:desc
  page        → ?page=1
  drawerTicketId → /tickets/:ticketId  (route param)
  createModal → ?modal=create

useTicketStore (Zustand — UI-only, no server state)
  selectedRowIds   → row selection for bulk actions
  density          → compact | comfortable (persisted via Zustand persist middleware)
  Rule: Zustand owns state that is ephemeral and not shareable.
  Rule: URL owns state that should survive refresh or be copy-pasteable.

TanStack Query (server state)
  useTicketListQuery      → GET /tickets
  useViewsQuery           → GET /tickets/views
  useTicketDetailQuery    → GET /tickets/:id
  useTicketActivityQuery  → GET /tickets/:id/activity
  useNewTicketsPoll       → GET /tickets/since
  useUserSearchQuery      → GET /users/search (assignee picker)
  Mutations: see §4

ticketApi (axios — stateless HTTP layer)
  No state. Typed request/response. Accepts AbortSignal.

userApi (axios — stateless)
  search(q, orgId) → UserRef[]

useTicketsPageRoot (facade — root page component only)
  Composes all 4 layers. Must NOT be imported by child components.
  Children call primitive hooks directly.

lib/ticketParams.ts
  parseFilters, parseSort, mergeFilters, mergeSort — pure URL helpers
```

---

## 2. Zustand Store

Owns only ephemeral UI state with no server-state leakage.

```ts
interface TicketUIState {
  selectedRowIds: string[];
  density: 'compact' | 'comfortable';   // persisted: key 'ticket-ui-density'

  setSelectedRows: (ids: string[]) => void;
  toggleRowSelected: (id: string) => void;
  clearSelection: () => void;
  setDensity: (d: 'compact' | 'comfortable') => void;
}
```

**Removed from original design:**
- `drawerTicketId` → URL route param `/tickets/:ticketId`
- `createModalOpen` → URL `?modal=create`
- `newTicketsBannerCount` → derived from `useNewTicketsPoll().data?.count`
- `filters`, `sort`, `page`, `activeViewId` → `useSearchParams`
- `rows`, `total`, `loading`, `error`, `views` → TanStack Query
- `draft` → `useTicketDraft` (standalone localStorage hook)
- `optimisticUpdate` → `queryClient.setQueryData` in mutation `onMutate`

**Selection auto-clear rule:** When `filters` or `viewId` URL params change, `clearSelection()` is called in a `useEffect` inside `useTicketsPageRoot`.

---

## 3. `ticketApi` — Axios Object

Thin, stateless, fully typed. All methods accept an optional `AbortSignal` to prevent stale responses from landing after filter changes (TanStack Query forwards `signal` automatically via `queryFn` context).

```ts
export const ticketApi = {
  getList:       (params: TicketListParams, signal?: AbortSignal): Promise<ListResponse>
  getById:       (id: string, signal?: AbortSignal): Promise<TicketDetail>
  getViews:      (signal?: AbortSignal): Promise<View[]>
  createView:    (data: CreateViewPayload): Promise<View>
  updateView:    (id: string, data: UpdateViewPayload): Promise<View>
  deleteView:    (id: string): Promise<void>
  create:        (data: NewTicketDraft): Promise<TicketDetail>
  update:        (id: string, patch: UpdateTicketPayload): Promise<TicketDetail>
  delete:        (id: string): Promise<void>
  updateStatus:  (id: string, status: Status): Promise<TicketDetail>
  updatePriority:(id: string, priority: Priority): Promise<TicketDetail>
  assign:        (id: string, payload: AssignPayload): Promise<TicketDetail>
  bulkUpdate:    (payload: BulkUpdatePayload): Promise<BulkResult>
  bulkDelete:    (payload: BulkDeletePayload): Promise<void>
  getSince:      (since: string, params: TicketListParams, signal?: AbortSignal): Promise<{ count: number }>
  getActivity:   (id: string, signal?: AbortSignal): Promise<ActivityEntry[]>
}

export const userApi = {
  search: (q: string, orgId?: string, signal?: AbortSignal): Promise<UserRef[]>
}
```

`TicketListParams = TicketFilters & { sort: string; page: number; pageSize: number; groupBy?: string }`

---

## 4. TanStack Query Hooks

### Query Hooks

```ts
// Primary list — 30s interval, stops when tab hidden
useTicketListQuery(params: TicketListParams)
  queryKey:                   ['tickets', 'list', params]
  queryFn:                    ({ signal }) => ticketApi.getList(params, signal)
  refetchInterval:            30_000
  refetchIntervalInBackground: false
  placeholderData:            keepPreviousData
  retry:                      1   // not 3 — polling endpoint, don't thrash on failure

// Views — rarely changes
useViewsQuery()
  queryKey:  ['tickets', 'views']
  queryFn:   ({ signal }) => ticketApi.getViews(signal)
  staleTime: 5 * 60 * 1000

// Detail drawer — only fetches when id present
useTicketDetailQuery(ticketId: string | null)
  queryKey: ['tickets', 'detail', ticketId]
  queryFn:  ({ signal }) => ticketApi.getById(ticketId!, signal)
  enabled:  !!ticketId

// Activity tab inside drawer
useTicketActivityQuery(ticketId: string | null)
  queryKey: ['tickets', 'activity', ticketId]
  queryFn:  ({ signal }) => ticketApi.getActivity(ticketId!, signal)
  enabled:  !!ticketId

// Poll — cursor NOT in query key (prevents cache bloat + cadence reset)
// `since` cursor is passed via closure/ref, not as a key segment
useNewTicketsPoll(params: TicketListParams)
  queryKey:                    ['tickets', 'since', params]
  queryFn:                     ({ signal }) => ticketApi.getSince(sinceRef.current, params, signal)
  refetchInterval:             30_000
  refetchIntervalInBackground: false
  retry:                       0
  // sinceRef.current is updated from list.data.serverTime without re-keying

// Assignee / invitee picker — debounced, only fires when q.length >= 2
useUserSearchQuery(q: string, orgId?: string)
  queryKey:  ['users', 'search', q, orgId]
  queryFn:   ({ signal }) => userApi.search(q, orgId, signal)
  enabled:   q.length >= 2
  staleTime: 60_000
```

### Mutation Hooks

**Strategy:** Single-row inline edits use `useOptimistic` (React 19, component-scoped). Bulk and cross-surface mutations use `queryClient.setQueryData` in `onMutate` (cache-level, shared across all consumers).

```ts
// Single-row inline — useOptimistic in component
useStatusMutation()     → ticketApi.updateStatus()
usePriorityMutation()   → ticketApi.updatePriority()
useAssignMutation()     → ticketApi.assign()
useUpdateTicketMutation() → ticketApi.update()   // subject, description, category

// Cross-surface / bulk — queryClient.setQueryData in onMutate
useBulkUpdateMutation()  → ticketApi.bulkUpdate()
useBulkDeleteMutation()  → ticketApi.bulkDelete()

// No optimistic needed (create adds new row, delete confirmed by refetch)
useCreateTicketMutation() → ticketApi.create()   // invalidates ['tickets','list',*] on settle
useDeleteTicketMutation() → ticketApi.delete()   // invalidates on settle

// View management
useSaveViewMutation()     → ticketApi.createView()
useUpdateViewMutation()   → ticketApi.updateView()
useDeleteViewMutation()   → ticketApi.deleteView()
```

**Bulk `onMutate` pattern:**
```ts
onMutate: async ({ ids, patch }) => {
  await queryClient.cancelQueries({ queryKey: ['tickets', 'list'] });
  const prev = queryClient.getQueryData(['tickets', 'list', params]);
  queryClient.setQueryData(['tickets', 'list', params], (old) => ({
    ...old,
    rows: old.rows.map(r => ids.includes(r.id) ? { ...r, ...patch } : r),
  }));
  return { prev };
},
onError: (_err, _vars, ctx) => {
  queryClient.setQueryData(['tickets', 'list', params], ctx.prev);
},
onSettled: () => {
  queryClient.invalidateQueries({ queryKey: ['tickets', 'list'] });
}
```

**Refetch pause rule:** `refetchInterval` on `useTicketListQuery` is set to `false` when any single-row mutation is `isPending`, to prevent an in-flight list refetch from clobbering an optimistic update.

---

## 5. `useTicketDraft` — Standalone Hook

No store involvement. Key: `ticket-draft` (single new ticket, not per-ticket).

```ts
function useTicketDraft() {
  const save   = (draft: NewTicketDraft) => localStorage.setItem('ticket-draft', JSON.stringify(draft));
  const load   = (): NewTicketDraft | null => JSON.parse(localStorage.getItem('ticket-draft') ?? 'null');
  const clear  = () => localStorage.removeItem('ticket-draft');
  return { save, load, clear };
}
```

Multi-tab collision is accepted: last-write-wins. Not worth a `storage` event listener given the draft is a create-only flow.

---

## 6. `useTicketsPageRoot` — Facade Hook

**Import rule:** Only `<TicketsPage>` (the route component) may call this. All child components (`<TicketTable>`, `<TicketDrawer>`, `<BulkActionBar>`, `<FiltersPanel>`) call primitive hooks directly to limit re-render blast radius.

```ts
function useTicketsPageRoot() {
  const navigate = useNavigate();
  const { ticketId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  // Parse URL
  const filters  = parseFilters(searchParams);
  const sort     = parseSort(searchParams);
  const page     = Number(searchParams.get('page') ?? 1);
  const viewId   = searchParams.get('view') ?? null;
  const modalOpen = searchParams.get('modal') === 'create';

  // Store
  const { selectedRowIds, density, clearSelection, ...storeActions } = useTicketStore();

  // Auto-clear selection on filter/view change
  const filterKey = searchParams.toString();
  useEffect(() => { clearSelection(); }, [filterKey]);

  // Queries (pass down to children as needed, or children call directly)
  const list   = useTicketListQuery({ ...filters, sort, page, pageSize: 25 });
  const views  = useViewsQuery();
  const banner = useNewTicketsPoll({ ...filters, sort, page, pageSize: 25 });

  // URL setters
  const setFilters  = (f: Partial<TicketFilters>) =>
    setSearchParams(p => mergeFilters(p, f));
  const setSort     = (s: TicketSort[]) =>
    setSearchParams(p => mergeSort(p, s));
  const setPage     = (n: number) =>
    setSearchParams(p => { p.set('page', String(n)); return p; });
  const setView     = (id: string) =>
    setSearchParams(p => { p.set('view', id); return p; });
  const openModal   = () =>
    setSearchParams(p => { p.set('modal', 'create'); return p; });
  const closeModal  = () =>
    setSearchParams(p => { p.delete('modal'); return p; });
  const openDrawer  = (id: string) => navigate(`/tickets/${id}`);
  const closeDrawer = () => navigate('/tickets');

  return {
    data:      { rows: list.data?.rows ?? [], total: list.data?.total ?? 0, views: views.data ?? [] },
    status:    { loading: list.isPending, error: list.error },
    url:       { filters, sort, page, viewId, modalOpen, drawerTicketId: ticketId ?? null },
    ui:        { selectedRowIds, density, newTicketsBannerCount: banner.data?.count ?? 0 },
    actions:   { setFilters, setSort, setPage, setView, openModal, closeModal, openDrawer, closeDrawer, ...storeActions },
  };
}
```

Return shape is grouped into `data / status / url / ui / actions` — avoids 30-field flat object.

---

## 7. `lib/ticketParams.ts` — URL Helpers

```ts
// Merge semantics: undefined = leave unchanged, null = delete key
function mergeFilters(params: URLSearchParams, patch: Partial<TicketFilters>): URLSearchParams
function mergeSort(params: URLSearchParams, sort: TicketSort[]): URLSearchParams
function parseFilters(params: URLSearchParams): TicketFilters
function parseSort(params: URLSearchParams): TicketSort[]
```

Filter values in URL are comma-separated strings. `undefined` fields are omitted from URL entirely (not `undefined` vs missing — always one form). `parseFilters` never returns `undefined` for array fields — returns empty array.

---

## 8. Decision Log

| Decision | Rule |
|---|---|
| URL vs Zustand | URL if shareable/survives refresh; Zustand if ephemeral-only |
| `createModalOpen` | URL (`?modal=create`) — shareable |
| `drawerTicketId` | URL route param — shareable |
| `density` | Zustand + persist — preference, not navigation state |
| `selectedRowIds` | Zustand — ephemeral; cleared on filter/view change |
| `newTicketsBannerCount` | Derived from `useNewTicketsPoll` — not stored |
| Optimistic strategy | `useOptimistic` for single-row inline; `setQueryData` for bulk/cross-surface |
| Poll cursor (`since`) | Ref, not query key — prevents cache bloat and cadence reset |
| `useTicketsPageRoot` | Root component only; children call primitive hooks |
| Bulk mutations | Split: `useBulkUpdateMutation` + `useBulkDeleteMutation` |
| Refetch during mutation | Pause `refetchInterval` while any single-row mutation `isPending` |
