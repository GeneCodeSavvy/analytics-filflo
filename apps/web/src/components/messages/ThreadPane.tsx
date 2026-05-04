import { Inbox, LoaderCircle } from "lucide-react";
import type { RefObject } from "react";
import type { Message, Thread } from "../../types/messages";
import { rendersAsSystemMessage } from "../../lib/messagesComponent";
import { ThreadHeader } from "./ThreadHeader";
import { SystemMessage } from "./SystemMessage";
import { UserMessage } from "./UserMessage";
import { Composer } from "./Composer";

type ThreadPaneProps = {
  thread: Thread | undefined;
  messages: Message[];
  messagesLoading: boolean;
  lastSentId: string | null;
  draft: string;
  canSend: boolean;
  sending: boolean;
  scrollRef: RefObject<HTMLDivElement | null>;
  onDraftChange: (value: string) => void;
  onSend: () => void;
};

export function ThreadPane({
  thread,
  messages,
  messagesLoading,
  lastSentId,
  draft,
  canSend,
  sending,
  scrollRef,
  onDraftChange,
  onSend,
}: ThreadPaneProps) {
  if (!thread) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
        <Inbox className="size-9" />
        Select a ticket conversation.
      </div>
    );
  }

  return (
    <>
      <ThreadHeader thread={thread} />
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
          {messagesLoading ? (
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
        sending={sending}
        onChange={onDraftChange}
        onSend={onSend}
      />
    </>
  );
}
