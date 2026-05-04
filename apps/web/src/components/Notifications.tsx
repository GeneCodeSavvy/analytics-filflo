import {
  CheckCircle,
  ChevronDown,
  CircleHelp,
  Clock,
  Eye,
  Inbox,
  LoaderCircle,
  Mail,
  MessageSquare,
  UserPlus,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useNavigate, useSearchParams } from "react-router";
import type { NotificationRow, NotificationType } from "../lib/notificationParams";
import {
  mergeFilters,
  parseFilters,
} from "../lib/notificationParams";
import {
  useNotificationCountQuery,
  useNotificationsQuery,
  useNotificationThreadQuery,
} from "../hooks/useNotificationQueries";
import {
  useBulkMutation,
  useInvitationResponseMutation,
  useMarkDoneMutation,
  useSnoozeMutation,
} from "../hooks/useNotificationMutations";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";

type TabKey = "inbox" | "read" | "done" | "all";
type DateBand = "Today" | "Yesterday" | "This Week" | "Older";

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "inbox", label: "Inbox" },
  { key: "read", label: "Read" },
  { key: "done", label: "Done" },
  { key: "all", label: "All" },
];

const filterChips: Array<{ label: string; types: NotificationType[] }> = [
  { label: "Assignments", types: ["TICKET_ASSIGNED"] },
  { label: "Reviews", types: ["REVIEW_REQUESTED"] },
  { label: "Invitations", types: ["TICKET_INVITATION"] },
  { label: "Resolutions", types: ["TICKET_RESOLVED", "TICKET_CLOSED"] },
  { label: "Messages", types: ["MESSAGE_ACTIVITY"] },
];

const typeSummaries: Record<NotificationType, string> = {
  TICKET_ASSIGNED: "You've been assigned",
  REVIEW_REQUESTED: "Review requested",
  TICKET_INVITATION: "You've been invited",
  TICKET_RESOLVED: "Ticket resolved",
  TICKET_CLOSED: "Ticket closed",
  NEW_TICKET_IN_ORG: "New ticket in org",
  MESSAGE_ACTIVITY: "New messages",
};

const snoozeOptions = [
  { label: "1 hour", getDate: () => new Date(Date.now() + 60 * 60 * 1000) },
  {
    label: "Tomorrow morning",
    getDate: () => {
      const value = new Date();
      value.setDate(value.getDate() + 1);
      value.setHours(9, 0, 0, 0);
      return value;
    },
  },
  {
    label: "Next week",
    getDate: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  },
  { label: "Custom...", getDate: () => new Date(Date.now() + 24 * 60 * 60 * 1000) },
];

function notificationIcon(type: NotificationType) {
  if (type === "TICKET_ASSIGNED") return UserPlus;
  if (type === "REVIEW_REQUESTED") return Eye;
  if (type === "TICKET_INVITATION") return Mail;
  if (type === "MESSAGE_ACTIVITY") return MessageSquare;
  return CheckCircle;
}

function relativeTime(value: string) {
  const diffMs = Date.now() - new Date(value).getTime();
  const minutes = Math.max(1, Math.floor(diffMs / 60_000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w ago`;
}

function dateBand(value: string): DateBand {
  const diffDays = Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000);
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return "This Week";
  return "Older";
}

function ticketHref(row: NotificationRow) {
  if (!row.ticket) return "/tickets";
  return `/tickets/${encodeURIComponent(row.ticket.id)}`;
}

function rowSummary(row: NotificationRow) {
  if (row.type === "MESSAGE_ACTIVITY" && row.eventCount > 1) {
    return `${row.eventCount} new messages`;
  }
  return typeSummaries[row.type];
}

function selectedTypesFromChip(types: NotificationType[], active: NotificationType[]) {
  return types.every((type) => active.includes(type));
}

function EmptyState({
  activeTab,
  hasFilters,
  onClear,
}: {
  activeTab: TabKey;
  hasFilters: boolean;
  onClear: () => void;
}) {
  const copy = hasFilters
    ? {
        heading: "No matching notifications",
        text: "No notifications match the active filters.",
      }
    : activeTab === "inbox"
      ? {
          heading: "All caught up",
          text: "No notifications need your attention.",
        }
      : activeTab === "read"
        ? { heading: "Nothing here yet", text: "Read notifications appear here." }
        : activeTab === "done"
          ? {
              heading: "Cleared notifications appear here",
              text: "Done items stay available for reference.",
            }
          : { heading: "Nothing here yet", text: "Notifications appear here." };

  return (
    <div className="notifications-empty">
      <Inbox className="size-10" />
      <h2>{copy.heading}</h2>
      <p>{copy.text}</p>
      {hasFilters ? (
        <button type="button" onClick={onClear}>
          Clear filters
        </button>
      ) : null}
    </div>
  );
}

function SnoozeMenu({
  onSelect,
}: {
  onSelect: (date: Date, label: string) => void;
}) {
  return (
    <div className="notifications-popover" role="menu">
      {snoozeOptions.map((option) => (
        <button
          key={option.label}
          type="button"
          role="menuitem"
          onClick={(event) => {
            event.stopPropagation();
            onSelect(option.getDate(), option.label);
          }}
        >
          <Clock className="size-3.5" />
          {option.label}
        </button>
      ))}
    </div>
  );
}

function ThreadEvents({ row }: { row: NotificationRow }) {
  const { data, isLoading } = useNotificationThreadQuery(row.id);

  return (
    <div className="notifications-thread">
      {isLoading ? (
        <div className="notifications-thread-loading">
          <LoaderCircle className="size-3.5 animate-spin" />
          Loading updates
        </div>
      ) : null}
      {(data?.events ?? []).map((event) => {
        const Icon = notificationIcon(event.type);
        return (
          <div key={event.id} className="notifications-thread-item">
            <Icon className="size-3.5" />
            <div>
              <p>{event.description}</p>
              <span>
                {event.actor.name} · {relativeTime(event.at)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function NotificationActions({
  row,
  visible,
  onOpen,
  onDone,
  onSnooze,
  onInvite,
}: {
  row: NotificationRow;
  visible: boolean;
  onOpen: () => void;
  onDone: () => void;
  onSnooze: (date: Date, label: string) => void;
  onInvite: (response: "ACCEPTED" | "CANCELLED") => void;
}) {
  const [snoozeOpen, setSnoozeOpen] = useState(false);
  const alwaysVisible = row.type === "TICKET_INVITATION";

  if (row.type === "TICKET_INVITATION") {
    return (
      <div className="notifications-actions notifications-actions-visible">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={(event) => {
            event.stopPropagation();
            onInvite("ACCEPTED");
          }}
        >
          <CheckCircle /> Accept
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={(event) => {
            event.stopPropagation();
            onInvite("CANCELLED");
          }}
        >
          <X /> Decline
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "notifications-actions",
        (visible || alwaysVisible) && "notifications-actions-visible",
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={(event) => {
          event.stopPropagation();
          onOpen();
        }}
      >
        {row.type === "REVIEW_REQUESTED" ? <Eye /> : <MessageSquare />}
        {row.type === "REVIEW_REQUESTED"
          ? "Review"
          : row.type === "MESSAGE_ACTIVITY"
            ? "Open thread"
            : "Open"}
      </Button>
      {row.type === "REVIEW_REQUESTED" ? (
        <div className="notifications-snooze-wrap">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(event) => {
              event.stopPropagation();
              setSnoozeOpen((value) => !value);
            }}
          >
            <Clock /> Snooze
          </Button>
          {snoozeOpen ? (
            <SnoozeMenu
              onSelect={(date, label) => {
                setSnoozeOpen(false);
                onSnooze(date, label);
              }}
            />
          ) : null}
        </div>
      ) : null}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={(event) => {
          event.stopPropagation();
          onDone();
        }}
      >
        <CheckCircle /> Done
      </Button>
    </div>
  );
}

function NotificationRowView({
  row,
  focused,
  selected,
  expanded,
  dismissing,
  onFocus,
  onToggleSelect,
  onToggleExpand,
  onOpen,
  onDone,
  onSnooze,
  onInvite,
}: {
  row: NotificationRow;
  focused: boolean;
  selected: boolean;
  expanded: boolean;
  dismissing: boolean;
  onFocus: () => void;
  onToggleSelect: () => void;
  onToggleExpand: () => void;
  onOpen: () => void;
  onDone: () => void;
  onSnooze: (date: Date, label: string) => void;
  onInvite: (response: "ACCEPTED" | "CANCELLED") => void;
}) {
  const Icon = notificationIcon(row.type);
  const isAction = row.tier === "action_required";
  const isStatus = row.tier === "status_update";

  return (
    <div
      tabIndex={0}
      className={cn(
        "notifications-row",
        isAction && "notifications-row-action",
        isStatus && "notifications-row-status",
        focused && "notifications-row-focused",
        selected && "notifications-row-selected",
        dismissing && "notifications-row-dismissing",
      )}
      onFocus={onFocus}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          onOpen();
        }
      }}
    >
      <div className="notifications-row-inner">
        <div className="notifications-row-left">
          <button
            type="button"
            aria-label={selected ? "Deselect notification" : "Select notification"}
            className={cn("notifications-check", selected && "notifications-check-on")}
            onClick={(event) => {
              event.stopPropagation();
              onToggleSelect();
            }}
          >
            {selected ? <CheckCircle className="size-3.5" /> : null}
          </button>
          <Icon className="notifications-type-icon" />
        </div>

        <div className="notifications-main">
          <div className="notifications-line">
            {row.eventCount > 1 ? (
              <button
                type="button"
                className="notifications-expand"
                aria-label={expanded ? "Collapse notification group" : "Expand notification group"}
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleExpand();
                }}
              >
                <ChevronDown className={cn("size-3.5", expanded && "rotate-180")} />
              </button>
            ) : null}
            <span className="notifications-ticket">#{row.ticket?.id ?? "ticket"}</span>
            <span className="notifications-summary">{rowSummary(row)}</span>
            {row.eventCount > 1 ? (
              <span className="notifications-count">{row.eventCount} updates</span>
            ) : null}
          </div>
          <p className="notifications-title">{row.ticket?.subject ?? row.latestEvent.description}</p>
          <p className="notifications-time">
            {relativeTime(row.latestEvent.at)}
          </p>
        </div>

        <NotificationActions
          row={row}
          visible={focused}
          onOpen={onOpen}
          onDone={onDone}
          onSnooze={onSnooze}
          onInvite={onInvite}
        />
      </div>
      <div className={cn("notifications-thread-shell", expanded && "notifications-thread-open")}>
        {expanded ? <ThreadEvents row={row} /> : null}
      </div>
    </div>
  );
}

export const Notifications = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = parseFilters(searchParams);
  const activeTab = filters.tab as TabKey;
  const activeTypes = filters.type ?? [];
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const [dismissingIds, setDismissingIds] = useState<Set<string>>(() => new Set());
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
  const unreadCount = countQuery.data?.inbox ?? rows.filter((row) => row.state === "inbox").length;
  const hasFilters = activeTypes.length > 0;
  const selectedCount = selectedIds.size;

  const groupedRows = useMemo(() => {
    const bands: Record<DateBand, NotificationRow[]> = {
      Today: [],
      Yesterday: [],
      "This Week": [],
      Older: [],
    };
    rows.forEach((row) => bands[dateBand(row.latestEvent.at)].push(row));
    return bands;
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
      snooze.mutate({ id: row.id, payload: { snoozedUntil: date.toISOString() } }),
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
    <main className="notifications-page" onKeyDown={handleKeyboard}>
      <div className="notifications-shell">
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
                onClick={() => bulk.mutate({ op: "done", scope: "ids", ids: rows.map((row) => row.id) })}
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
                className={cn(activeTab === tab.key && "notifications-tab-active")}
                onClick={() => updateFilters({ tab: tab.key })}
              >
                {tab.label}
                {tab.key === "inbox" ? <span>{unreadCount}</span> : null}
              </button>
            ))}
          </nav>

          <div className={cn("notifications-bulk", selectedCount > 0 && "notifications-bulk-open")}>
            <span>{selectedCount} selected</span>
            <div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  bulk.mutate({ op: "read", scope: "ids", ids: [...selectedIds] })
                }
              >
                Mark read
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  bulk.mutate({ op: "done", scope: "ids", ids: [...selectedIds] });
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
              listTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          >
            {newRowsPending} new notifications · Show
          </button>
        ) : null}

        {isLoading ? (
          <div className="notifications-loading">
            <LoaderCircle className="size-4 animate-spin" /> Loading notifications
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
          {(Object.keys(groupedRows) as DateBand[]).map((band) =>
            groupedRows[band].length > 0 ? (
              <div key={band} className="notifications-section">
                <div className="notifications-section-label">
                  <span>{band}</span>
                </div>
                {groupedRows[band].map((row) => (
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
                        next.has(row.id) ? next.delete(row.id) : next.add(row.id);
                        return next;
                      })
                    }
                    onToggleExpand={() =>
                      setExpandedIds((prev) => {
                        const next = new Set(prev);
                        next.has(row.id) ? next.delete(row.id) : next.add(row.id);
                        return next;
                      })
                    }
                    onOpen={() => navigate(ticketHref(row))}
                    onDone={() => markRowDone(row)}
                    onSnooze={(date, label) => snoozeRow(row, date, label)}
                    onInvite={(response) => {
                      if (row.type !== "TICKET_INVITATION" || !row.invitationId) return;
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
          <div className="notifications-dialog" role="dialog" aria-modal="true" aria-labelledby="shortcuts-title">
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
              {[
                ["j / k", "Move focus"],
                ["e", "Mark focused done"],
                ["Enter", "Open ticket"],
                ["x", "Toggle selection"],
                ["Shift+I", "Mark all read"],
                ["?", "Show shortcuts"],
              ].map(([key, label]) => (
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
