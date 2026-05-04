import { useEffect, useMemo, useRef, useState } from "react";
import type { MessageFilters } from "../../types/messages";
import { sortThreadRows } from "../../lib/messagesComponent";
import {
  useThreadListQuery,
  useThreadMessagesQuery,
  useThreadQuery,
} from "../../hooks/useMessageQuery";
import {
  useMarkThreadReadMutation,
  useSendMessageMutation,
} from "../../hooks/useMessageMutations";
import { useMessageWebSocket } from "../../hooks/useMessageWebsocket";
import { useMessageStore } from "../../stores/useMessageStore";
import { ThreadList } from "./ThreadList";
import { ThreadPane } from "./ThreadPane";
import { messagePage } from "./styles";

export function Messages() {
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
  const unreadCount = rows.reduce((total, row) => total + row.unreadCount, 0);

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
    <main className={messagePage}>
      <div className="app-page-frame-content flex h-full min-h-[calc(100svh-5rem)] flex-col overflow-hidden">
        <header className="sticky top-0 z-20 flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-[--border-default] bg-[--surface-page] py-3">
          <div>
            <h1 className="text-[30px] font-bold leading-none text-[--ink-1]">
              Messages
            </h1>
            <p className="mt-1 text-[13px] text-[--ink-3]">
              Ticket conversations with {unreadCount} unread updates
            </p>
          </div>
          <div className="rounded-[--radius-md] border border-[--border-default] bg-[--surface-card] px-3 py-2 text-[12px] text-[--ink-2] shadow-[--elev-1]">
            {rows.length} active threads
          </div>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-[minmax(320px,380px)_minmax(0,1fr)] gap-4 py-4 max-[900px]:grid-cols-1">
          <ThreadList
            rows={rows}
            isLoading={threadListQuery.isLoading}
            activeFilter={activeFilter}
            search={search}
            activeThreadId={activeThreadId}
            onFilterChange={setActiveFilter}
            onSearchChange={setSearch}
            onSelectThread={(id, newOrgId) => {
              setActiveThreadId(id);
              setOrgId(newOrgId);
            }}
          />
          <ThreadPane
            thread={activeThread}
            messages={messages}
            messagesLoading={messagesQuery.isLoading}
            lastSentId={lastSentId}
            draft={draft}
            canSend={canSend}
            sending={sendMutation.isPending}
            scrollRef={scrollRef}
            onDraftChange={(value) =>
              activeThreadId && saveDraft(activeThreadId, value)
            }
            onSend={handleSend}
          />
        </div>
      </div>
    </main>
  );
}
