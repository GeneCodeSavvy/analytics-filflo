import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { messageApi } from "../api/messageApi";
import { messageKeys, MessageFiltersSchema } from "../lib/messageParams";
import type {
  MessageFilters,
  Thread,
  ThreadListRow,
  MessagesPage,
} from "../lib/messageParams";
import type { UserRef } from "@shared/schema";

export function useThreadListQuery(filters: MessageFilters) {
  const validated = MessageFiltersSchema.parse(filters);
  return useQuery<ThreadListRow[]>({
    queryKey: messageKeys.threads(validated),
    queryFn: ({ signal }) => messageApi.getThreads(validated, signal),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}

export function useThreadQuery(threadId: string | null) {
  return useQuery<Thread>({
    queryKey: messageKeys.thread(threadId ?? ""),
    queryFn: ({ signal }) => messageApi.getThread(threadId!, signal),
    enabled: !!threadId,
  });
}

// pages[0] = most recent 50 messages. Scroll-up calls fetchNextPage → older messages.
// nextCursor on MessagesPage points to the next older batch.
export function useThreadMessagesQuery(threadId: string | null) {
  return useInfiniteQuery<MessagesPage>({
    queryKey: messageKeys.messages(threadId ?? ""),
    queryFn: ({ pageParam, signal }) =>
      messageApi.getMessages(
        threadId!,
        pageParam as string | undefined,
        signal,
      ),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined,
    enabled: !!threadId,
    staleTime: 5 * 60_000,
  });
}

// @mention autocomplete — minimum 2 chars, debounce upstream (300ms recommended)
export function useParticipantSearchQuery(q: string, threadId: string) {
  return useQuery<UserRef[]>({
    queryKey: messageKeys.participants(threadId, q),
    queryFn: ({ signal }) =>
      messageApi.getThreads({ tab: "all" }, signal).then(() => {
        // Placeholder: replace with real participant search endpoint when available.
        // The server endpoint is GET /threads/:threadId/participants?q=
        // Until then this returns an empty array to avoid import errors.
        return [] as UserRef[];
      }),
    enabled: q.length >= 2 && !!threadId,
    staleTime: 60_000,
  });
}
