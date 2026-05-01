# Dashboard Store Design

**Date:** 2026-05-01
**Files:**
- `apps/web/src/stores/useDashboardStore.ts`
- `apps/web/src/hooks/useDashboardFilters.ts`
- `apps/web/src/hooks/useZone1Query.ts`
- `apps/web/src/hooks/useZone2Query.ts`
- `apps/web/src/hooks/useZone3Query.ts`

---

## Architecture

Three distinct layers — no cross-layer state sharing.

| Layer | Owns | Does NOT own |
|-------|------|--------------|
| `useDashboardStore` | UI state: active zone tab, expanded panel IDs | Server data, filters, loading, errors |
| `useDashboardFilters()` | Parse + validate `useSearchParams` → typed `DashboardFilters` | Nothing stored in Zustand |
| `useZone1/2/3Query` | Data, loading, error, stale detection, background refetch | UI state |

No write-through cache. No timer. No `shouldRefetch` flag. No `lastFetchedAt`. React Query owns server state entirely.

---

## `useDashboardStore` — UI state only

```ts
interface DashboardUIState {
  expandedPanelIds: string[];   // Zone 3 panels that are expanded
  activeZoneTab: string | null; // Mobile tab selection between zones

  togglePanel: (id: string) => void;
  setActiveZoneTab: (tab: string | null) => void;
}
```

Minimal. Only state that is not derivable from URL or server data.

---

## `useDashboardFilters()` — URL hook

Thin wrapper over `useSearchParams`. Parses raw params into a typed `DashboardFilters` object. Validates and falls back to defaults on bad input. Returns both the parsed filters and a typed `setFilters` setter that writes back to the URL.

```ts
// Usage
const { filters, setFilters } = useDashboardFilters();
```

No Zustand involvement. Filters live in the URL only.

---

## Zone Query Hooks

All three follow the same pattern:

```ts
// staleTime: 5 minutes — no refetch until data is 5 min old
// refetchOnWindowFocus: true — React Query re-evaluates staleTime on focus;
//   if stale, background refetch fires automatically
useQuery({
  queryKey: ['dashboard', 'zone1', filters],
  queryFn: () => fetchZone1(filters),
  staleTime: 5 * 60 * 1000,
  refetchOnWindowFocus: true,
});
```

Zone fetches are independent — a failed zone 3 does not block zone 1 data from rendering.

Query keys include the full `filters` object so any filter change triggers a fresh fetch automatically.

---

## What replaces the old store fields

| Old field | Replacement |
|-----------|-------------|
| `filters` | `useDashboardFilters()` reads from URL |
| `zone1/2/3` | `useZone1/2/3Query().data` |
| `loading[zone]` | `useZone1/2/3Query().isLoading` |
| `errors[zone]` | `useZone1/2/3Query().error` |
| `lastFetchedAt` | Removed — React Query tracks this internally |
| `shouldRefetch` | Removed — `refetchOnWindowFocus: true` handles it |
| `_staleTimer` | Removed — `staleTime: 5min` handles it |
| `setZone1/2/3` | Removed — no write-through cache |
| `refetchIfStale` | Removed — React Query handles window focus |

---

## Out of Scope

- `QueryClient` provider setup
- API fetch functions (`fetchZone1` etc.)
- Role-gating logic inside query functions
- `useDashboardFilters` full validation rules
