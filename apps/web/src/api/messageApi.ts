import { api } from ".";
import type {
  MessageFilters,
  Thread,
  ThreadListRow,
  Message,
  SendMessagePayload,
  MessagesPage,
  FileUploadResponse,
} from "../lib/messageParams";

export const messageApi = {
  getThreads: (
    filters: MessageFilters,
    signal?: AbortSignal,
  ): Promise<ThreadListRow[]> =>
    api.get("/threads", { params: filters, signal }),

  getThread: (threadId: string, signal?: AbortSignal): Promise<Thread> =>
    api.get(`/threads/${threadId}`, { signal }),

  // Returns { messages, nextCursor? }. pages[0] = most recent 50; scroll-up fetches older.
  getMessages: (
    threadId: string,
    cursor?: string,
    signal?: AbortSignal,
  ): Promise<MessagesPage> =>
    api.get(`/threads/${threadId}/messages`, {
      params: { ...(cursor ? { cursor } : {}), limit: 50 },
      signal,
    }),

  send: (threadId: string, payload: SendMessagePayload): Promise<Message> =>
    api.post(`/threads/${threadId}/messages`, payload),

  markThreadRead: (threadId: string): Promise<void> =>
    api.patch(`/threads/${threadId}/read`),

  addParticipant: (threadId: string, userId: string): Promise<void> =>
    api.post(`/threads/${threadId}/participants`, { userId }),

  joinThread: (threadId: string): Promise<void> =>
    api.post(`/threads/${threadId}/join`),

  muteThread: (threadId: string): Promise<void> =>
    api.post(`/threads/${threadId}/mute`),

  unmuteThread: (threadId: string): Promise<void> =>
    api.delete(`/threads/${threadId}/mute`),

  uploadFile: (threadId: string, file: File): Promise<FileUploadResponse> => {
    const form = new FormData();
    form.append("file", file);
    return api.post(`/threads/${threadId}/files`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // getWebSocketUrl is intentionally absent — a synchronous string helper
  // has no place on this Promise<T>-contract object. See useMessageWebSocket.ts.
};
