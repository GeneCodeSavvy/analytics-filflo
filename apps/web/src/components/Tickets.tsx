import { useEffect, useMemo, useRef, useState, startTransition } from "react";
import { useMutationState, useQueryClient } from "@tanstack/react-query";
import {
  IconCheck,
  IconAlertCircle,
  IconChevronDown,
  IconChevronRight,
  IconCopy,
  IconDots,
  IconInbox,
  IconLayoutRows,
  IconList,
  IconMaximize,
  IconPlus,
  IconSearch,
  IconX,
} from "@tabler/icons-react";
import { useTicketsPageData } from "../hooks/useTicketsPageData";
import { useTicketsPageActions } from "../hooks/useTicketsPageActions";
import {
  useBulkUpdateMutation,
  useCreateTicketMutation,
  useStatusMutation,
  useUpdateTicketMutation,
} from "../hooks/useTicketMutations";
import { useAuthState } from "../stores/useAuthStore";
import { useTicketStore } from "../stores/useTicketStore";
import type {
  ActivityEntry,
  TicketCategory,
  TicketFilters,
  TicketPriority,
  TicketRow,
  TicketSort,
  TicketStatus,
  UserRef,
  Density,
  DrawerTab,
  SortField,
} from "../types/tickets";
import {
  CATEGORIES,
  DEFAULT_VIEWS,
  FILTERS,
  OVERSCAN,
  PRIORITIES,
  ROW_HEIGHT,
  STATUSES,
  absoluteTime,
  displayId,
  flattenTicketGroups,
  groupTicketRows,
  initials,
  priorityBar,
  relativeTime,
  sortTicketRows,
  statusClass,
  uniqueAssignees,
} from "../lib/ticketsComponent";

function HeaderIconButton({
  label,
  children,
  onClick,
  active = false,
}: {
  label: string;
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`tickets-icon-button ${active ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}
    >
      {children}
    </button>
  );
}

function StatusPill({
  status,
  pulse = false,
}: {
  status: string;
  pulse?: boolean;
}) {
  return (
    <span
      className={`tickets-status ${statusClass(status)} ${pulse ? "tickets-status-pulse" : ""}`}
    >
      {status.replace("_", " ")}
    </span>
  );
}

function Avatar({
  user,
  className = "",
}: {
  user?: Partial<UserRef> | null;
  className?: string;
}) {
  const name = user?.name ?? "Unassigned";
  return user?.avatarUrl ? (
    <img
      src={user.avatarUrl}
      alt=""
      className={`tickets-avatar ${className}`}
    />
  ) : (
    <span className={`tickets-avatar tickets-avatar-fallback ${className}`}>
      {initials(name)}
    </span>
  );
}

function Assignees({ row }: { row: TicketRow }) {
  const assignees = uniqueAssignees(row);
  const visible = assignees.slice(0, 3);
  const hidden = Math.max(row.assigneeCount - visible.length, 0);

  return (
    <div className="group/assignees relative flex h-6 items-center">
      {visible.length === 0 ? (
        <span className="text-[12px] text-muted-foreground">None</span>
      ) : (
        visible.map((user, index) => (
          <Avatar
            key={user.id}
            user={user}
            className={index > 0 ? "-ml-2" : ""}
          />
        ))
      )}
      {hidden > 0 && <span className="tickets-plus-chip">+{hidden}</span>}
      {assignees.length > 0 && (
        <div className="tickets-popover pointer-events-none absolute right-0 top-7 z-30 min-w-44 opacity-0 group-hover/assignees:opacity-100">
          {assignees.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-2 whitespace-nowrap px-2 py-1.5 text-[12px]"
            >
              <Avatar user={user} />
              <span>{user.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TimeCell({
  value,
  muted = false,
}: {
  value: string;
  muted?: boolean;
}) {
  const [absolute, setAbsolute] = useState(false);
  return (
    <span
      onMouseEnter={() => setAbsolute(true)}
      onMouseLeave={() => setAbsolute(false)}
      className={`font-mono text-[12px] ${muted ? "text-muted-foreground" : "text-foreground"}`}
    >
      {absolute ? absoluteTime(value) : relativeTime(value)}
    </span>
  );
}

function UserTicketList({
  rows,
  onOpen,
}: {
  rows: TicketRow[];
  onOpen: (id: string) => void;
}) {
  return (
    <div className="flex flex-1 justify-center overflow-auto border-t border-border bg-background px-4 py-6">
      <div className="flex w-full max-w-[480px] flex-col gap-2">
        {rows.map((row) => (
          <button
            key={row.id}
            type="button"
            onClick={() => onOpen(row.id)}
            className="h-24 rounded-sm border border-border bg-background p-3 text-left hover:bg-muted/40"
          >
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="font-mono text-[12px] text-muted-foreground">
                {displayId(row.id)}
              </span>
              <StatusPill status={row.status} />
            </div>
            <div className="truncate text-[16px] font-medium text-foreground">
              {row.subject}
            </div>
            <div className="mt-2 font-mono text-[12px] text-muted-foreground">
              {relativeTime(row.updatedAt)}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export const Tickets = () => {
  const { data, status, url, ui } = useTicketsPageData();
  const actions = useTicketsPageActions();
  const queryClient = useQueryClient();
  const user = useAuthState((s) => s.user);
  const role = user?.role ?? "MODERATOR";
  const density = useTicketStore((s) => s.density);
  const createTicket = useCreateTicketMutation();
  const updateTicket = useUpdateTicketMutation();
  const statusMutation = useStatusMutation();
  const bulkUpdate = useBulkUpdateMutation();
  const anyMutationPending = useMutationState({
    filters: { status: "pending" },
  }).some(Boolean);

  const [searchValue, setSearchValue] = useState(url.filters.q ?? "");
  const [tabIndex, setTabIndex] = useState(0);
  const [drawerTab, setDrawerTab] = useState<DrawerTab>("Details");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [hoveredStatusId, setHoveredStatusId] = useState<string | null>(null);
  const [hoveredTime, setHoveredTime] = useState<string | null>(null);
  const [groupByOrg, setGroupByOrg] = useState(false);
  const [toast, setToast] = useState("");
  const [draft, setDraft] = useState({
    subject: "",
    description: "",
    category: "" as TicketCategory | "",
    priority: "MEDIUM" as TicketPriority,
  });
  const [editSubject, setEditSubject] = useState(false);
  const [editDescription, setEditDescription] = useState(false);
  const [virtualScrollTop, setVirtualScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(600);
  const tableRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const subjectRef = useRef<HTMLInputElement | null>(null);
  const descriptionRef = useRef<HTMLTextAreaElement | null>(null);
  const modalSubjectRef = useRef<HTMLInputElement | null>(null);

  const rowHeight = ROW_HEIGHT[density as Density];
  const activeSort = url.sort[0] ?? {
    field: "updatedAt" as SortField,
    dir: "desc" as const,
  };
  const secondarySort = url.sort[1];
  const selectedCount = ui.selectedRowIds.length;
  const visibleColumns = role === "SUPER_ADMIN" ? 9 : 8;
  const drawerOpen = Boolean(url.drawerTicketId && data.detail);

  const activeViews = useMemo(() => {
    const serverViews = data.views.map((view) => ({
      id: view.id,
      name: view.name,
    }));
    return [
      ...DEFAULT_VIEWS,
      ...serverViews.filter(
        (view) => !DEFAULT_VIEWS.some((item) => item.name === view.name),
      ),
    ];
  }, [data.views]);

  const sortedRows = useMemo(() => {
    return sortTicketRows(data.rows, url.sort);
  }, [data.rows, url.sort]);

  const groupedRows = useMemo(() => {
    return groupTicketRows(sortedRows, groupByOrg, role);
  }, [groupByOrg, role, sortedRows]);

  const flatRows = useMemo(
    () => flattenTicketGroups(groupedRows),
    [groupedRows],
  );
  const totalHeight = flatRows.length * rowHeight;
  const startIndex = Math.max(
    0,
    Math.floor(virtualScrollTop / rowHeight) - OVERSCAN,
  );
  const endIndex = Math.min(
    flatRows.length,
    Math.ceil((virtualScrollTop + viewportHeight) / rowHeight) + OVERSCAN,
  );
  const virtualRows = flatRows.slice(startIndex, endIndex);

  const currentIndex = sortedRows.findIndex(
    (row) => row.id === url.drawerTicketId,
  );
  const hasActiveFilters = Boolean(
    url.filters.q ||
    url.filters.stale ||
    url.filters.status?.length ||
    url.filters.priority?.length ||
    url.filters.category?.length ||
    url.filters.assigneeIds?.length ||
    url.filters.orgIds?.length,
  );

  useEffect(() => setSearchValue(url.filters.q ?? ""), [url.filters.q]);
  useEffect(() => {
    const node = tableRef.current;
    if (!node) return;
    const resize = () => setViewportHeight(node.clientHeight);
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!url.modalOpen) return;
    const saved = localStorage.getItem("ticket-create-draft");
    if (saved && !draft.subject && !draft.description && !draft.category) {
      try {
        setDraft(JSON.parse(saved) as typeof draft);
      } catch {
        localStorage.removeItem("ticket-create-draft");
      }
    }
    requestAnimationFrame(() => modalSubjectRef.current?.focus());
  }, [url.modalOpen]);

  useEffect(() => {
    if (editSubject) requestAnimationFrame(() => subjectRef.current?.focus());
  }, [editSubject]);

  useEffect(() => {
    if (editDescription)
      requestAnimationFrame(() => descriptionRef.current?.focus());
  }, [editDescription]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;
      if (event.key === "/" && !typing) {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (event.key === "c" && !typing) {
        event.preventDefault();
        actions.openModal();
      }
      if (event.key === "Escape") {
        if (url.modalOpen) closeModal();
        else if (drawerOpen) actions.closeDrawer();
      }
      if (!drawerOpen || typing) return;
      if (event.key === "j" || event.key === "k") {
        event.preventDefault();
        const next =
          event.key === "j"
            ? sortedRows[currentIndex + 1]
            : sortedRows[currentIndex - 1];
        if (next) actions.openDrawer(next.id);
      }
      if (event.key === "e") {
        event.preventDefault();
        setDrawerTab("Details");
        setEditDescription(true);
      }
      if (event.key === "s" && data.detail) {
        event.preventDefault();
        const index = STATUSES.indexOf(data.detail.status as TicketStatus);
        statusMutation.mutate({
          id: data.detail.id,
          status: STATUSES[(index + 1) % STATUSES.length],
        });
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    actions,
    currentIndex,
    data.detail,
    drawerOpen,
    sortedRows,
    statusMutation,
    url.modalOpen,
  ]);

  const setFilters = (patch: Partial<TicketFilters>) => {
    startTransition(() => actions.setFilters(patch));
  };

  const clearFilters = () =>
    setFilters({
      status: [],
      priority: [],
      category: [],
      assigneeIds: [],
      orgIds: [],
      q: undefined,
      stale: undefined,
    });

  const setSort = (field: SortField, shiftKey: boolean) => {
    const current = url.sort.length
      ? url.sort
      : ([{ field: "updatedAt", dir: "desc" }] as TicketSort[]);
    const existing = current.find((sort) => sort.field === field);
    const nextDir: TicketSort["dir"] = existing?.dir === "asc" ? "desc" : "asc";
    const next: TicketSort[] = shiftKey
      ? [{ ...current[0] }, { field, dir: nextDir }]
          .filter(
            (sort, index, list) =>
              list.findIndex((item) => item.field === sort.field) === index,
          )
          .slice(0, 2)
      : [{ field, dir: nextDir }];
    startTransition(() => actions.setSort(next));
  };

  const copyId = async (id: string) => {
    await navigator.clipboard?.writeText(id);
    setCopiedId(id);
    window.setTimeout(() => setCopiedId(null), 240);
  };

  const closeModal = () => {
    if (draft.subject || draft.description || draft.category) {
      localStorage.setItem("ticket-create-draft", JSON.stringify(draft));
      setToast("Draft saved");
      window.setTimeout(() => setToast(""), 2_000);
    }
    actions.closeModal();
  };

  const submitDraft = () => {
    if (!draft.subject.trim() || !draft.description.trim()) return;
    createTicket.mutate(
      {
        subject: draft.subject,
        description: draft.description,
        category: draft.category || undefined,
        priority: draft.priority,
        assigneeIds: [],
      },
      {
        onSuccess: () => {
          localStorage.removeItem("ticket-create-draft");
          setDraft({
            subject: "",
            description: "",
            category: "",
            priority: "MEDIUM",
          });
          actions.closeModal();
        },
      },
    );
  };

  const saveSubject = (value: string) => {
    if (!data.detail || !value.trim() || value === data.detail.subject)
      return setEditSubject(false);
    updateTicket.mutate({
      id: data.detail.id,
      patch: { subject: value.trim() },
    });
    setEditSubject(false);
  };

  const saveDescription = (value: string) => {
    if (!data.detail || !value.trim() || value === data.detail.description)
      return setEditDescription(false);
    updateTicket.mutate({
      id: data.detail.id,
      patch: { description: value.trim() },
    });
    setEditDescription(false);
  };

  const refreshNewTickets = () => {
    queryClient.invalidateQueries({
      queryKey: ["tickets", "list"],
      refetchType: "active",
    });
    queryClient.invalidateQueries({
      queryKey: ["tickets", "since"],
      refetchType: "active",
    });
  };

  const emptyMessage =
    url.viewId === "awaiting-review"
      ? "Nothing's waiting on you - nice work."
      : url.viewId === "high-priority"
        ? "No high-priority tickets open right now."
        : url.viewId === "stale"
          ? "Nothing's gone stale. Keep it up."
          : "No tickets in this view.";

  return (
    <div className="app-page-frame tickets-page">
      <div className="app-page-frame-content tickets-page-content">
        <header className="tickets-header">
          <div className="tickets-title">Tickets</div>
          <label className="tickets-search">
            <IconSearch className="h-4 w-4 text-muted-foreground" />
            <input
              ref={searchRef}
              value={searchValue}
              onChange={(event) => {
                setSearchValue(event.target.value);
                setFilters({ q: event.target.value || undefined });
              }}
              placeholder="Search tickets"
            />
            <kbd>/</kbd>
          </label>
          <button
            type="button"
            onClick={actions.openModal}
            className="tickets-primary"
          >
            <IconPlus className="h-4 w-4" />
            New ticket
          </button>
        </header>

        {role === "USER" ? (
          <UserTicketList rows={sortedRows} onOpen={actions.openDrawer} />
        ) : (
          <>
            <div className="tickets-tabs">
              <div className="tickets-view-tabs">
                {activeViews.map((view, index) => {
                  const active =
                    url.viewId === view.id || (!url.viewId && view.id === null);
                  return (
                    <button
                      key={view.id ?? "all"}
                      type="button"
                      onClick={() => {
                        setTabIndex(index);
                        actions.setView(view.id);
                      }}
                      className={`tickets-view-tab ${active ? "text-foreground" : "text-muted-foreground"}`}
                    >
                      {view.name}
                    </button>
                  );
                })}
                <span
                  className="tickets-tab-underline"
                  style={{ transform: `translateX(${tabIndex * 100}%)` }}
                />
                <HeaderIconButton label="Save current filters">
                  <IconPlus className="h-4 w-4" />
                </HeaderIconButton>
              </div>
              <div className="ml-auto flex shrink-0 items-center gap-1.5">
                {FILTERS.map((filter) => (
                  <button key={filter} type="button" className="tickets-chip">
                    {filter}
                    <IconChevronDown className="h-3 w-3" />
                  </button>
                ))}
                {role === "SUPER_ADMIN" && (
                  <button
                    type="button"
                    onClick={() => setGroupByOrg((value) => !value)}
                    className={`tickets-chip ${groupByOrg ? "border-primary text-primary" : ""}`}
                  >
                    Group by Org
                  </button>
                )}
                <div className="tickets-density">
                  <HeaderIconButton
                    label="Compact rows"
                    active={density === "compact"}
                    onClick={() => actions.setDensity("compact")}
                  >
                    <IconList className="h-4 w-4" />
                  </HeaderIconButton>
                  <HeaderIconButton
                    label="Comfortable rows"
                    active={density === "comfortable"}
                    onClick={() => actions.setDensity("comfortable")}
                  >
                    <IconLayoutRows className="h-4 w-4" />
                  </HeaderIconButton>
                </div>
              </div>
            </div>

            <main
              className={`tickets-table-region ${drawerOpen ? "tickets-table-compressed" : ""}`}
            >
              {ui.newTicketsBannerCount > 0 && (
                <button
                  type="button"
                  onClick={refreshNewTickets}
                  className="tickets-refresh-ribbon"
                >
                  {ui.newTicketsBannerCount} new tickets · refresh
                </button>
              )}

              <div
                className="tickets-table-shell"
                ref={tableRef}
                onScroll={(event) =>
                  setVirtualScrollTop(event.currentTarget.scrollTop)
                }
              >
                <table className="tickets-table">
                  <thead>
                    <tr>
                      <th className="w-[30px]" />
                      <th className="w-[34px]">
                        <input
                          type="checkbox"
                          checked={
                            selectedCount > 0 &&
                            selectedCount === sortedRows.length
                          }
                          onChange={() =>
                            selectedCount === sortedRows.length
                              ? actions.clearSelection()
                              : actions.setSelectedRows(
                                  sortedRows.map((row) => row.id),
                                )
                          }
                        />
                      </th>
                      {[
                        ["id", "ID"],
                        ["subject", "Subject"],
                        ["status", "Status"],
                        ["category", "Category"],
                        ...(role === "SUPER_ADMIN" ? [["org", "Org"]] : []),
                        [
                          role === "ADMIN" ? "requester" : "assignees",
                          role === "ADMIN" ? "Requester" : "Assignees",
                        ],
                        ["updatedAt", "Updated"],
                        ["createdAt", "Created"],
                      ].map(([field, label]) => (
                        <th
                          key={field}
                          className={
                            field === "subject" ? "tickets-subject-col" : ""
                          }
                          onClick={(event) =>
                            [
                              "subject",
                              "status",
                              "updatedAt",
                              "createdAt",
                            ].includes(field) &&
                            setSort(field as SortField, event.shiftKey)
                          }
                        >
                          {label}
                          {activeSort.field === field && (
                            <span className="tickets-sort">
                              {activeSort.dir === "asc" ? "▲" : "▼"}
                            </span>
                          )}
                          {secondarySort?.field === field && (
                            <sup className="text-primary">2</sup>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody style={{ height: totalHeight }}>
                    {status.loading && (
                      <tr>
                        <td
                          colSpan={visibleColumns}
                          className="h-32 text-center text-sm text-muted-foreground"
                        >
                          Loading tickets...
                        </td>
                      </tr>
                    )}
                    {status.error && (
                      <tr>
                        <td colSpan={visibleColumns}>
                          <div className="tickets-error-state">
                            <IconAlertCircle className="h-6 w-6 text-destructive" />
                            <div className="text-[16px] font-medium text-foreground">
                              Couldn't load tickets
                            </div>
                            <div className="text-[13px] text-muted-foreground">
                              Something went wrong fetching tickets. Try again
                              in a moment.
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                queryClient.invalidateQueries({
                                  queryKey: ["tickets", "list"],
                                  refetchType: "active",
                                })
                              }
                              className="tickets-secondary mt-1"
                            >
                              Retry
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                    {!status.loading &&
                      !status.error &&
                      sortedRows.length === 0 && (
                        <tr>
                          <td colSpan={visibleColumns}>
                            {data.total === 0 && !hasActiveFilters ? (
                              <div className="tickets-empty-center">
                                <IconInbox className="h-8 w-8 text-muted-foreground" />
                                <div className="text-[16px] font-medium text-foreground">
                                  No tickets yet
                                </div>
                                <div className="text-[14px] text-muted-foreground">
                                  Tickets are how requests move through your
                                  team
                                </div>
                                <button
                                  type="button"
                                  onClick={actions.openModal}
                                  className="tickets-primary mt-2"
                                >
                                  Create your first ticket
                                </button>
                              </div>
                            ) : hasActiveFilters ? (
                              <div className="tickets-empty-filter">
                                No tickets match these filters{" "}
                                <button type="button" onClick={clearFilters}>
                                  Clear filters
                                </button>
                              </div>
                            ) : (
                              <div className="tickets-empty-filter">
                                <IconCheck className="h-4 w-4" /> {emptyMessage}
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    {!status.loading &&
                      !status.error &&
                      virtualRows.map((item, virtualIndex) => {
                        const top = (startIndex + virtualIndex) * rowHeight;
                        if (item.kind === "group") {
                          return (
                            <tr
                              key={item.id}
                              className="tickets-virtual-row tickets-org-row"
                              style={{
                                transform: `translateY(${top}px)`,
                                height: 28,
                              }}
                            >
                              <td colSpan={visibleColumns}>
                                {item.group.org} · {item.group.rows.length}
                              </td>
                            </tr>
                          );
                        }
                        const row = item.row;
                        const selected = ui.selectedRowIds.includes(row.id);
                        return (
                          <tr
                            key={row.id}
                            onClick={() => actions.openDrawer(row.id)}
                            className={`tickets-virtual-row tickets-row ${selected ? "tickets-row-selected" : ""}`}
                            style={{
                              transform: `translateY(${top}px)`,
                              height: rowHeight,
                            }}
                          >
                            <td className="w-[30px] p-0">
                              <span
                                className={`tickets-priority ${priorityBar(row.priority)}`}
                              />
                            </td>
                            <td onClick={(event) => event.stopPropagation()}>
                              <input
                                className="tickets-row-check"
                                type="checkbox"
                                checked={selected}
                                onChange={() =>
                                  actions.toggleRowSelected(row.id)
                                }
                              />
                            </td>
                            <td className="w-[110px]">
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  copyId(row.id);
                                }}
                                className={`tickets-id ${copiedId === row.id ? "text-primary" : ""}`}
                              >
                                {displayId(row.id)}
                                <IconCopy className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100" />
                              </button>
                            </td>
                            <td className="tickets-subject-col">
                              <div className="truncate text-[14px] font-medium text-foreground">
                                {row.subject}
                              </div>
                              <div className="tickets-preview">
                                {row.descriptionPreview.slice(0, 80)}
                              </div>
                            </td>
                            <td
                              onMouseEnter={() => setHoveredStatusId(row.id)}
                              onMouseLeave={() => setHoveredStatusId(null)}
                            >
                              <StatusPill
                                status={row.status}
                                pulse={hoveredStatusId === row.id}
                              />
                            </td>
                            <td className="w-[120px] truncate text-muted-foreground">
                              {row.category ?? "Uncategorized"}
                            </td>
                            {role === "SUPER_ADMIN" && (
                              <td className="w-[120px] truncate text-muted-foreground">
                                {row.org.name}
                              </td>
                            )}
                            <td className="w-[84px]">
                              {role === "ADMIN" ? (
                                <div className="flex items-center gap-2">
                                  <Avatar user={row.requester} />
                                  <span className="truncate text-[12px]">
                                    {row.requester.name}
                                  </span>
                                </div>
                              ) : (
                                <Assignees row={row} />
                              )}
                            </td>
                            <td
                              className="w-[90px]"
                              onMouseEnter={() =>
                                setHoveredTime(`${row.id}-updated`)
                              }
                              onMouseLeave={() => setHoveredTime(null)}
                            >
                              <span className="font-mono text-[12px]">
                                {hoveredTime === `${row.id}-updated`
                                  ? absoluteTime(row.updatedAt)
                                  : relativeTime(row.updatedAt)}
                              </span>
                            </td>
                            <td className="w-[90px]">
                              <TimeCell value={row.createdAt} muted />
                            </td>
                            <td className="tickets-row-chevron">
                              <IconChevronRight className="h-4 w-4" />
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </main>
          </>
        )}

        {drawerOpen && data.detail && (
          <aside className="tickets-drawer">
            <div className="tickets-drawer-top">
              <button type="button" title="Close" onClick={actions.closeDrawer}>
                <IconX className="h-4 w-4" />
              </button>
              <span className="font-mono text-muted-foreground">
                {displayId(data.detail.id)}
              </span>
              <IconChevronRight className="h-4 w-4 text-muted-foreground" />
              <span className="truncate">{data.detail.subject}</span>
              <div className="ml-auto flex items-center gap-1">
                <button type="button" title="Open full page">
                  <IconMaximize className="h-4 w-4" />
                </button>
                <button type="button" title="More">
                  <IconDots className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-5">
              {editSubject ? (
                <input
                  ref={subjectRef}
                  defaultValue={data.detail.subject}
                  onBlur={(event) => saveSubject(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter")
                      saveSubject(event.currentTarget.value);
                    if (event.key === "Escape") setEditSubject(false);
                  }}
                  className="tickets-title-input"
                />
              ) : (
                <h2
                  onClick={() => setEditSubject(true)}
                  className="tickets-drawer-title"
                >
                  {data.detail.subject}
                </h2>
              )}
              <div className="tickets-meta">
                <button
                  type="button"
                  onClick={() =>
                    data.detail &&
                    statusMutation.mutate({
                      id: data.detail.id,
                      status: "REVIEW",
                    })
                  }
                >
                  <StatusPill status={data.detail.status} />
                </button>
                <button type="button" className="tickets-priority-chip">
                  {data.detail.priority}
                </button>
                <Assignees row={data.detail} />
                <span className="font-mono text-[12px] text-muted-foreground">
                  Created {relativeTime(data.detail.createdAt)}
                </span>
                <span className="font-mono text-[12px] text-muted-foreground">
                  Updated {relativeTime(data.detail.updatedAt)}
                </span>
              </div>
              <div className="tickets-drawer-tabs">
                {(["Details", "Activity", "Messages"] as DrawerTab[]).map(
                  (tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setDrawerTab(tab)}
                      className={
                        drawerTab === tab
                          ? "text-foreground"
                          : "text-muted-foreground"
                      }
                    >
                      {tab}
                    </button>
                  ),
                )}
                <span
                  style={{
                    transform: `translateX(${(["Details", "Activity", "Messages"] as DrawerTab[]).indexOf(drawerTab) * 100}%)`,
                  }}
                />
              </div>
              {drawerTab === "Details" && (
                <div className="space-y-4 pt-4">
                  {editDescription ? (
                    <textarea
                      ref={descriptionRef}
                      defaultValue={data.detail.description}
                      onBlur={(event) => saveDescription(event.target.value)}
                      onKeyDown={(event) => {
                        if (
                          (event.metaKey || event.ctrlKey) &&
                          event.key === "Enter"
                        )
                          saveDescription(event.currentTarget.value);
                        if (event.key === "Escape") setEditDescription(false);
                      }}
                      className="tickets-description-input"
                    />
                  ) : (
                    <div
                      onClick={() => setEditDescription(true)}
                      className="tickets-editable"
                    >
                      {data.detail.description ||
                        data.detail.descriptionPreview}
                    </div>
                  )}
                  <div className="tickets-editable text-sm text-muted-foreground">
                    Category: {data.detail.category ?? "Uncategorized"}
                  </div>
                </div>
              )}
              {drawerTab === "Activity" && (
                <ActivityList activity={data.detail.activity} />
              )}
              {drawerTab === "Messages" && (
                <div className="pt-4 text-sm text-muted-foreground">
                  No messages attached to this ticket.
                </div>
              )}
            </div>
          </aside>
        )}

        {url.modalOpen && (
          <div
            className="tickets-modal-backdrop"
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === "Enter")
                submitDraft();
            }}
          >
            <form
              className="tickets-modal"
              onSubmit={(event) => {
                event.preventDefault();
                submitDraft();
              }}
            >
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <h2 className="m-0 text-[16px] font-medium text-foreground">
                  New ticket
                </h2>
                <button type="button" title="Close" onClick={closeModal}>
                  <IconX className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-3 p-4">
                <input
                  ref={modalSubjectRef}
                  value={draft.subject}
                  onChange={(event) =>
                    setDraft((value) => ({
                      ...value,
                      subject: event.target.value,
                    }))
                  }
                  placeholder="Subject"
                  className="tickets-form-input text-[18px]"
                />
                <textarea
                  value={draft.description}
                  onChange={(event) =>
                    setDraft((value) => ({
                      ...value,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Description"
                  className="tickets-form-input min-h-32 resize-none"
                />
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={draft.category}
                    onChange={(event) =>
                      setDraft((value) => ({
                        ...value,
                        category: event.target.value as TicketCategory | "",
                      }))
                    }
                    className="tickets-form-input"
                  >
                    <option value="">Category</option>
                    {CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                  <select
                    value={draft.priority}
                    onChange={(event) =>
                      setDraft((value) => ({
                        ...value,
                        priority: event.target.value as TicketPriority,
                      }))
                    }
                    className="tickets-form-input"
                  >
                    {PRIORITIES.map((priority) => (
                      <option key={priority}>{priority}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 border-t border-border px-4 py-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="tickets-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createTicket.isPending}
                  className="tickets-primary"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        )}

        {selectedCount > 0 && (
          <div className="tickets-bulk-bar">
            <span className="font-mono text-[13px]">
              {selectedCount} selected
            </span>
            <div className="ml-auto flex items-center gap-1">
              {role !== "USER" && <button type="button">Assign</button>}
              <button
                type="button"
                onClick={() =>
                  bulkUpdate.mutate({
                    ids: ui.selectedRowIds,
                    status: "REVIEW",
                  })
                }
              >
                Status
              </button>
              <button
                type="button"
                onClick={() =>
                  bulkUpdate.mutate({
                    ids: ui.selectedRowIds,
                    priority: "HIGH",
                  })
                }
              >
                Priority
              </button>
              <button
                type="button"
                onClick={() =>
                  bulkUpdate.mutate({
                    ids: ui.selectedRowIds,
                    status: "CLOSED" as TicketStatus,
                  })
                }
              >
                Close ticket
              </button>
              <span className="h-5 w-px bg-border" />
              <button type="button" onClick={actions.clearSelection}>
                Clear selection
              </button>
            </div>
          </div>
        )}

        {toast && <div className="tickets-toast">{toast}</div>}
        {anyMutationPending && (
          <span className="sr-only">Saving ticket changes</span>
        )}
      </div>
    </div>
  );
};

function ActivityList({ activity }: { activity: ActivityEntry[] }) {
  if (activity.length === 0)
    return (
      <div className="pt-4 text-sm text-muted-foreground">No activity yet.</div>
    );
  return (
    <div className="tickets-activity">
      {activity.map((item) => {
        const change = item.changes ? Object.entries(item.changes)[0] : null;
        const verb =
          item.type === "created"
            ? "created"
            : item.type === "status_change"
              ? "changed status to"
              : item.type === "assignee_change"
                ? "assigned"
                : item.type.replace("_", " ");
        const object = change?.[1]?.to ?? item.comment ?? "ticket";
        return (
          <div key={item.id} className="tickets-activity-item">
            <span className="text-foreground">{item.actor.name}</span>{" "}
            <span className="text-muted-foreground">{verb}</span>{" "}
            <span className="text-foreground">{object}</span>{" "}
            <span className="text-muted-foreground">
              · {relativeTime(item.createdAt)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default Tickets;
