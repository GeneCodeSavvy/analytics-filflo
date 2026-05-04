import { Inbox, LoaderCircle, Search } from "lucide-react";
import { cn } from "../../lib/utils";
import type { MessageFilters, ThreadListRow } from "../../types/messages";
import { filters } from "../../lib/messagesComponent";
import { ThreadRow } from "./ThreadRow";
import { messageInput, messagePanel } from "./styles";

type ThreadListProps = {
  rows: ThreadListRow[];
  isLoading: boolean;
  activeFilter: MessageFilters["tab"];
  search: string;
  activeThreadId: string | null;
  onFilterChange: (tab: MessageFilters["tab"]) => void;
  onSearchChange: (value: string) => void;
  onSelectThread: (id: string, orgId: string) => void;
};

export function ThreadList({
  rows,
  isLoading,
  activeFilter,
  search,
  activeThreadId,
  onFilterChange,
  onSearchChange,
  onSelectThread,
}: ThreadListProps) {
  return (
    <aside className={`${messagePanel} flex min-h-0 flex-col overflow-hidden`}>
      <header className="border-b border-[--border-default] p-3">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="m-0 text-[15px] font-semibold text-[--ink-1]">
              Ticket inbox
            </h2>
            <p className="mt-0.5 text-[12px] text-[--ink-3]">
              Prioritized by unread and recent activity
            </p>
          </div>
          <span className="rounded-[--radius-sm] border border-[--border-default] bg-[--surface-sunken] px-2 py-1 text-[11px] text-[--ink-2]">
            {rows.length}
          </span>
        </div>
        <label className="flex h-9 items-center gap-2 rounded-[--radius-sm] border border-[--border-default] bg-[--surface-card] px-3 shadow-[--elev-1] focus-within:border-[--border-focus]">
          <Search className="size-4 text-[--ink-3]" />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search threads"
            className={`${messageInput} min-w-0 flex-1`}
          />
        </label>
        <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
          {filters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => onFilterChange(filter.value)}
              className={cn(
                "inline-flex h-[26px] shrink-0 items-center rounded-[--radius-sm] border px-2 text-[12px] transition-colors duration-200",
                activeFilter === filter.value
                  ? "border-[--border-default] bg-[--surface-sunken] text-[--ink-1]"
                  : "border-[--border-default] bg-[--surface-card] text-[--ink-3] hover:border-[--border-strong] hover:bg-[--surface-sunken] hover:text-[--ink-1]",
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex h-40 items-center justify-center gap-2 text-[13px] text-[--ink-3]">
            <LoaderCircle className="size-4 animate-spin" />
            Loading threads
          </div>
        ) : rows.length === 0 ? (
          <div className="grid h-56 place-items-center p-4">
            <div className="text-center">
              <Inbox className="mx-auto size-8 text-[--ink-3]" />
              <p className="mt-3 mb-0 text-[13px] text-[--ink-3]">
                No matching ticket conversations.
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-[--border-default]">
            {rows.map((row) => (
              <ThreadRow
                key={row.id}
                row={row}
                active={row.id === activeThreadId}
                onSelect={() => onSelectThread(row.id, row.ticket.orgId)}
              />
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
