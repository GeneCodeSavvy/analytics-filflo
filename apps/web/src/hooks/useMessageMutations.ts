import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { InfiniteData } from "@tanstack/react-query";
import { messageApi } from "../api/messageApi";
import { messageKeys, parseFiltersFromKey } from "../lib/messageParams";
import type {
  Message,
  MessagesPage,
  ThreadListRow,
  SendMessagePayload,
  FileUploadResponse,
} from "../types/messages";

// ─── helpers ────────────────────────────────────────────────────────────────

function prependToInfinitePages(
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

function replaceInInfinitePages(
  data: InfiniteData<MessagesPage> | undefined,
  pendingId: string,
  real: Message,
): InfiniteData<MessagesPage> | undefined {
  if (!data) return data;
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      messages: page.messages.map((m) => (m.id === pendingId ? real : m)),
    })),
  };
}
type SendMessageMutationContext = {
  previous: InfiniteData<MessagesPage> | undefined;
  _pendingId: string;
};

// ─── useSendMessageMutation ──────────────────────────────────────────────────

export function useSendMessageMutation(threadId: string) {
  const queryClient = useQueryClient();

  return useMutation<
    Message,
    Error,
    SendMessagePayload & { _pendingId: string },
    SendMessageMutationContext
  >({
    mutationFn: ({ _pendingId: _, ...payload }) =>
      messageApi.send(threadId, payload),
    onMutate: async ({ _pendingId, ...payload }) => {
      await queryClient.cancelQueries({
        queryKey: messageKeys.messages(threadId),
      });

      const previous = queryClient.getQueryData<InfiniteData<MessagesPage>>(
        messageKeys.messages(threadId),
      );

      // Guard: no pages yet → skip optimistic append; WS/server will deliver
      if (previous && previous.pages.length > 0) {
        const optimistic: Message = {
          id: _pendingId,
          threadId,
          kind: "USER_MESSAGE",
          sender: { id: "", name: "", email: "", role: "USER", orgId: "" },
          at: new Date().toISOString(),
          content: payload.content,
          ticketRefs: payload.ticketRefs ?? [],
        };
        queryClient.setQueryData<InfiniteData<MessagesPage>>(
          messageKeys.messages(threadId),
          (old) => prependToInfinitePages(old, optimistic),
        );
      }

      return { previous, _pendingId };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous !== undefined) {
        queryClient.setQueryData(messageKeys.messages(threadId), ctx.previous);
      }
    },
    onSuccess: (real, _vars, ctx) => {
      if (ctx?._pendingId) {
        queryClient.setQueryData<InfiniteData<MessagesPage>>(
          messageKeys.messages(threadId),
          (old) => replaceInInfinitePages(old, ctx._pendingId, real),
        );
      }
    },
    onSettled: () => {
      // Invalidate thread list so snippet + unreadCount update.
      // Do NOT invalidate messageKeys.messages — WS is live truth.
      queryClient.invalidateQueries({
        queryKey: ["messages", "threads"],
        refetchType: "active",
      });
    },
  });
}

// ─── useMarkThreadReadMutation ───────────────────────────────────────────────

export function useMarkThreadReadMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (threadId) => messageApi.markThreadRead(threadId),
    onMutate: async (threadId) => {
      // Collect snapshots for rollback
      const snapshots = queryClient.getQueriesData<ThreadListRow[]>({
        queryKey: ["messages", "threads"],
      });

      // Filter-aware patch: remove from 'unread' tab, patch unreadCount elsewhere
      for (const [key, data] of snapshots) {
        if (!data) continue;
        const f = parseFiltersFromKey(key);
        if (f?.tab === "unread") {
          queryClient.setQueryData<ThreadListRow[]>(
            key,
            data.filter((row) => row.id !== threadId),
          );
        } else {
          queryClient.setQueryData<ThreadListRow[]>(
            key,
            data.map((row) =>
              row.id === threadId ? { ...row, unreadCount: 0 } : row,
            ),
          );
        }
      }

      return { snapshots };
    },
    onError: (_err, _vars, ctx) => {
      const { snapshots } = ctx as {
        snapshots: [readonly unknown[], ThreadListRow[] | undefined][];
      };
      for (const [key, data] of snapshots) {
        queryClient.setQueryData(key, data);
      }
    },
  });
}

// ─── useJoinThreadMutation ───────────────────────────────────────────────────

export function useJoinThreadMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (threadId) => messageApi.joinThread(threadId),
    onSettled: (_data, _err, threadId) => {
      queryClient.invalidateQueries({ queryKey: messageKeys.thread(threadId) });
    },
  });
}

// ─── useMuteThreadMutation / useUnmuteThreadMutation ─────────────────────────

export function useMuteThreadMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (threadId) => messageApi.muteThread(threadId),
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["messages", "threads"],
        refetchType: "active",
      });
    },
  });
}

export function useUnmuteThreadMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (threadId) => messageApi.unmuteThread(threadId),
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["messages", "threads"],
        refetchType: "active",
      });
    },
  });
}

// ─── useAddParticipantMutation ───────────────────────────────────────────────

export function useAddParticipantMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { threadId: string; userId: string }>({
    mutationFn: ({ threadId, userId }) =>
      messageApi.addParticipant(threadId, userId),
    onSettled: (_data, _err, { threadId }) => {
      queryClient.invalidateQueries({ queryKey: messageKeys.thread(threadId) });
    },
  });
}

// ─── useCreateThreadMutation ─────────────────────────────────────────────────

export function useCreateThreadMutation() {
  const queryClient = useQueryClient();

  return useMutation<ThreadListRow, Error, string>({
    mutationFn: (ticketId) => messageApi.createThread(ticketId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["messages", "threads"],
        refetchType: "active",
      });
    },
  });
}

// ─── useUploadFileMutation ───────────────────────────────────────────────────
// Returns { fileId, url, thumbnailUrl? }. Caller (composer) stages the fileId
// in local component state — this mutation has NO Zustand side-effects.

export function useUploadFileMutation(threadId: string) {
  return useMutation<FileUploadResponse, Error, File>({
    mutationFn: (file) => messageApi.uploadFile(threadId, file),
    // onError is handled inline by the caller (show error below file preview, not toast)
  });
}
