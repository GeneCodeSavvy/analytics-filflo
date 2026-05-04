import type { RefObject } from "react";
import {
  IconAlertCircle,
  IconCheck,
  IconChevronRight,
  IconCopy,
  IconInbox,
} from "@tabler/icons-react";
import type {
  FlatTicketRow,
  SortField,
  TicketRow,
  TicketSort,
} from "../../types/tickets";
import {
  absoluteTime,
  displayId,
  priorityBar,
  relativeTime,
} from "../../lib/ticketsComponent";
import { Assignees } from "./Assignees";
import { Avatar } from "./Avatar";
import { StatusPill } from "./StatusPill";
import { TimeCell } from "./TimeCell";

type TicketsTableProps = {
  activeSort: TicketSort;
  clearFilters: () => void;
  clearSelection: () => void;
  copiedId: string | null;
  copyId: (id: string) => void;
  drawerOpen: boolean;
  emptyMessage: string;
  hasActiveFilters: boolean;
  hoveredStatusId: string | null;
  hoveredTime: string | null;
  newTicketsBannerCount: number;
  onOpenModal: () => void;
  onRetry: () => void;
  onScroll: (scrollTop: number) => void;
  openDrawer: (id: string) => void;
  refreshNewTickets: () => void;
  role: string;
  rowHeight: number;
  secondarySort?: TicketSort;
  selectedCount: number;
  selectedRowIds: string[];
  setHoveredStatusId: (id: string | null) => void;
  setHoveredTime: (id: string | null) => void;
  setSelectedRows: (ids: string[]) => void;
  setSort: (field: SortField, shiftKey: boolean) => void;
  sortedRows: TicketRow[];
  status: {
    loading: boolean;
    error: boolean;
  };
  tableRef: RefObject<HTMLDivElement | null>;
  toggleRowSelected: (id: string) => void;
  total: number;
  totalHeight: number;
  virtualRows: FlatTicketRow[];
  startIndex: number;
  visibleColumns: number;
};

export function TicketsTable({
  activeSort,
  clearFilters,
  clearSelection,
  copiedId,
  copyId,
  drawerOpen,
  emptyMessage,
  hasActiveFilters,
  hoveredStatusId,
  hoveredTime,
  newTicketsBannerCount,
  onOpenModal,
  onRetry,
  onScroll,
  openDrawer,
  refreshNewTickets,
  role,
  rowHeight,
  secondarySort,
  selectedCount,
  selectedRowIds,
  setHoveredStatusId,
  setHoveredTime,
  setSelectedRows,
  setSort,
  sortedRows,
  status,
  tableRef,
  toggleRowSelected,
  total,
  totalHeight,
  virtualRows,
  startIndex,
  visibleColumns,
}: TicketsTableProps) {
  return (
    <main
      className={`tickets-table-region ${drawerOpen ? "tickets-table-compressed" : ""}`}
    >
      {newTicketsBannerCount > 0 && (
        <button
          type="button"
          onClick={refreshNewTickets}
          className="tickets-refresh-ribbon"
        >
          {newTicketsBannerCount} new tickets · refresh
        </button>
      )}

      <div
        className="tickets-table-shell"
        ref={tableRef}
        onScroll={(event) => onScroll(event.currentTarget.scrollTop)}
      >
        <table className="tickets-table">
          <thead>
            <tr>
              <th className="w-[30px]" />
              <th className="w-[34px]">
                <input
                  type="checkbox"
                  checked={
                    selectedCount > 0 && selectedCount === sortedRows.length
                  }
                  onChange={() =>
                    selectedCount === sortedRows.length
                      ? clearSelection()
                      : setSelectedRows(sortedRows.map((row) => row.id))
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
                  className={field === "subject" ? "tickets-subject-col" : ""}
                  onClick={(event) =>
                    ["subject", "status", "updatedAt", "createdAt"].includes(
                      field,
                    ) && setSort(field as SortField, event.shiftKey)
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
                      Something went wrong fetching tickets. Try again in a
                      moment.
                    </div>
                    <button
                      type="button"
                      onClick={onRetry}
                      className="tickets-secondary mt-1"
                    >
                      Retry
                    </button>
                  </div>
                </td>
              </tr>
            )}
            {!status.loading && !status.error && sortedRows.length === 0 && (
              <tr>
                <td colSpan={visibleColumns}>
                  {total === 0 && !hasActiveFilters ? (
                    <div className="tickets-empty-center">
                      <IconInbox className="h-8 w-8 text-muted-foreground" />
                      <div className="text-[16px] font-medium text-foreground">
                        No tickets yet
                      </div>
                      <div className="text-[14px] text-muted-foreground">
                        Tickets are how requests move through your team
                      </div>
                      <button
                        type="button"
                        onClick={onOpenModal}
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
                const selected = selectedRowIds.includes(row.id);
                return (
                  <tr
                    key={row.id}
                    onClick={() => openDrawer(row.id)}
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
                        onChange={() => toggleRowSelected(row.id)}
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
                      onMouseEnter={() => setHoveredTime(`${row.id}-updated`)}
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
  );
}
