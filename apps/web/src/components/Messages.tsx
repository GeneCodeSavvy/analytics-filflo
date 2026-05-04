import {
  ArrowUpRight,
  Clock,
  Inbox,
  LoaderCircle,
  Paperclip,
  Search,
  Send,
  User,
} from "lucide-react";
import {
  type KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "../lib/utils";
import type {
  Message,
  MessageFilters,
  Thread,
  ThreadListRow,
} from "../types/messages";
import {
  CURRENT_USER_ID,
  filters,
  firstName,
  formatFileSize,
  formatRelative,
  formatTime,
  priorityClasses,
  rendersAsSystemMessage,
  sortThreadRows,
  statusClasses,
} from "../lib/messagesComponent";
import {
  useThreadListQuery,
  useThreadMessagesQuery,
  useThreadQuery,
} from "../hooks/useMessageQuery";
import {
  useMarkThreadReadMutation,
  useSendMessageMutation,
} from "../hooks/useMessageMutations";
import { useMessageWebSocket } from "../hooks/useMessageWebsocket";
import { useMessageStore } from "../stores/useMessageStore";

function Badge({
  value,
  tone,
}: {
  value: string;
  tone: "status" | "priority";
}) {
  const classes =
    tone === "status" ? statusClasses[value] : priorityClasses[value];
  return (
    <span
      className={cn(
        "inline-flex h-5 shrink-0 items-center rounded-sm border px-1.5 font-mono text-[10px] font-medium leading-none",
        classes ?? "border-zinc-300 bg-zinc-50 text-zinc-700",
      )}
    >
      {value.replace("_", " ")}
    </span>
  );
}

function ParticipantAvatar({
  user,
  index,
}: {
  user: Thread["participants"][number];
  index: number;
}) {
  return (
    <span
      className={cn(
        "flex size-7 items-center justify-center rounded-full border border-border bg-white text-zinc-600 shadow-sm",
        index > 0 && "-ml-2",
      )}
      title={user.name}
    >
      {user.avatarUrl ? (
        <img
          src={user.avatarUrl}
          alt=""
          className="size-full rounded-full object-cover"
        />
      ) : (
        <User className="size-3.5" />
      )}
    </span>
  );
}

function ThreadRow({
  row,
  active,
  onSelect,
}: {
  row: ThreadListRow;
  active: boolean;
  onSelect: () => void;
}) {
  const resolved = row.ticket.status === "RESOLVED";
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group relative w-full border-l-2 border-l-transparent px-4 py-3 text-left transition-colors duration-200 hover:bg-muted/50",
        active && "border-l-zinc-950 bg-muted",
        resolved && "opacity-60",
      )}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <span className="shrink-0 font-mono text-[11px] font-medium text-muted-foreground">
              #{row.ticket.id}
            </span>
            <span className="truncate text-sm font-semibold text-foreground">
              {row.ticket.subject}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge value={row.ticket.priority} tone="priority" />
            <Badge value={row.ticket.status} tone="status" />
          </div>
          <p className="mt-2 truncate text-xs leading-5 text-muted-foreground">
            <span className="font-medium text-zinc-700">
              {firstName(row.lastMessage.senderName)}:
            </span>{" "}
            {row.lastMessage.snippet}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <span className="font-mono text-[10px] text-muted-foreground">
            {formatRelative(row.lastMessage.at)}
          </span>
          {row.unreadCount > 0 ? (
            <span className="size-2 rounded-full bg-zinc-950" />
          ) : null}
        </div>
      </div>
    </button>
  );
}

function SystemMessage({ message }: { message: Message }) {
  return (
    <div className="flex items-center gap-3 py-2 text-xs text-muted-foreground">
      <span className="h-px flex-1 bg-border" />
      <span className="inline-flex max-w-[70%] items-center gap-1.5 rounded-sm bg-muted px-2.5 py-1">
        <Clock className="size-3.5" />
        <span className="truncate">
          Ticket activity • {formatTime(message.at)}
        </span>
      </span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

function FileAttachment({ file }: { file: NonNullable<Message["file"]> }) {
  return (
    <a
      href={file.url}
      className="mt-2 flex items-center gap-2 rounded-sm border border-border bg-white px-3 py-2 text-xs text-zinc-700 shadow-sm transition-colors hover:bg-muted/60"
    >
      <Paperclip className="size-3.5 text-muted-foreground" />
      <span className="min-w-0 flex-1 truncate font-medium">{file.name}</span>
      <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
        {formatFileSize(file.size)}
      </span>
    </a>
  );
}

function UserMessage({
  message,
  justSent,
}: {
  message: Message;
  justSent: boolean;
}) {
  const own = message.sender.id === CURRENT_USER_ID;
  return (
    <div
      className={cn(
        "flex w-full",
        own ? "justify-end" : "justify-start",
        justSent && "animate-in slide-in-from-bottom-2 fade-in",
      )}
    >
      <div className={cn("max-w-[72%]", own && "text-right")}>
        <div className="mb-1 flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="font-medium text-zinc-700">
            {own ? "You" : message.sender.name}
          </span>
          <span className="font-mono">{formatTime(message.at)}</span>
        </div>
        <div
          className={cn(
            "rounded-sm px-3 py-2 text-sm leading-6 shadow-sm",
            own
              ? "bg-zinc-900 text-white"
              : "border border-border bg-white text-foreground",
          )}
        >
          {message.content ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : null}
          {message.file ? <FileAttachment file={message.file} /> : null}
        </div>
      </div>
    </div>
  );
}

function ThreadHeader({ thread }: { thread: Thread }) {
  return (
    <header className="flex min-h-20 items-center justify-between gap-4 border-b border-border bg-white px-5 py-3">
      <div className="min-w-0">
        <div className="mb-1 flex items-center gap-2">
          <span className="font-mono text-xs font-medium text-muted-foreground">
            #{thread.ticket.id}
          </span>
          <Badge value={thread.ticket.status} tone="status" />
          <Badge value={thread.ticket.priority} tone="priority" />
        </div>
        <h2 className="truncate text-base font-semibold leading-6 text-foreground">
          {thread.ticket.subject}
        </h2>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {thread.ticket.orgName}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-4">
        <div className="flex items-center">
          {thread.participants.slice(0, 4).map((participant, index) => (
            <ParticipantAvatar
              key={participant.id}
              user={participant}
              index={index}
            />
          ))}
        </div>
        <button
          type="button"
          className="inline-flex h-8 items-center gap-2 rounded-sm border border-border bg-white px-3 text-xs font-medium text-foreground shadow-sm transition-colors hover:bg-muted/60"
        >
          <ArrowUpRight className="size-3.5" />
          View Ticket
        </button>
      </div>
    </header>
  );
}

function Composer({
  value,
  disabled,
  sending,
  onChange,
  onSend,
}: {
  value: string;
  disabled: boolean;
  sending: boolean;
  onChange: (value: string) => void;
  onSend: () => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "0px";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 144)}px`;
  }, [value]);

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      onSend();
    }
  };

  return (
    <footer className="border-t border-border bg-white px-5 py-4">
      <div className="rounded-sm border border-border bg-white shadow-sm focus-within:ring-1 focus-within:ring-zinc-900">
        <textarea
          ref={textareaRef}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Reply with ticket context..."
          rows={2}
          className="max-h-36 min-h-20 w-full resize-none bg-transparent px-3 py-3 text-sm leading-6 text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-60"
        />
        <div className="flex items-center justify-between border-t border-border px-2 py-2">
          <button
            type="button"
            className="inline-flex size-8 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Attach file"
          >
            <Paperclip className="size-4" />
          </button>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-muted-foreground sm:inline">
              Press ⌘↵ to send
            </span>
            <button
              type="button"
              onClick={onSend}
              disabled={disabled || sending || value.trim().length === 0}
              className="inline-flex h-8 items-center gap-2 rounded-sm bg-zinc-900 px-3 text-xs font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-300"
            >
              {sending ? (
                <LoaderCircle className="size-3.5 animate-spin" />
              ) : (
                <Send className="size-3.5" />
              )}
              Send
            </button>
          </div>
        </div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Use @ to mention, # to reference tickets.
      </p>
    </footer>
  );
}

export const Messages = () => {
  const [activeFilter, setActiveFilter] =
    useState<MessageFilters["tab"]>("all");
  const [search, setSearch] = useState("");
  const [orgId, setOrgId] = useState<string | undefined>(undefined);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [lastSentId, setLastSentId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const { saveDraft, clearDraft, getDraft } = useMessageStore();

  const queryFilters = useMemo<MessageFilters>(
    () => ({
      tab: activeFilter,
      q: search.trim() || undefined,
      orgId: activeFilter === "org" ? orgId : undefined,
    }),
    [activeFilter, orgId, search],
  );

  const threadListQuery = useThreadListQuery(queryFilters);
  const rows = useMemo(() => {
    return sortThreadRows(threadListQuery.data ?? []);
  }, [threadListQuery.data]);

  useEffect(() => {
    if (!activeThreadId && rows[0]) {
      setActiveThreadId(rows[0].id);
      if (!orgId) setOrgId(rows[0].ticket.orgId);
    }
  }, [activeThreadId, orgId, rows]);

  useEffect(() => {
    if (activeFilter === "org" && !orgId && rows[0]) {
      setOrgId(rows[0].ticket.orgId);
    }
  }, [activeFilter, orgId, rows]);

  const activeThreadQuery = useThreadQuery(activeThreadId);
  const messagesQuery = useThreadMessagesQuery(activeThreadId);
  useMessageWebSocket(activeThreadId);

  const sendMutation = useSendMessageMutation(activeThreadId ?? "");
  const markReadMutation = useMarkThreadReadMutation();
  const draft = activeThreadId ? getDraft(activeThreadId) : "";

  const messages = useMemo(() => {
    const all =
      messagesQuery.data?.pages.flatMap((page) => page.messages) ?? [];
    return all.toSorted(
      (a, b) => new Date(a.at).getTime() - new Date(b.at).getTime(),
    );
  }, [messagesQuery.data]);

  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return;
    scroller.scrollTop = scroller.scrollHeight;
  }, [activeThreadId, messages.length]);

  useEffect(() => {
    if (!activeThreadId) return;
    const row = rows.find((item) => item.id === activeThreadId);
    if (row && row.unreadCount > 0) {
      markReadMutation.mutate(activeThreadId);
    }
  }, [activeThreadId, markReadMutation, rows]);

  const activeThread = activeThreadQuery.data;
  const canSend = Boolean(activeThread?.permissions.canSend);

  const handleSend = () => {
    if (!activeThreadId || draft.trim().length === 0 || !canSend) return;
    const pendingId = `pending-${Date.now()}`;
    setLastSentId(pendingId);
    sendMutation.mutate(
      {
        _pendingId: pendingId,
        content: draft.trim(),
        ticketRefs: activeThread ? [activeThread.ticket.id] : undefined,
      },
      {
        onSuccess: (message) => setLastSentId(message.id),
      },
    );
    clearDraft(activeThreadId);
  };

  return (
    <main className="flex h-full min-h-[calc(100svh-5rem)] overflow-hidden bg-white text-foreground">
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
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search threads"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </label>
          <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
            {filters.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setActiveFilter(filter.value)}
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
          {threadListQuery.isLoading ? (
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
                  onSelect={() => {
                    setActiveThreadId(row.id);
                    setOrgId(row.ticket.orgId);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col bg-muted/20">
        {activeThread ? (
          <>
            <ThreadHeader thread={activeThread} />
            <div
              ref={scrollRef}
              className="min-h-0 flex-1 overflow-y-auto px-6 py-5"
            >
              <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
                {messagesQuery.isLoading ? (
                  <div className="flex h-40 items-center justify-center gap-2 text-sm text-muted-foreground">
                    <LoaderCircle className="size-4 animate-spin" />
                    Loading conversation
                  </div>
                ) : (
                  messages.map((message) =>
                    rendersAsSystemMessage(message) ? (
                      <SystemMessage key={message.id} message={message} />
                    ) : (
                      <UserMessage
                        key={message.id}
                        message={message}
                        justSent={message.id === lastSentId}
                      />
                    ),
                  )
                )}
              </div>
            </div>
            <Composer
              value={draft}
              disabled={!canSend}
              sending={sendMutation.isPending}
              onChange={(value) =>
                activeThreadId && saveDraft(activeThreadId, value)
              }
              onSend={handleSend}
            />
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
            <Inbox className="size-9" />
            Select a ticket conversation.
          </div>
        )}
      </section>
    </main>
  );
};
