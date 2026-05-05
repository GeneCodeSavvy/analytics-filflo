import { api } from ".";
import type {
  MessageFilters,
  Thread,
  ThreadListRow,
  Message,
  SendMessagePayload,
  MessagesPage,
  FileUploadResponse,
} from "../types/messages";

/**
 * Message/thread API client.
 *
 * Permission model enforced by the API:
 * - SUPER_ADMIN can read and write every thread.
 * - MODERATOR can read and write threads for tickets in their own org.
 * - ADMIN can read and write only threads for tickets where they are an
 *   ASSIGNEE participant.
 * - USER can read and write only threads where they are a ticket participant
 *   (REQUESTER or ASSIGNEE).
 * - orgId filters are honored only when the actor is allowed to see that org;
 *   org-scoped actors get 403 when explicitly requesting another org.
 *
 * Frontend guidance:
 * - Use DB-backed auth state for role/org decisions; do not rely on raw Clerk
 *   publicMetadata.
 * - Hide impossible actions for UX, but handle 403 because backend permissions
 *   are authoritative.
 * - The shared axios wrapper unwraps response.data, so these methods resolve
 *   directly to typed payloads.
 */
export const messageApi = {
  /** List threads visible to the current actor. */
  getThreads: (
    filters: MessageFilters,
    signal?: AbortSignal,
  ): Promise<ThreadListRow[]> =>
    api.get("/threads", { params: filters, signal }),

  /** Get a visible thread by id. Missing threads return 404; forbidden threads
   * return 403.
   */
  getThread: (threadId: string, signal?: AbortSignal): Promise<Thread> =>
    api.get(`/threads/${threadId}`, { signal }),

  /** Get messages for a visible thread.
   * Returns { messages, nextCursor? }. pages[0] = most recent 50; scroll-up
   * fetches older.
   */
  getMessages: (
    threadId: string,
    cursor?: string,
    signal?: AbortSignal,
  ): Promise<MessagesPage> =>
    api.get(`/threads/${threadId}/messages`, {
      params: { ...(cursor ? { cursor } : {}), limit: 50 },
      signal,
    }),

  /** Send a message to a writable thread. */
  send: (threadId: string, payload: SendMessagePayload): Promise<Message> =>
    api.post(`/threads/${threadId}/messages`, payload),

  /** Mark a visible thread as read for the current actor. */
  markThreadRead: (threadId: string): Promise<void> =>
    api.patch(`/threads/${threadId}/read`),

  /** Planned client method. Backend route is not mounted yet. */
  addParticipant: (threadId: string, userId: string): Promise<void> =>
    api.post(`/threads/${threadId}/participants`, { userId }),

  /** Join a readable thread as an assignee when backend policy allows it. */
  joinThread: (threadId: string): Promise<void> =>
    api.post(`/threads/${threadId}/join`),

  /** Planned client method. Backend route is not mounted yet. */
  muteThread: (threadId: string): Promise<void> =>
    api.post(`/threads/${threadId}/mute`),

  /** Planned client method. Backend route is not mounted yet. */
  unmuteThread: (threadId: string): Promise<void> =>
    api.delete(`/threads/${threadId}/mute`),

  /** Create a new thread for a ticket. Returns the created ThreadListRow. */
  createThread: (ticketId: string): Promise<ThreadListRow> =>
    api.post("/threads", { ticketId }),

  /** Upload a file placeholder for a writable thread. */
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
