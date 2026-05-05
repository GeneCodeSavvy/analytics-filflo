import { Inbox } from "lucide-react";
import { useEffect, useRef } from "react";
import { PageLoader } from "../PageLoader";
import type { RefObject } from "react";
import type { Message, Thread } from "../../types/messages";
import { rendersAsSystemMessage } from "../../lib/messagesComponent";
import { ThreadHeader } from "./ThreadHeader";
import { SystemMessage } from "./SystemMessage";
import { UserMessage } from "./UserMessage";
import { Composer } from "./Composer";
import { messagePanel } from "./styles";

type ThreadPaneProps = {
  thread: Thread | undefined;
  messages: Message[];
  messagesLoading: boolean;
  hasMoreMessages: boolean;
  isFetchingMore: boolean;
  lastSentId: string | null;
  draft: string;
  canSend: boolean;
  sending: boolean;
  scrollRef: RefObject<HTMLDivElement | null>;
  onDraftChange: (value: string) => void;
  onSend: () => void;
  onLoadMore: () => void;
};

export function ThreadPane({
  thread,
  messages,
  messagesLoading,
  hasMoreMessages,
  isFetchingMore,
  lastSentId,
  draft,
  canSend,
  sending,
  scrollRef,
  onDraftChange,
  onSend,
  onLoadMore,
}: ThreadPaneProps) {
  const topSentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const sentinel = topSentinelRef.current;
    if (!sentinel || !hasMoreMessages) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) onLoadMore();
      },
      { root: scrollRef.current, threshold: 0.1 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMoreMessages, onLoadMore, scrollRef]);

  if (!thread) {
    return (
      <section
        className={`${messagePanel} grid min-h-0 place-items-center overflow-hidden`}
      >
        <div className="text-center">
          <Inbox className="mx-auto size-9 text-[--ink-3]" />
          <p className="mt-3 mb-0 text-[13px] text-[--ink-3]">
            Select a ticket conversation.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      className={`${messagePanel} flex min-h-0 min-w-0 flex-col overflow-hidden`}
    >
      <ThreadHeader thread={thread} />
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto bg-[--surface-sunken] px-4 py-4"
      >
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-3">
          <div ref={topSentinelRef} />
          {isFetchingMore && (
            <PageLoader
              inline
              size={20}
              dotSize={3}
              className="h-10 bg-transparent py-2"
            />
          )}
          {messagesLoading ? (
            <PageLoader inline />
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
        sending={sending}
        onChange={onDraftChange}
        onSend={onSend}
      />
    </section>
  );
}
