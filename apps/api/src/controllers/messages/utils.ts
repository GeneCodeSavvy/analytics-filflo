import {
  MessageFiltersSchema,
  MessagePageParamsSchema,
} from "@shared/schema/messages";
import { getQuerySource, toNumber } from "../../lib/controllers";
import { messagesByThread, threadRows, threads } from "./data";

export const parseMessageFilters = (query: unknown) => {
  const source = getQuerySource(query);

  return MessageFiltersSchema.safeParse({
    tab: source.tab,
    orgId: source.orgId,
    q: source.q,
  });
};

export const parseMessagePageParams = (query: unknown) => {
  const source = getQuerySource(query);

  return MessagePageParamsSchema.safeParse({
    cursor: source.cursor,
    limit: toNumber(source.limit) ?? 50,
  });
};

export const getThreadById = (id: string) =>
  threads.find((thread) => thread.id === id);

export const getThreadMessages = (threadId: string) =>
  messagesByThread[threadId] ?? [];

export const filterThreadRows = (
  filters: ReturnType<typeof MessageFiltersSchema.parse>,
) => {
  const query = filters.q?.trim().toLowerCase();

  return threadRows.filter((row) => {
    const matchesOrg = filters.orgId === undefined || row.ticket.orgId === filters.orgId;
    const matchesQuery =
      query === undefined ||
      row.ticket.subject.toLowerCase().includes(query) ||
      row.lastMessage.snippet.toLowerCase().includes(query);
    const matchesTab =
      filters.tab === "all" ||
      (filters.tab === "unread" && row.unreadCount > 0) ||
      (filters.tab === "mine" &&
        row.participantsPreview.some((participant) => participant.id === "usr-201")) ||
      (filters.tab === "org" && filters.orgId !== undefined && matchesOrg);

    return matchesOrg && matchesQuery && matchesTab;
  });
};
