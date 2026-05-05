import { Bell } from "lucide-react";
import { PageLoader } from "../PageLoader";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { useNavigate, useSearchParams } from "react-router";
import type { NotificationRow } from "../../types/notifications";
import { mergeFilters, parseFilters } from "../../lib/notificationParams";
import {
  filterChips,
  groupNotificationRows,
  selectedTypesFromChip,
  tabs,
  ticketHref,
} from "../../lib/notificationsComponent";
import {
  useNotificationCountQuery,
  useNotificationsQuery,
} from "../../hooks/useNotificationQueries";
import {
  useBulkMutation,
  useSnoozeMutation,
  useUpdateNotificationStateMutation,
} from "../../hooks/useNotificationMutations";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";
import { EmptyState } from "./EmptyState";
import { SnoozeMenu } from "./SnoozeMenu";
import { NotificationRowView } from "./NotificationRowView";
import {
  notificationChip,
  notificationChipActive,
  notificationGhostActionButton,
  notificationHeader,
  notificationMeta,
  notificationPage,
  notificationPanel,
  notificationSecondaryButton,
  notificationTitle,
  notificationToast,
} from "./styles";

export const Notifications = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = parseFilters(searchParams);
  const activeTab = filters.tab;
  const activeTypes = filters.type ?? [];
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const [dismissingIds, setDismissingIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [bulkSnoozeOpen, setBulkSnoozeOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [newRowsPending, setNewRowsPending] = useState(0);
  const previousInboxCount = useRef<number | null>(null);
  const listTopRef = useRef<HTMLDivElement | null>(null);

  const listParams = useMemo(
    () => ({
      tab: activeTab,
      type: activeTypes.length > 0 ? activeTypes : undefined,
      ticketId: filters.ticketId,
      orgId: filters.orgId,
      page: 1,
      pageSize: 30,
    }),
    [activeTab, activeTypes, filters.ticketId, filters.orgId],
  );
  const { data, isLoading, isError } = useNotificationsQuery(listParams);
  const countQuery = useNotificationCountQuery();
  const updateNotificationState = useUpdateNotificationStateMutation();
  const bulk = useBulkMutation();
  const snooze = useSnoozeMutation();

  const rows = useMemo(
    () => (data?.rows ?? []).filter((row) => !dismissingIds.has(row.id)),
    [data?.rows, dismissingIds],
  );
  const unreadCount =
    countQuery.data?.inbox ??
    rows.filter((row) => row.state === "inbox").length;
  const hasFilters = activeTypes.length > 0;
  const selectedCount = selectedIds.size;

  const groupedRows = useMemo(() => {
    return groupNotificationRows(rows);
  }, [rows]);

  useEffect(() => {
    if (previousInboxCount.current === null) {
      previousInboxCount.current = unreadCount;
      return;
    }
    if (unreadCount > previousInboxCount.current) {
      setNewRowsPending(unreadCount - previousInboxCount.current);
    }
    previousInboxCount.current = unreadCount;
  }, [unreadCount]);

  useEffect(() => {
    if (!focusedId && rows.length > 0) {
      setFocusedId(rows[0].id);
    }
  }, [focusedId, rows]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 4_000);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const updateFilters = (patch: Parameters<typeof mergeFilters>[1]) => {
    setSearchParams(mergeFilters(searchParams, patch));
    setSelectedIds(new Set());
  };

  const dismissThen = (id: string, action: () => void) => {
    setDismissingIds((prev) => new Set(prev).add(id));
    window.setTimeout(() => {
      action();
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setDismissingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 250);
  };

  const moveRowToState = (
    row: NotificationRow,
    state: NotificationRow["state"],
  ) => {
    dismissThen(row.id, () =>
      updateNotificationState.mutate({ id: row.id, state }),
    );
  };

  const bulkSnooze = (date: Date, label: string) => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    ids.forEach((id) => {
      snooze.mutate({ id, payload: { snoozedUntil: date.toISOString() } });
    });
    setSelectedIds(new Set());
    setBulkSnoozeOpen(false);
    setToast(`Snoozed until ${label.toLowerCase()} · Undo`);
  };

  const focusByDelta = (delta: number) => {
    const index = rows.findIndex((row) => row.id === focusedId);
    const next = rows[Math.min(rows.length - 1, Math.max(0, index + delta))];
    if (next) setFocusedId(next.id);
  };

  const handleKeyboard = (event: KeyboardEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest("button, a, input, textarea, [role='dialog']")) return;
    if (event.key === "j") {
      event.preventDefault();
      focusByDelta(1);
    }
    if (event.key === "k") {
      event.preventDefault();
      focusByDelta(-1);
    }
    if (event.key === "x" && focusedId) {
      event.preventDefault();
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.has(focusedId) ? next.delete(focusedId) : next.add(focusedId);
        return next;
      });
    }
    if (event.key === "Enter" && focusedId) {
      event.preventDefault();
      const row = rows.find((item) => item.id === focusedId);
      if (row) navigate(ticketHref(row));
    }
    if (event.key === "I" && event.shiftKey) {
      event.preventDefault();
      bulk.mutate({ op: "read", scope: "ids", ids: rows.map((row) => row.id) });
    }
  };

  return (
    <main className={notificationPage} onKeyDown={handleKeyboard}>
      <div className="app-page-frame-content">
        <header className={notificationHeader}>
          <div>
            <h1 className={notificationTitle}>Notifications</h1>
            <p className={`${notificationMeta} mt-1`}>
              {unreadCount} unread operator update
              {unreadCount === 1 ? "" : "s"} waiting for action
            </p>
          </div>
        </header>

        <div className="sticky top-20 z-20 -mx-0.5 border-b border-[--border-default] bg-[--surface-page]/95 px-0.5 pt-1 backdrop-blur">
          <nav className="flex gap-1.5" aria-label="Notification tabs">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={cn(
                  "inline-flex cursor-pointer items-center gap-1.5 rounded-t-[--radius-md] border border-transparent px-3 py-2 text-xs font-medium text-[--ink-3] transition-colors hover:bg-[--surface-card] hover:text-[--ink-1]",
                  activeTab === tab.key &&
                    "border-[--action-bg] border-b-[--action-tint-bg] bg-[--action-tint-bg] text-[--action-tint-fg] shadow-[--elev-1]",
                )}
                onClick={() => updateFilters({ tab: tab.key })}
              >
                {tab.label}
                {tab.key === "inbox" ? (
                  <span className="rounded-[--radius-pill] border border-[--border-default] bg-[--surface-sunken] px-1.5 text-[0.625rem]/[1.4] text-[--ink-2]">
                    {unreadCount}
                  </span>
                ) : null}
              </button>
            ))}
          </nav>

          <div
            className={cn(
              "grid max-h-0 grid-cols-[1fr_auto] items-center gap-3 overflow-visible opacity-0 -translate-y-1.5 transition-[max-height,opacity,transform,padding] duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] max-[720px]:grid-cols-1 max-[720px]:items-start",
              selectedCount > 0 &&
                "mt-3 max-h-14 translate-y-0 rounded-[--radius-lg] border border-[--action-bg] bg-[--action-tint-bg] px-3 py-2 opacity-100 shadow-[--elev-2]",
            )}
          >
            <span className="text-xs font-medium text-[--ink-1]">
              {selectedCount} selected
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={notificationSecondaryButton}
                onClick={() =>
                  bulk.mutate({
                    op: "read",
                    scope: "ids",
                    ids: [...selectedIds],
                  })
                }
              >
                Mark read
              </Button>
              <div className="relative">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={notificationSecondaryButton}
                  onClick={() => setBulkSnoozeOpen((value) => !value)}
                >
                  Snooze
                </Button>
                {bulkSnoozeOpen ? <SnoozeMenu onSelect={bulkSnooze} /> : null}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={notificationGhostActionButton}
                onClick={() => setSelectedIds(new Set())}
              >
                Deselect all
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto py-3 [scrollbar-width:thin]">
            {filterChips.map((chip) => {
              const active = selectedTypesFromChip(chip.types, activeTypes);
              return (
                <button
                  key={chip.label}
                  type="button"
                  className={cn(
                    notificationChip,
                    active && notificationChipActive,
                  )}
                  onClick={() => {
                    const next = active
                      ? activeTypes.filter((type) => !chip.types.includes(type))
                      : [...new Set([...activeTypes, ...chip.types])];
                    updateFilters({ type: next });
                  }}
                >
                  {chip.label}
                </button>
              );
            })}
            {hasFilters ? (
              <button
                type="button"
                className="shrink-0 cursor-pointer rounded-[--radius-pill] border border-transparent bg-transparent px-2.5 py-1.5 text-[0.6875rem]/[1.4] font-medium text-[--action-tint-fg] hover:bg-[--action-tint-bg]"
                onClick={() => updateFilters({ type: [] })}
              >
                Clear filters
              </button>
            ) : null}
          </div>
        </div>

        <div ref={listTopRef} />
        {newRowsPending > 0 ? (
          <button
            type="button"
            className="mx-auto mt-4 mb-3 flex cursor-pointer items-center gap-1.5 rounded-[--radius-pill] border border-[--status-warn-border] bg-[--status-warn-bg] px-3 py-1.5 text-[0.6875rem] font-medium text-[--status-warn-fg] shadow-[--elev-1]"
            onClick={() => {
              setNewRowsPending(0);
              listTopRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
            }}
          >
            <Bell className="size-3" />
            {newRowsPending} new notifications · Show
          </button>
        ) : null}

        {isLoading ? <PageLoader inline className="min-h-[280px]" /> : null}
        {isError ? (
          <div className="grid min-h-[280px] place-items-center text-center text-[--ink-3]">
            Could not load notifications from the API.
          </div>
        ) : null}

        {!isLoading && !isError && rows.length === 0 ? (
          <EmptyState
            activeTab={activeTab}
            hasFilters={hasFilters}
            onClear={() => updateFilters({ type: [] })}
          />
        ) : null}

        <section aria-label="Notification list">
          {Object.entries(groupedRows).map(([band, bandRows]) =>
            bandRows.length > 0 ? (
              <div key={band} className="mt-5">
                <div className="mb-2 flex items-center gap-2.5 text-[0.625rem] font-semibold uppercase tracking-[0.08em] text-[--ink-3] after:h-px after:flex-1 after:bg-[--border-default]">
                  <span>{band}</span>
                </div>
                <div className={notificationPanel}>
                  {bandRows.map((row) => (
                    <NotificationRowView
                      key={row.id}
                      row={row}
                      focused={focusedId === row.id}
                      selected={selectedIds.has(row.id)}
                      expanded={expandedIds.has(row.id)}
                      dismissing={dismissingIds.has(row.id)}
                      onFocus={() => setFocusedId(row.id)}
                      onToggleSelect={() =>
                        setSelectedIds((prev) => {
                          const next = new Set(prev);
                          next.has(row.id)
                            ? next.delete(row.id)
                            : next.add(row.id);
                          return next;
                        })
                      }
                      onToggleExpand={() =>
                        setExpandedIds((prev) => {
                          const next = new Set(prev);
                          next.has(row.id)
                            ? next.delete(row.id)
                            : next.add(row.id);
                          return next;
                        })
                      }
                      onOpen={() => navigate(ticketHref(row))}
                      onStateChange={(state) => moveRowToState(row, state)}
                    />
                  ))}
                </div>
              </div>
            ) : null,
          )}
        </section>
      </div>

      {toast ? (
        <div className={notificationToast} role="status">
          {toast}
        </div>
      ) : null}
    </main>
  );
};
