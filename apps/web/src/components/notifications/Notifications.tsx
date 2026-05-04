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
import type { NotificationRow } from "../../types/notifications";
import { mergeFilters, parseFilters } from "../../lib/notificationParams";
import {
  filterChips,
  groupNotificationRows,
  notificationShortcuts,
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
  useInvitationResponseMutation,
  useMarkDoneMutation,
  useSnoozeMutation,
} from "../../hooks/useNotificationMutations";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";
import { EmptyState } from "./EmptyState";
import { SnoozeMenu } from "./SnoozeMenu";
import { NotificationRowView } from "./NotificationRowView";
import {
  notificationChip,
  notificationChipActive,
  notificationHeader,
  notificationMeta,
  notificationPage,
  notificationPanel,
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
      className={notificationPage}
      onKeyDown={handleKeyboard}
    >
      <div className="app-page-frame-content">
        <header className={notificationHeader}>
          <div>
            <h1 className={notificationTitle}>
              Notifications
            </h1>
            <p className={`${notificationMeta} mt-1`}>
              {unreadCount} unread operator updates
            </p>
          </div>
          <div className="flex items-center gap-1.5">
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

        <div className="sticky top-16 z-20 -mx-0.5 bg-[--surface-page] px-0.5">
          <nav
            className="flex gap-[18px] border-b border-[--border-default]"
            aria-label="Notification tabs"
          >
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={cn(
                  "inline-flex cursor-pointer items-center gap-1.5 border-0 border-b border-transparent bg-transparent py-2.5 pt-2.5 pb-[9px] text-xs text-[--ink-3]",
                  activeTab === tab.key &&
                    "border-b-[--action-bg] text-[--ink-1]",
                )}
                onClick={() => updateFilters({ tab: tab.key })}
              >
                {tab.label}
                {tab.key === "inbox" ? (
                  <span className="rounded-[--radius-md] border border-[--border-default] px-1.5 text-[0.625rem]/[1.4]">
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
                "mt-2 max-h-12 translate-y-0 rounded-[--radius-md] border border-[--border-default] bg-[--surface-sunken] px-2 py-[7px] opacity-100 shadow-[--elev-1]",
            )}
          >
            <span className="text-xs text-[--ink-1]">
              {selectedCount} selected
            </span>
            <div className="flex items-center gap-1.5">
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
              <div className="relative">
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

          <div className="flex items-center gap-1.5 overflow-x-auto py-2.5 pb-3 [scrollbar-width:thin]">
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
                className="shrink-0 cursor-pointer rounded-[--radius-md] border border-transparent bg-[--surface-page] px-2 py-1 text-[0.6875rem]/[1.4] text-[--action-tint-fg]"
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
            className="mx-auto mt-0.5 mb-3 block cursor-pointer rounded-[--radius-md] border border-[--status-warn-border] bg-[--status-warn-bg] px-2.5 py-[5px] text-[0.6875rem] text-[--status-warn-fg]"
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
          <div className="grid min-h-[280px] place-items-center text-center text-[--ink-3]">
            <LoaderCircle className="size-4 animate-spin" /> Loading
            notifications
          </div>
        ) : null}
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
              <div key={band} className="mt-3">
                <div className="mt-3.5 mb-1.5 flex items-center gap-2.5 text-[0.625rem] font-semibold uppercase tracking-[0.08em] text-[--ink-3] after:h-px after:flex-1 after:bg-[--border-default]">
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

        <footer className="flex justify-end pt-[18px]">
          <button
            type="button"
            aria-label="Keyboard shortcuts"
            className="grid size-7 place-items-center rounded-[--radius-md] border border-[--border-default] bg-[--surface-card] text-[--ink-3]"
            onClick={() => setShortcutsOpen(true)}
          >
            <CircleHelp className="size-4" />
          </button>
        </footer>
      </div>

      {shortcutsOpen ? (
        <div
          className="fixed inset-0 z-[80] grid place-items-center bg-[--surface-overlay]"
          role="presentation"
        >
          <div
            className={`${notificationPanel} w-[min(92vw,420px)] p-3.5`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="shortcuts-title"
          >
            <div className="flex items-center justify-between gap-3">
              <h2
                id="shortcuts-title"
                className="m-0 text-base text-[--ink-1]"
              >
                Keyboard Shortcuts
              </h2>
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
            <div className="mt-3.5 grid gap-0.5">
              {notificationShortcuts.map(({ key, label }) => (
                <div
                  key={key}
                  className="grid grid-cols-[92px_1fr] items-center border-t border-[--border-default] py-2 text-xs text-[--ink-3]"
                >
                  <kbd className="w-fit rounded-[--radius-sm] border border-[--border-default] bg-[--surface-sunken] px-1.5 py-0.5 font-mono text-[--ink-1]">
                    {key}
                  </kbd>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div
          className={notificationToast}
          role="status"
        >
          {toast}
        </div>
      ) : null}
    </main>
  );
};
