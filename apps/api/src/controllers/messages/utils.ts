import {
  MessageFilters,
  MessageFiltersSchema,
  MessagePageParamsSchema,
} from "@shared/schema/messages";
import { Prisma, TicketParticipantRole } from "@prisma/client";
import { getQuerySource, toNumber } from "../../lib/controllers";

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

export const buildThreadWhere = (
  filters: MessageFilters,
  currentUserId?: string,
): Prisma.ThreadWhereInput => {
  const query = filters.q?.trim().toLowerCase();

  return {
    ...(filters.orgId ? { ticket: { orgId: filters.orgId } } : {}),
    ...(query
      ? {
          OR: [
            { ticket: { subject: { contains: query, mode: "insensitive" } } },
            {
              messages: {
                some: {
                  deletedAt: null,
                  content: { contains: query, mode: "insensitive" },
                },
              },
            },
          ],
        }
      : {}),
    ...(filters.tab === "mine" && currentUserId
      ? {
          ticket: {
            ...(filters.orgId ? { orgId: filters.orgId } : {}),
            participants: {
              some: {
                userId: currentUserId,
                role: TicketParticipantRole.ASSIGNEE,
              },
            },
          },
        }
      : {}),
  };
};
