# Tickets Page — Implementation Audit

> Snapshot as of 2026-05-04. Use as a reference for what exists, what's wired, and what's broken/missing.

---

## File Map

| Layer | File | Role |
|-------|------|------|
| Page component | `apps/web/src/components/Tickets.tsx` | Single 769-line component; renders everything |
| Page data hook | `apps/web/src/hooks/useTicketsPageData.ts` | Aggregates URL state + all queries into one object |
| Page actions hook | `apps/web/src/hooks/useTicketsPageActions.ts` | URL mutations (navigate/setSearchParams) + Zustand store wrappers |
| Query hooks | `apps/web/src/hooks/useTicketQueries.ts` | React Query wrappers: list, views, detail, poll, activity, user search |
| Mutation hooks | `apps/web/src/hooks/useTicketMutations.ts` | Optimistic mutations: status, priority, assign, update, bulk, create, delete, view CRUD |
| API client | `apps/web/src/api/ticketApi.ts` | Typed wrappers over `api` (axios instance) |
| Types / URL utils | `apps/web/src/lib/ticketParams.ts` | Re-exports Zod schemas from `@shared/schema/tickets`; URL parse/serialize helpers |
| UI store | `apps/web/src/stores/useTicketStore.ts` | Zustand: `selectedRowIds[]`, `density` (persisted) |
| Draft hook | `apps/web/src/hooks/useTicketDraft.ts` | localStorage draft save/load/clear with version key |
| API router | `apps/api/src/routes/tickets.ts` | Express router wiring |
| List controller | `apps/api/src/controllers/tickets/list.ts` | `GET /tickets` |
| Detail controller | `apps/api/src/controllers/tickets/detail.ts` | `GET /tickets/:id` |
| Mutations controller | `apps/api/src/controllers/tickets/mutations.ts` | create / update / delete / bulk / assign / status / priority |
| Views controller | `apps/api/src/controllers/tickets/views.ts` | CRUD for `TicketView` table |
| DB helpers | `apps/api/src/controllers/tickets/data.ts` | All Prisma calls; ticket → DTO transforms |
| Query parser | `apps/api/src/controllers/tickets/utils.ts` | `parseTicketListParams` etc. |

---

## URL Schema

```
/tickets                          — list, no drawer
/tickets/:ticketId                — list + drawer open for :ticketId
/tickets/:ticketId/full           — full-page (ROUTE NOT YET REGISTERED — see gaps)

?view=<id>                        — active view id (null = "All tickets")
?status=OPEN,IN_PROGRESS          — comma-joined enums
?priority=HIGH,MEDIUM
?category=BUG,FEATURE_REQUEST
?assignee=<id1>,<id2>
?requester=<id>
?org=<id>
?createdFrom=ISO&createdTo=ISO
?q=search+term
?stale=1
?sort=updatedAt:desc,priority:asc — multi-sort (comma-joined)
?page=1
?modal=create                     — create modal open
```

URL is the source of truth for all filter/sort/view/modal/drawer state. `useTicketsPageData` parses it on every render via `useSearchParams + useParams`.

---

## Data Flow

```
URL (searchParams + :ticketId)
  └─ useTicketsPageData
       ├─ parseFilters()       → TicketFilters
       ├─ parseSort()          → TicketSort[]
       ├─ useTicketListQuery   → GET /tickets?...   (staleTime 25s, placeholderData = prev)
       ├─ useViewsQuery        → GET /tickets/views (staleTime 5min)
       ├─ useTicketDetailQuery → GET /tickets/:id   (enabled only when ticketId present)
       └─ useNewTicketsPoll    → GET /tickets/since?ts=... (refetchInterval 30s, tab-visible only)
            └─ returns { count } → newTicketsBannerCount
```

Mutations all use the same optimistic pattern:
1. `cancelQueries` on affected keys
2. `setQueriesData` / `setQueryData` with patch
3. `onError` → rollback via saved snapshots
4. `onSettled` → `invalidateQueries` to sync

---

## Backend Query Pipeline

`GET /tickets` → `parseTicketListParams` (Zod) → `getTicketList(db, params)`

`buildTicketWhere(filters)` translates `TicketFilters` into a `Prisma.TicketWhereInput`. Supported:
- `status`, `priority`, `category` → `{ in: [...] }`
- `orgIds` → `{ orgId: { in: [...] } }`
- `assigneeIds` / `requesterIds` → `participants.some` subquery
- `createdFrom` / `createdTo` → `createdAt` range
- `q` → case-insensitive `OR` on `subject` + `description`
- `stale` → `createdAt < (now - 3 days)` AND status in open set

`buildOrderBy(sort)` parses `"field:dir"` string → Prisma `orderBy`. Only supports single-sort at DB level (first item from the comma-joined string).

**stale threshold**: hardcoded `3 * 24 * 60 * 60 * 1000` ms (3 days). Spec says 7 days. **Mismatch.**

Every query `include`s `org`, `participants.user`, and `activities.actor`. This means a list of 25 tickets fires N+0 queries but loads full relations — acceptable for now.

---

## Frontend Rendering

### Virtual scroll
`Tickets.tsx` implements a manual virtual list:
- Tracks `virtualScrollTop` + `viewportHeight` via `ResizeObserver`
- Computes `startIndex`/`endIndex` with `OVERSCAN = 8`
- Renders only the visible window into absolute-positioned `<tr>` rows via `transform: translateY(${top}px)`
- `flatRows` is a flattened array of `{ kind: 'row' | 'group', ... }` — group headers slot into the same virtual space

Row heights: `compact = 36px`, `comfortable = 56px` (description preview only in comfortable).

### Sort
Sorting happens **client-side** after the list fetch (`sortedRows` useMemo). The URL sort is also sent to the server, so server returns pre-sorted data — then the client re-sorts. These should agree but redundant.

Multi-sort: shift-click on a column header adds a secondary sort. UI shows `▲/▼` on primary and `²` superscript on secondary.

### Views
`DEFAULT_VIEWS` is hardcoded in the component (4 items). Server-saved views are fetched and merged — deduped by name. Built-in views by role are **not fetched from server**; they're the same hardcoded list for all roles. **Role-differentiated built-in views from the spec are not implemented.**

The `tabIndex` state for the animated underline is tracked by array index, which breaks when server views are loaded and the array grows. **Bug: underline jumps after views load.**

### Drawer
- Opens by navigating to `/tickets/:id`
- `useTicketDetailQuery` fires on `:ticketId` param
- 404 auto-closes drawer via `useEffect` watching `detail.isError`
- `j/k` keyboard nav between rows in current sorted list
- `e` key → focus description textarea
- `s` key → cycle status forward

Inline edits: `editSubject` and `editDescription` boolean state. Save on `blur` or `Enter`. No optimistic update on subject/description — fires `useUpdateTicketMutation` which has full optimistic patch.

**Bug**: The status button in the drawer hardcodes `status: "REVIEW"` regardless of current status:
```tsx
<button onClick={() => statusMutation.mutate({ id: data.detail.id, status: "REVIEW" })}>
```
Should be a dropdown/menu to pick any status.

**Bug**: Priority chip in drawer is display-only (no mutation wired).

**Missing**: `open full page` button in drawer top-bar is a `<button>` with no `onClick`.

### Activity tab
`ActivityList` in `Tickets.tsx` renders `data.detail.activity` — activity is embedded in `TicketDetail` (fetched with detail query). There is also a separate `useTicketActivityQuery` in `useTicketQueries.ts` that is **never called anywhere**. The activity data comes from the detail payload only.

`ActivityEntry` type in the component reads `.changes` and `.type` but the mapping is incomplete — only handles `created`, `status_change`, `assignee_change`; other types fall through to `item.type.replace("_", " ")`.

### Create modal
- Opens via `?modal=create` URL param
- Draft auto-saves to `localStorage` key `"ticket-create-draft"` (inline in component; `useTicketDraft` hook exists but is **not used** — draft logic is duplicated inline)
- `Cmd/Ctrl+Enter` submits from the backdrop div (correct)
- No invitee/assignee field in the modal despite spec requiring it and `NewTicketDraft.assigneeIds` existing in the type — it hardcodes `assigneeIds: []`

### Bulk actions bar
- Appears when `selectedCount > 0`
- `Status` button fires `bulkUpdate` with hardcoded `status: "REVIEW"` — not a picker
- `Priority` button fires `bulkUpdate` with hardcoded `priority: "HIGH"` — not a picker
- Assign button renders but has no `onClick`
- `Close ticket` correctly sends `status: "CLOSED"`

### Filter chips
The `FILTERS` array (`["Status", "Priority", "Category", "Assignee", "Date"]`) renders as buttons that have no `onClick` — **no filter dropdowns are implemented**. The search box and URL-driven filter parsing work, but there is no UI to set filters interactively except via URL.

---

## Authentication Gap (Critical)

Both `mutations.ts` and `views.ts` on the API use:
```ts
const getActorId = async (db: DbClient) => {
  const user = await db.user.findFirst({ orderBy: { createdAt: 'asc' } });
  return user!.id;
};
```
This is a stub that returns the first user in the DB. No session/JWT auth is applied to any ticket endpoint. Role-based access control (visibility scoping, permission gating) is **entirely absent** from the backend.

The frontend reads `user.role` from `useAuthState` for UI gating (e.g. showing Org column for SUPER_ADMIN) but the server doesn't enforce anything.

---

## Missing / Broken vs Spec

| Feature | Spec | Status |
|---------|------|--------|
| Role-differentiated built-in views | Per-role default view tabs | Not implemented — same 4 hardcoded views for all roles |
| Filter chip dropdowns | Status/Priority/Category/Assignee/Date pickers | Buttons render but have no interaction |
| Stale threshold | 7 days | Hardcoded 3 days in `data.ts` |
| Drawer status change | Click pill → menu | Hardcoded to REVIEW |
| Drawer priority change | Click chip → menu | No mutation wired |
| Open full page button | Navigate to `/tickets/:id/full` | Route not registered; button has no handler |
| Create modal invitees | Searchable user invite | Field missing; always sends `assigneeIds: []` |
| Bulk status picker | Pick any status | Hardcoded REVIEW |
| Bulk priority picker | Pick any priority | Hardcoded HIGH |
| Bulk assign | Assign to users | Button renders, no handler |
| `useTicketDraft` hook | Used by modal | Hook exists but is unused; logic duplicated inline |
| Role-based API auth | Server enforces visibility + permissions | Stubbed with first-user fallback |
| `/tickets/:id/full` route | Full-page ticket view | Route not registered in React Router |
| `since` poll endpoint | Returns count of new/updated tickets | Route missing from `tickets.ts` — `GET /tickets/since` not defined |
| Stale indicator in table | Amber dot on Updated cell when `isStale` | `isStale` field exists on `TicketRow` but no visual in the table |
| `unread` indicator | Visual badge for new activity | Field on `TicketRow` but TODO in backend; nothing in UI |
| Tab underline animation | Slides to active tab | Index-based; breaks when server views append to array |
| User role card layout | Card grid, no table for USER role | `UserTicketList` component exists and is rendered — **implemented** |
| Super Admin org grouping | Group by Org toggle | `groupByOrg` state + `groupedRows` memo — **implemented** |
| `j/k` keyboard nav in drawer | Move prev/next ticket | **implemented** |
| Draft autosave | localStorage, restore on reopen | **implemented** (inline, not using the hook) |
| New tickets banner | "N new · refresh" top of table | `newTicketsBannerCount` + refresh button — **implemented** |
| Multi-sort (shift-click) | Add secondary sort | **implemented** |

---

## Shared Schema Location

Types and Zod schemas are in `@shared/schema/tickets` and `@shared/schema/domain` — a shared package consumed by both `apps/web` and `apps/api`. Frontend `ticketParams.ts` re-exports from there and adds URL helpers. This is the correct pattern; keep it.

---

## Key Numbers

- Page size: 25 (frontend), 20 (backend default). **Mismatch** — frontend sends `pageSize: 25`, backend default falls back to `20` when not provided. Frontend always provides it so this is fine in practice, but backend default should match.
- staleTime list query: 25s
- staleTime views query: 5min
- Poll interval: 30s (tab-visible only via `refetchIntervalInBackground: false`)
- Virtual scroll overscan: 8 rows
- Description preview: first 120 chars (server-trimmed)
- Assignees preview: up to 3 (server-sent in `assigneesPreview[]`)
