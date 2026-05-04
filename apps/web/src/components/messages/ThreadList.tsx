import { Inbox, LoaderCircle, Search } from "lucide-react";
import { cn } from "../../lib/utils";
import type { MessageFilters, ThreadListRow } from "../../types/messages";
import { filters } from "../../lib/messagesComponent";
import { ThreadRow } from "./ThreadRow";

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
    <aside className="flex w-96 shrink-0 flex-col border-r border-border bg-white">
      <header className="border-b border-border px-4 py-4">
        <div className="mb-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold tracking-normal text-foreground">
            Messages
          </h1>
          <span className="font-mono text-xs text-muted-foreground">
            {rows.length}
          </span>
        </div>
        <label className="flex h-9 items-center gap-2 rounded-sm border border-border bg-white px-3 shadow-sm">
          <Search className="size-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search threads"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </label>
        <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
          {filters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => onFilterChange(filter.value)}
              className={cn(
                "h-8 shrink-0 rounded-sm border px-3 text-xs font-medium transition-colors duration-200",
                activeFilter === filter.value
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-border bg-white text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex h-40 items-center justify-center gap-2 text-sm text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin" />
            Loading threads
          </div>
        ) : rows.length === 0 ? (
          <div className="flex h-56 flex-col items-center justify-center gap-2 px-8 text-center text-sm text-muted-foreground">
            <Inbox className="size-8" />
            No matching ticket conversations.
          </div>
        ) : (
          <div className="divide-y divide-border">
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
