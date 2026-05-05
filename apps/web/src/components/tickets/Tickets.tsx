import { useEffect, useMemo, useRef, useState, startTransition } from "react";
import { useMutationState, useQueryClient } from "@tanstack/react-query";
import createLogger from "@shared/logger";
import {
  IconLayoutRows,
  IconList,
  IconPlus,
  IconSearch,
} from "@tabler/icons-react";
import { useTicketsPageData } from "../../hooks/useTicketsPageData";
import { useTicketsPageActions } from "../../hooks/useTicketsPageActions";
import { useTeamMembersQuery } from "../../hooks/useTeamsQueries";
import {
  useBulkUpdateMutation,
  useCreateTicketMutation,
  useSaveViewMutation,
  useStatusMutation,
  useUpdateTicketMutation,
} from "../../hooks/useTicketMutations";
import { useTicketDraft } from "../../hooks/useTicketDraft";
import { useAuthState } from "../../stores/useAuthStore";
import { useTicketStore } from "../../stores/useTicketStore";
import { cn } from "../../lib/utils";
import type {
  Density,
  DrawerTab,
  SortField,
  TicketCategory,
  TicketDraft,
  TicketFilters,
  TicketSort,
  TicketStatus,
} from "../../types/tickets";
import {
  DEFAULT_VIEWS,
  FILTERS,
  OVERSCAN,
  PRIORITIES,
  ROW_HEIGHT,
  STATUSES,
  flattenTicketGroups,
  groupTicketRows,
  sortTicketRows,
} from "../../lib/ticketsComponent";
import { BulkBar } from "./BulkBar";
import { CreateTicketModal } from "./CreateTicketModal";
import { HeaderIconButton } from "./HeaderIconButton";
import { TicketDrawer } from "./TicketDrawer";
import { TicketsTable } from "./TicketsTable";
import {
  ticketChip,
  ticketDensityToggle,
  ticketFilterControls,
  ticketFiltersRow,
  ticketPageContent,
  ticketPageFrame,
  ticketPrimaryButton,
  ticketSearchBox,
  ticketTopBar,
  ticketViewTab,
  ticketViewTabIndicator,
  ticketViewTabsList,
  ticketViewTabsRow,
} from "./styles";

const logger = createLogger("Tickets");

export const Tickets = () => {
  const { data, status, url, ui } = useTicketsPageData();
  const actions = useTicketsPageActions();
  const queryClient = useQueryClient();
  const user = useAuthState((s) => s.user);
  const role = user?.role ?? "MODERATOR";
  const isSuperAdmin = role === "SUPER_ADMIN";
  const adminsQuery = useTeamMembersQuery(
    { role: ["SUPER_ADMIN", "ADMIN"], page: 1, pageSize: 100 },
    { enabled: isSuperAdmin },
  );
  const adminOptions = isSuperAdmin
    ? (adminsQuery.data?.rows ?? []).map((m) => ({ id: m.id, name: m.name }))
    : [];
  const density = useTicketStore((s) => s.density);
  const createTicket = useCreateTicketMutation();
  const updateTicket = useUpdateTicketMutation();
  const statusMutation = useStatusMutation();
  const bulkUpdate = useBulkUpdateMutation();
  const saveViewMutation = useSaveViewMutation();
  const draftStorage = useTicketDraft();
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
  const [draftError, setDraftError] = useState("");
  const [draft, setDraft] = useState({
    subject: "",
    description: "",
    category: "",
    priority: "MEDIUM",
  } as TicketDraft);
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
  const visibleColumns = role === "SUPER_ADMIN" ? 11 : 10;
  const drawerOpen = Boolean(url.drawerTicketId && data.detail);

  useEffect(() => {
    if (url.drawerTicketId) {
      logger.info(`Ticket drawer requested for ${url.drawerTicketId}`);
    }
  }, [url.drawerTicketId]);

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
    const saved = draftStorage.load();
    if (saved && !draft.subject && !draft.description && !draft.category) {
      setDraft({
        subject: saved.subject ?? "",
        description: saved.description ?? "",
        category: saved.category ?? "",
        priority: saved.priority ?? "MEDIUM",
      });
    }
    requestAnimationFrame(() => modalSubjectRef.current?.focus());
  }, [draft, draftStorage, url.modalOpen]);

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

  const toggleArrayFilter = <T extends string>(
    key: "status" | "priority" | "category",
    value: T,
  ) => {
    const current = (url.filters[key] ?? []) as T[];
    setFilters({
      [key]: current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    } as Partial<TicketFilters>);
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
      draftStorage.save({
        subject: draft.subject,
        description: draft.description,
        category: draft.category || undefined,
        priority: draft.priority,
        assigneeIds: [],
      });
      setToast("Draft saved");
      window.setTimeout(() => setToast(""), 2_000);
    }
    setDraftError("");
    actions.closeModal();
  };

  const submitDraft = () => {
    if (!draft.subject.trim()) {
      setDraftError("Add a subject before creating the ticket.");
      modalSubjectRef.current?.focus();
      return;
    }
    if (!draft.description.trim()) {
      setDraftError("Add a description so the team knows what to do next.");
      return;
    }
    setDraftError("");
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
          draftStorage.clear();
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

  const saveCurrentView = () => {
    const name = window.prompt("Name this ticket view");
    if (!name?.trim()) return;
    saveViewMutation.mutate(
      {
        name: name.trim(),
        filters: url.filters,
        sort: url.sort.length
          ? url.sort
          : [{ field: "updatedAt", dir: "desc" }],
        groupBy: groupByOrg ? "org" : undefined,
      },
      {
        onSuccess: () => {
          setToast("View saved");
          window.setTimeout(() => setToast(""), 2_000);
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
    <div className={ticketPageFrame}>
      <div className={ticketPageContent}>
        <header className={ticketTopBar}>
          <div className="m-0 font-sans text-xl font-medium leading-none text-foreground">
            Tickets
          </div>
          <label className={ticketSearchBox}>
            <IconSearch className="h-4 w-4 text-muted-foreground" />
            <input
              ref={searchRef}
              name="ticket-search"
              autoComplete="off"
              value={searchValue}
              onChange={(event) => {
                setSearchValue(event.target.value);
                setFilters({ q: event.target.value || undefined });
              }}
              placeholder="Search tickets…"
              className="min-w-0 flex-1 border-0 bg-transparent font-sans text-[13px] leading-none text-foreground outline-none"
            />
            <kbd className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded border border-border font-mono text-[12px] leading-none text-muted-foreground">
              /
            </kbd>
          </label>
          <button
            type="button"
            onClick={actions.openModal}
            className={ticketPrimaryButton}
          >
            <IconPlus className="h-4 w-4" />
            New Ticket
          </button>
        </header>

        <>
          <div className={ticketViewTabsRow}>
            <div className={ticketViewTabsList}>
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
                    className={cn(
                      ticketViewTab,
                      active ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {view.name}
                  </button>
                );
              })}
              <span
                className={ticketViewTabIndicator}
                style={{ transform: `translateX(${tabIndex * 100}%)` }}
              />
              <HeaderIconButton
                label="Save current filters"
                className="h-full flex-[0_0_28px]"
                onClick={saveCurrentView}
              >
                <IconPlus className="h-4 w-4" />
              </HeaderIconButton>
            </div>
          </div>

          <div className={ticketFiltersRow}>
            <div className={ticketFilterControls}>
              {FILTERS.map((filter) => {
                if (filter === "Status") {
                  return STATUSES.map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => toggleArrayFilter("status", status)}
                      className={cn(
                        ticketChip,
                        url.filters.status?.includes(status) &&
                          "border-primary text-primary",
                      )}
                    >
                      {status.replace("_", " ")}
                    </button>
                  ));
                }
                if (filter === "Priority") {
                  return PRIORITIES.map((priority) => (
                    <button
                      key={priority}
                      type="button"
                      onClick={() => toggleArrayFilter("priority", priority)}
                      className={cn(
                        ticketChip,
                        url.filters.priority?.includes(priority) &&
                          "border-primary text-primary",
                      )}
                    >
                      {priority}
                    </button>
                  ));
                }
                if (filter === "Category") {
                  return ["BUG", "FEATURE_REQUEST"].map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() =>
                        toggleArrayFilter(
                          "category",
                          category as TicketCategory,
                        )
                      }
                      className={cn(
                        ticketChip,
                        url.filters.category?.includes(
                          category as TicketCategory,
                        ) && "border-primary text-primary",
                      )}
                    >
                      {category.replace("_", " ")}
                    </button>
                  ));
                }
                if (filter === "Date") {
                  return (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setFilters({ stale: !url.filters.stale })}
                      className={cn(
                        ticketChip,
                        url.filters.stale && "border-primary text-primary",
                      )}
                    >
                      Stale
                    </button>
                  );
                }
                return null;
              })}
              {role === "SUPER_ADMIN" && (
                <button
                  type="button"
                  onClick={() => setGroupByOrg((value) => !value)}
                  className={cn(
                    ticketChip,
                    groupByOrg && "border-primary text-primary",
                  )}
                >
                  Group by Org
                </button>
              )}
            </div>
            <div className={ticketDensityToggle}>
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

          <TicketsTable
            activeSort={activeSort}
            clearFilters={clearFilters}
            clearSelection={actions.clearSelection}
            copiedId={copiedId}
            copyId={copyId}
            drawerOpen={drawerOpen}
            emptyMessage={emptyMessage}
            hasActiveFilters={hasActiveFilters}
            hoveredStatusId={hoveredStatusId}
            hoveredTime={hoveredTime}
            newTicketsBannerCount={ui.newTicketsBannerCount}
            onOpenModal={actions.openModal}
            onRetry={() =>
              queryClient.invalidateQueries({
                queryKey: ["tickets", "list"],
                refetchType: "active",
              })
            }
            onScroll={setVirtualScrollTop}
            openDrawer={actions.openDrawer}
            refreshNewTickets={refreshNewTickets}
            role={role}
            rowHeight={rowHeight}
            density={density as Density}
            secondarySort={secondarySort}
            selectedCount={selectedCount}
            selectedRowIds={ui.selectedRowIds}
            setHoveredStatusId={setHoveredStatusId}
            setHoveredTime={setHoveredTime}
            setSelectedRows={actions.setSelectedRows}
            setSort={setSort}
            sortedRows={sortedRows}
            status={status}
            tableRef={tableRef}
            toggleRowSelected={actions.toggleRowSelected}
            total={data.total}
            totalHeight={totalHeight}
            virtualRows={virtualRows}
            startIndex={startIndex}
            visibleColumns={visibleColumns}
          />
        </>

        {drawerOpen && data.detail && (
          <TicketDrawer
            closeDrawer={actions.closeDrawer}
            descriptionRef={descriptionRef}
            detail={data.detail}
            drawerTab={drawerTab}
            editDescription={editDescription}
            editSubject={editSubject}
            saveDescription={saveDescription}
            saveSubject={saveSubject}
            setDrawerTab={setDrawerTab}
            setEditDescription={setEditDescription}
            setEditSubject={setEditSubject}
            statusMutation={statusMutation}
            subjectRef={subjectRef}
          />
        )}

        {url.modalOpen && (
          <CreateTicketModal
            closeModal={closeModal}
            draft={draft}
            error={draftError}
            isPending={createTicket.isPending}
            modalSubjectRef={modalSubjectRef}
            setDraft={setDraft}
            submitDraft={submitDraft}
          />
        )}

        {selectedCount > 0 && (
          <BulkBar
            clearSelection={actions.clearSelection}
            mutate={bulkUpdate.mutate}
            selectedCount={selectedCount}
            selectedRowIds={ui.selectedRowIds}
            isSuperAdmin={isSuperAdmin}
            admins={adminOptions}
          />
        )}

        {toast && (
          <div className="fixed bottom-[18px] right-[18px] z-[80] animate-in fade-in slide-in-from-right-5 rounded-sm border border-border bg-background px-2.5 py-2 text-[12px] text-muted-foreground shadow-lg duration-200 motion-reduce:animate-none">
            {toast}
          </div>
        )}
        {anyMutationPending && (
          <span className="sr-only">Saving ticket changes</span>
        )}
      </div>
    </div>
  );
};

export default Tickets;
