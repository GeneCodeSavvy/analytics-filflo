# Dashboard Store Design

**Date:** 2026-05-01
**File:** `apps/web/src/stores/useDashboardStore.ts`

---

## Context

Implements `useDashboardStore` — the Zustand store for the dashboard page (`/`). Store is a write-through cache: React Query fetches zone data and writes it into the store via setters. URL owns filter state; store mirrors it.

---

## Decisions

### Server state: spec-literal (React Query + Zustand hybrid)

Zone data (`zone1`, `zone2`, `zone3`) lives in Zustand. React Query fetches each zone independently and calls `setZone1/2/3` on success. Store is the cache; React Query is the fetcher. Loading and error per zone are also in the store, set via React Query callbacks.

### Filter ownership: URL-owns, store mirrors

URL is source of truth for `range`, `orgIds`, `priority`, `category`. A `useDashboardFilters` hook (not in this spec) initializes store filters from `useSearchParams` on mount and calls both `setSearchParams` and store `setFilters` on change. The store itself has no React Router dependency.

### Stale signaling: Approach B — timer inside store closure

A `_staleTimer` variable lives inside the `create()` closure — not in state, not exported, no module-level globals. `setZone1/2/3` each clear and restart this timer (5-minute window). When the timer fires, it sets `shouldRefetch: true`. Components `useEffect` on `shouldRefetch` and call `queryClient.invalidateQueries(['dashboard'])` when it becomes `true`.

`refetchIfStale()` is called on `visibilitychange` (tab focus). It checks `Date.now() - lastFetchedAt > 5min` and sets `shouldRefetch = true` directly if stale — no timer involved for the manual path.

`shouldRefetch` resets to `false` inside `setZone1/2/3` so it doesn't re-trigger while React Query is already in flight.

---

## State Shape

```ts
interface DashboardState {
  // Filters — URL mirror
  filters: DashboardFilters;

  // Zone data — written by React Query callbacks
  zone1: Zone1Data | null;
  zone2: Zone2Data | null;
  zone3: Zone3Data | null;

  // Per-zone loading + error
  loading: Record<'zone1' | 'zone2' | 'zone3', boolean>;
  errors:  Record<'zone1' | 'zone2' | 'zone3', string | null>;

  // Stale signaling
  lastFetchedAt: number | null;
  shouldRefetch: boolean;
}
```

---

## Actions

| Action | Behavior |
|--------|----------|
| `setFilters(partial)` | Merges partial into `filters`. Called by `useDashboardFilters` hook alongside `setSearchParams`. |
| `setZone1(data)` | Sets `zone1`, resets `shouldRefetch: false`, updates `lastFetchedAt`, restarts stale timer. |
| `setZone2(data)` | Same as above for `zone2`. |
| `setZone3(data)` | Same as above for `zone3`. |
| `setLoading(zone, bool)` | Sets `loading[zone]`. |
| `setError(zone, msg\|null)` | Sets `errors[zone]`. |
| `refetchIfStale()` | If `lastFetchedAt` is null or `> 5min` old → sets `shouldRefetch: true`. Called on `visibilitychange`. |

---

## Timer Invariant

All three `setZone*` actions share one `_staleTimer`. Each call restarts it. The 5-minute clock begins from the **last** zone data to arrive. This means a full dashboard load (all three zones fetched) won't go stale until 5 minutes after the slowest zone completes.

---

## Internal Implementation Sketch

```ts
export const useDashboardStore = create<DashboardState>((set, get) => {
  let _staleTimer: ReturnType<typeof setTimeout> | null = null;

  const restartStaleTimer = () => {
    if (_staleTimer) clearTimeout(_staleTimer);
    _staleTimer = setTimeout(() => {
      set({ shouldRefetch: true });
    }, 5 * 60 * 1000);
  };

  return {
    filters: { range: '30d' },
    zone1: null,
    zone2: null,
    zone3: null,
    loading: { zone1: false, zone2: false, zone3: false },
    errors:  { zone1: null,  zone2: null,  zone3: null  },
    lastFetchedAt: null,
    shouldRefetch: false,

    setFilters: (partial) =>
      set((s) => ({ filters: { ...s.filters, ...partial } })),

    setZone1: (data) => {
      set({ zone1: data, lastFetchedAt: Date.now(), shouldRefetch: false });
      restartStaleTimer();
    },
    setZone2: (data) => {
      set({ zone2: data, lastFetchedAt: Date.now(), shouldRefetch: false });
      restartStaleTimer();
    },
    setZone3: (data) => {
      set({ zone3: data, lastFetchedAt: Date.now(), shouldRefetch: false });
      restartStaleTimer();
    },

    setLoading: (zone, loading) =>
      set((s) => ({ loading: { ...s.loading, [zone]: loading } })),

    setError: (zone, error) =>
      set((s) => ({ errors: { ...s.errors, [zone]: error } })),

    refetchIfStale: () => {
      const { lastFetchedAt } = get();
      if (!lastFetchedAt || Date.now() - lastFetchedAt > 5 * 60 * 1000) {
        set({ shouldRefetch: true });
      }
    },
  };
});
```

---

## Out of Scope

- `useDashboardFilters` hook (URL ↔ store sync)
- React Query query definitions (`useQuery` hooks per zone)
- `visibilitychange` event wiring (lives in a layout effect in the dashboard page component)
- Zone data type definitions (already in `docs/web/zustand.md`)
