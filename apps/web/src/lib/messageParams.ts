export { MessageKindSchema } from "@shared/schema/domain";
export {
  MessageSchema,
  ThreadListRowSchema,
  ThreadSchema,
  MessageFiltersSchema,
  MessagePageParamsSchema,
  SendMessagePayloadSchema,
  FileUploadResponseSchema,
  MessagesPageSchema,
} from "@shared/schema/messages";

export type {
  MessageKind,
  Message,
  ThreadListRow,
  Thread,
  MessageFilters,
  MessagePageParams,
  SendMessagePayload,
  FileUploadResponse,
  MessagesPage,
} from "@shared/schema/messages";

import type { MessageFilters } from "@shared/schema/messages";

// Stable sorted key object — same pattern as buildListKey in ticketParams.ts
export function buildThreadListKey(
  filters: MessageFilters,
): Record<string, unknown> {
  const entries = Object.entries(filters).filter(
    ([, v]) => v !== undefined && v !== "",
  );
  const sorted = entries.sort(([a], [b]) => a.localeCompare(b));
  const result: Record<string, unknown> = {};
  for (const [key, value] of sorted) {
    result[key] = value;
  }
  return result;
}

// Cache key factory — single source of truth for all message cache keys.
// Both mutation hooks and WS hook import from here; drift is impossible.
export const messageKeys = {
  threads: (filters: MessageFilters) =>
    ["messages", "threads", buildThreadListKey(filters)] as const,
  thread: (id: string) => ["messages", "thread", id] as const,
  messages: (threadId: string) =>
    ["messages", "thread", threadId, "messages"] as const,
  participants: (threadId: string, q: string) =>
    ["messages", "participants", threadId, q] as const,
};

// Read MessageFilters from URL search params
export function parseMessageParams(params: URLSearchParams): MessageFilters {
  return {
    tab: (params.get("tab") as MessageFilters["tab"]) ?? "all",
    orgId: params.get("orgId") ?? undefined,
    q: params.get("q") ?? undefined,
  };
}

// Serialize MessageFilters back to URLSearchParams (for useNavigate / setSearchParams)
export function serializeMessageParams(
  filters: MessageFilters,
): URLSearchParams {
  const p = new URLSearchParams();
  if (filters.tab && filters.tab !== "all") p.set("tab", filters.tab);
  if (filters.orgId) p.set("orgId", filters.orgId);
  if (filters.q) p.set("q", filters.q);
  return p;
}

// Extract MessageFilters from a cached query key (used in filter-aware cache patching).
// Query key shape: ['messages', 'threads', Record<string, unknown>]
export function parseFiltersFromKey(
  queryKey: readonly unknown[],
): Pick<MessageFilters, "tab"> | null {
  if (queryKey[0] !== "messages" || queryKey[1] !== "threads") return null;
  const keyObj = queryKey[2] as Record<string, unknown> | undefined;
  if (!keyObj) return null;
  return { tab: (keyObj["tab"] as MessageFilters["tab"]) ?? "all" };
}
