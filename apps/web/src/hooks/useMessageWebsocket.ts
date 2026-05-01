import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { InfiniteData } from "@tanstack/react-query";
import { messageKeys } from "../lib/messageParams";
import type {
  Message,
  MessagesPage,
  ThreadListRow,
} from "../lib/messageParams";

const MIN_BACKOFF_MS = 1_000;
const MAX_BACKOFF_MS = 30_000;

type WsEvent =
  | { type: "new_message"; message: Message }
  | { type: "thread_list_update"; row: ThreadListRow };

// ─── helpers ────────────────────────────────────────────────────────────────

function isMessageInCache(
  data: InfiniteData<MessagesPage> | undefined,
  id: string,
): boolean {
  if (!data) return false;
  return data.pages.some((p) => p.messages.some((m) => m.id === id));
}

function prependMessage(
  data: InfiniteData<MessagesPage> | undefined,
  message: Message,
): InfiniteData<MessagesPage> | undefined {
  if (!data || data.pages.length === 0) return data;
  const [first, ...rest] = data.pages;
  return {
    ...data,
    pages: [{ ...first, messages: [message, ...first.messages] }, ...rest],
  };
}

function patchThreadListRow(
  rows: ThreadListRow[] | undefined,
  updated: ThreadListRow,
): ThreadListRow[] | undefined {
  if (!rows) return rows;
  return rows.map((r) => (r.id === updated.id ? { ...r, ...updated } : r));
}

// ─── hook ────────────────────────────────────────────────────────────────────

export function useMessageWebSocket(threadId: string | null): void {
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const backoffRef = useRef(MIN_BACKOFF_MS);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const eventBufferRef = useRef<Message[]>([]);
  const unmountedRef = useRef(false);

  const drainBuffer = useCallback(
    (tid: string) => {
      const buffered = eventBufferRef.current.splice(0);
      if (buffered.length === 0) return;
      queryClient.setQueryData<InfiniteData<MessagesPage>>(
        messageKeys.messages(tid),
        (old) => {
          let data = old;
          for (const msg of buffered) {
            if (!isMessageInCache(data, msg.id)) {
              data = prependMessage(data, msg);
            }
          }
          return data;
        },
      );
    },
    [queryClient],
  );

  const handleNewMessage = useCallback(
    (tid: string, message: Message) => {
      const cacheData = queryClient.getQueryData<InfiniteData<MessagesPage>>(
        messageKeys.messages(tid),
      );
      const hasPages = cacheData && cacheData.pages.length > 0;

      if (!hasPages) {
        // First page not yet loaded — buffer until it arrives
        eventBufferRef.current.push(message);
        return;
      }

      if (isMessageInCache(cacheData, message.id)) return; // dedupe (optimistic already in)

      queryClient.setQueryData<InfiniteData<MessagesPage>>(
        messageKeys.messages(tid),
        (old) => prependMessage(old, message),
      );
    },
    [queryClient],
  );

  const handleThreadListUpdate = useCallback(
    (row: ThreadListRow) => {
      queryClient.setQueriesData<ThreadListRow[]>(
        { queryKey: ["messages", "threads"] },
        (old) => patchThreadListRow(old, row),
      );
    },
    [queryClient],
  );

  const connect = useCallback(
    (tid: string) => {
      if (unmountedRef.current) return;

      const wsUrl = `${import.meta.env.VITE_WS_BASE_URL}/threads/${tid}/ws`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        backoffRef.current = MIN_BACKOFF_MS;
        // On reconnect, refetch latest page to fill any gap during disconnect
        queryClient
          .fetchQuery({ queryKey: messageKeys.messages(tid) })
          .then(() => {
            drainBuffer(tid);
          });
      };

      ws.onmessage = (event) => {
        let parsed: WsEvent;
        try {
          parsed = JSON.parse(event.data as string) as WsEvent;
        } catch {
          return;
        }
        if (parsed.type === "new_message")
          handleNewMessage(tid, parsed.message);
        else if (parsed.type === "thread_list_update")
          handleThreadListUpdate(parsed.row);
      };

      ws.onclose = (e) => {
        wsRef.current = null;
        if (unmountedRef.current) return;
        if (e.wasClean) {
          backoffRef.current = MIN_BACKOFF_MS;
          return;
        }
        // Reconnect with exponential backoff
        retryTimerRef.current = setTimeout(() => {
          backoffRef.current = Math.min(backoffRef.current * 2, MAX_BACKOFF_MS);
          connect(tid);
        }, backoffRef.current);
      };

      ws.onerror = () => {
        ws.close();
      };
    },
    [queryClient, drainBuffer, handleNewMessage, handleThreadListUpdate],
  );

  useEffect(() => {
    if (!threadId) return;

    unmountedRef.current = false;
    eventBufferRef.current = [];
    backoffRef.current = MIN_BACKOFF_MS;

    connect(threadId);

    // Watch for first page landing so we can drain the buffer
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (
        event.type === "updated" &&
        event.query.queryKey[0] === "messages" &&
        event.query.queryKey[3] === "messages" &&
        event.query.queryKey[2] === threadId
      ) {
        const data = event.query.state.data as
          | InfiniteData<MessagesPage>
          | undefined;
        if (
          data &&
          data.pages.length > 0 &&
          eventBufferRef.current.length > 0
        ) {
          drainBuffer(threadId);
        }
      }
    });

    return () => {
      unmountedRef.current = true;
      unsubscribe();
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null; // prevent reconnect on intentional close
        wsRef.current.close();
        wsRef.current = null;
      }
      eventBufferRef.current = [];
    };
  }, [threadId, connect, drainBuffer, queryClient]);
}
