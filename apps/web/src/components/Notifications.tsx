import {
  CheckCircle,
  CircleHelp,
  LoaderCircle,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { useNavigate, useSearchParams } from "react-router";
import type { NotificationRow } from "../types/notifications";
import { mergeFilters, parseFilters } from "../lib/notificationParams";
import {
  filterChips,
  groupNotificationRows,
  notificationShortcuts,
  selectedTypesFromChip,
  tabs,
  ticketHref,
} from "../lib/notificationsComponent";
import {
  useNotificationCountQuery,
  useNotificationsQuery,
} from "../hooks/useNotificationQueries";
import {
  useBulkMutation,
  useInvitationResponseMutation,
  useMarkDoneMutation,
  useSnoozeMutation,
} from "../hooks/useNotificationMutations";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";
import { EmptyState } from "./notifications/EmptyState";
import { SnoozeMenu } from "./notifications/SnoozeMenu";
import { NotificationRowView } from "./notifications/NotificationRowView";

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
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
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
  const markDone = useMarkDoneMutation();
  const bulk = useBulkMutation();
  const snooze = useSnoozeMutation();
  const invitation = useInvitationResponseMutation();

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

  const markRowDone = (row: NotificationRow) => {
    dismissThen(row.id, () => markDone.mutate(row.id));
  };

  const snoozeRow = (row: NotificationRow, date: Date, label: string) => {
    dismissThen(row.id, () =>
      snooze.mutate({
        id: row.id,
        payload: { snoozedUntil: date.toISOString() },
      }),
    );
    setToast(`Snoozed until ${label.toLowerCase()} · Undo`);
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
    if (event.key === "e" && focusedId) {
      event.preventDefault();
      const row = rows.find((item) => item.id === focusedId);
      if (row) markRowDone(row);
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
    if (event.key === "?") {
      event.preventDefault();
      setShortcutsOpen(true);
    }
  };

  return (
    <main
      className="app-page-frame notifications-page"
      onKeyDown={handleKeyboard}
    >
      <div className="app-page-frame-content notifications-shell">
        <header className="notifications-header">
          <div>
            <h1>
              Notifications <span>({unreadCount} unread)</span>
            </h1>
          </div>
          <div className="notifications-header-actions">
            {rows.length > 0 ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  bulk.mutate({
                    op: "done",
                    scope: "ids",
                    ids: rows.map((row) => row.id),
                  })
                }
              >
                <CheckCircle /> Mark all done
              </Button>
            ) : null}
          </div>
        </header>

        <div className="notifications-sticky">
          <nav className="notifications-tabs" aria-label="Notification tabs">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={cn(
                  activeTab === tab.key && "notifications-tab-active",
                )}
                onClick={() => updateFilters({ tab: tab.key })}
              >
                {tab.label}
                {tab.key === "inbox" ? <span>{unreadCount}</span> : null}
              </button>
            ))}
          </nav>

          <div
            className={cn(
              "notifications-bulk",
              selectedCount > 0 && "notifications-bulk-open",
            )}
          >
            <span>{selectedCount} selected</span>
            <div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
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
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  bulk.mutate({
                    op: "done",
                    scope: "ids",
                    ids: [...selectedIds],
                  });
                  setSelectedIds(new Set());
                }}
              >
                Mark done
              </Button>
              <div className="notifications-snooze-wrap">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
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
                onClick={() => setSelectedIds(new Set())}
              >
                Deselect all
              </Button>
            </div>
          </div>

          <div className="notifications-filters">
            {filterChips.map((chip) => {
              const active = selectedTypesFromChip(chip.types, activeTypes);
              return (
                <button
                  key={chip.label}
                  type="button"
                  className={cn(active && "notifications-filter-active")}
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
                className="notifications-clear"
                onClick={() => updateFilters({ type: [] })}
              >
                Clear filters
              </button>
            ) : null}
          </div>
        </div>

        <div ref={listTopRef} className="notifications-list-top" />
        {newRowsPending > 0 ? (
          <button
            type="button"
            className="notifications-new-pill"
            onClick={() => {
              setNewRowsPending(0);
              listTopRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
            }}
          >
            {newRowsPending} new notifications · Show
          </button>
        ) : null}

        {isLoading ? (
          <div className="notifications-loading">
            <LoaderCircle className="size-4 animate-spin" /> Loading
            notifications
          </div>
        ) : null}
        {isError ? (
          <div className="notifications-error">
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

        <section className="notifications-list" aria-label="Notification list">
          {Object.entries(groupedRows).map(([band, bandRows]) =>
            bandRows.length > 0 ? (
              <div key={band} className="notifications-section">
                <div className="notifications-section-label">
                  <span>{band}</span>
                </div>
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
                    onDone={() => markRowDone(row)}
                    onSnooze={(date, label) => snoozeRow(row, date, label)}
                    onInvite={(response) => {
                      if (row.type !== "TICKET_INVITATION" || !row.invitationId)
                        return;
                      const invitationId = row.invitationId;
                      dismissThen(row.id, () =>
                        invitation.mutate({
                          invitationId,
                          payload: { response },
                        }),
                      );
                    }}
                  />
                ))}
              </div>
            ) : null,
          )}
        </section>

        <footer className="notifications-footer">
          <button
            type="button"
            aria-label="Keyboard shortcuts"
            onClick={() => setShortcutsOpen(true)}
          >
            <CircleHelp className="size-4" />
          </button>
        </footer>
      </div>

      {shortcutsOpen ? (
        <div className="notifications-dialog-backdrop" role="presentation">
          <div
            className="notifications-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="shortcuts-title"
          >
            <div className="notifications-dialog-header">
              <h2 id="shortcuts-title">Keyboard Shortcuts</h2>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Close shortcuts"
                onClick={() => setShortcutsOpen(false)}
              >
                <X />
              </Button>
            </div>
            <div className="notifications-shortcuts">
              {notificationShortcuts.map(({ key, label }) => (
                <div key={key}>
                  <kbd>{key}</kbd>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div className="notifications-toast" role="status">
          {toast}
        </div>
      ) : null}
    </main>
  );
};
