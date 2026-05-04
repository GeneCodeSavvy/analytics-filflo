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
    <main className="app-page-frame messages-page">
      <div className="app-page-frame-content flex h-full min-h-[calc(100svh-5rem)] overflow-hidden bg-white text-foreground">
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
        <section className="flex min-w-0 flex-1 flex-col bg-muted/20">
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
        </section>
      </div>
    </main>
  );
}
