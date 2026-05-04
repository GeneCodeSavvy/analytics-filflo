import type { RefObject } from "react";
import {
  IconAlertCircle,
  IconCheck,
  IconChevronRight,
  IconCopy,
  IconInbox,
} from "@tabler/icons-react";
import type {
  Density,
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
import { cn } from "../../lib/utils";
import { Assignees } from "./Assignees";
import { Avatar } from "./Avatar";
import { StatusPill } from "./StatusPill";
import { TimeCell } from "./TimeCell";
import { ticketPrimaryButton, ticketSecondaryButton } from "./styles";

type TicketsTableProps = {
  activeSort: TicketSort;
  clearFilters: () => void;
  clearSelection: () => void;
  copiedId: string | null;
  copyId: (id: string) => void;
  drawerOpen: boolean;
  density: Density;
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
    error: Error | null;
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
  density,
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
      className={cn(
        "relative flex min-h-0 flex-1 transition-[padding-right] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none",
        drawerOpen && "pr-[min(560px,calc(100%_-_382px))] max-[760px]:pr-0",
      )}
    >
      {newTicketsBannerCount > 0 && (
        <button
          type="button"
          onClick={refreshNewTickets}
          className="absolute left-0 top-0 z-20 h-8 w-full bg-[color-mix(in_oklch,var(--primary)_8%,var(--background))] text-[13px] font-medium text-primary"
        >
          {newTicketsBannerCount} new tickets · refresh
        </button>
      )}

      <div
        className="w-full min-w-0 overflow-auto"
        ref={tableRef}
        onScroll={(event) => onScroll(event.currentTarget.scrollTop)}
      >
        <table className="relative w-full min-w-[920px] table-fixed border-collapse [&_tbody_td]:overflow-hidden [&_tbody_td]:px-2 [&_tbody_td]:align-middle [&_tbody_td]:text-[13px] [&_thead_th]:h-8 [&_thead_th]:select-none [&_thead_th]:px-2 [&_thead_th]:text-left [&_thead_th]:text-[11px] [&_thead_th]:font-medium [&_thead_th]:uppercase [&_thead_th]:tracking-[0.04em] [&_thead_th]:text-muted-foreground">
          <thead className="sticky top-0 z-10 h-8 bg-background shadow-[inset_0_-1px_var(--border)]">
            <tr className="table w-full table-fixed">
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
                  className={cn(field === "subject" && "w-auto")}
                  onClick={(event) =>
                    ["subject", "status", "updatedAt", "createdAt"].includes(
                      field,
                    ) && setSort(field as SortField, event.shiftKey)
                  }
                >
                  {label}
                  {activeSort.field === field && (
                    <span className="ml-1 text-[9px] text-primary">
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
          <tbody className="relative block" style={{ height: totalHeight }}>
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
                  <div className="flex min-h-[320px] flex-col items-center justify-center gap-[7px] text-center">
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
                      className={`${ticketSecondaryButton} mt-1`}
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
                    <div className="flex min-h-[360px] flex-col items-center justify-center gap-2">
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
                        className={`${ticketPrimaryButton} mt-2`}
                      >
                        Create your first ticket
                      </button>
                    </div>
                  ) : hasActiveFilters ? (
                    <div className="flex items-center gap-2 px-4 py-[18px] text-[13px] text-muted-foreground [&_button]:text-primary">
                      No tickets match these filters{" "}
                      <button type="button" onClick={clearFilters}>
                        Clear filters
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-4 py-[18px] text-[13px] text-muted-foreground [&_button]:text-primary">
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
                      className="absolute left-0 table w-full table-fixed border-b border-border bg-[color-mix(in_oklch,var(--muted)_30%,transparent)] font-mono text-[12px] leading-7 text-muted-foreground transition-[height,background] duration-200 ease-[ease] motion-reduce:transition-none"
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
                    className={cn(
                      "group/row absolute left-0 table w-full table-fixed cursor-pointer border-b border-border transition-[height,background] duration-200 ease-[ease] hover:bg-[color-mix(in_oklch,var(--muted)_40%,transparent)] motion-reduce:transition-none",
                      selected &&
                        "bg-[color-mix(in_oklch,var(--muted)_40%,transparent)]",
                    )}
                    style={{
                      transform: `translateY(${top}px)`,
                      height: rowHeight,
                    }}
                  >
                    <td className="w-[30px] p-0">
                      <span
                        className={cn(
                          "block h-full w-0.5 cursor-default",
                          priorityBar(row.priority),
                        )}
                      />
                    </td>
                    <td onClick={(event) => event.stopPropagation()}>
                      <input
                        className={cn(
                          "opacity-0 transition-opacity duration-75 group-hover/row:opacity-100 motion-reduce:transition-none",
                          selected && "opacity-100",
                        )}
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
                        className={cn(
                          "flex w-full items-center justify-between gap-1.5 overflow-hidden font-mono text-[12px] leading-none text-muted-foreground transition-colors duration-200",
                          copiedId === row.id && "text-primary",
                        )}
                      >
                        {displayId(row.id)}
                        <IconCopy className="h-3.5 w-3.5 opacity-0 group-hover/row:opacity-100" />
                      </button>
                    </td>
                    <td className="w-auto overflow-hidden px-2 align-middle text-[13px]">
                      <div className="truncate text-[14px] font-medium text-foreground">
                        {row.subject}
                      </div>
                      <div
                        className={cn(
                          "overflow-hidden truncate text-[13px] font-normal leading-[18px] text-muted-foreground",
                          density === "compact" && "hidden",
                        )}
                      >
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
                    <td className="absolute right-4 top-1/2 w-4 -translate-y-1/2 p-0 text-muted-foreground opacity-0 transition-opacity duration-75 group-hover/row:opacity-100 motion-reduce:transition-none">
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
